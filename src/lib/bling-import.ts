import {
  audit,
  parseMoney,
  today,
  type Entry,
  type FinanceData,
  uid,
  validateEntry,
} from "./finance";

export type BlingImportMapping = {
  contacts: Record<string, string>;
  categories: Record<string, string>;
  accounts: Record<string, string>;
};

export type BlingImportSources = {
  contacts: string[];
  categories: string[];
  accounts: string[];
};

export type BlingImportPreview = {
  entries: Entry[];
  errors: string[];
  warnings: string[];
  duplicates: number;
  skippedTotals: number;
  total: number;
};

const requiredHeaders = [
  "data_pagamento",
  "cliente",
  "categoria",
  "conta_financeira",
  "data_vencimento",
  "valor",
];

function normalizeHeader(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replaceAll("º", "")
    .replaceAll("ª", "")
    .trim()
    .toLowerCase()
    .replaceAll(" ", "_");
}

function columnIndexes(headers: string[]) {
  return Object.fromEntries(
    headers.map((header, index) => [normalizeHeader(header), index]),
  );
}

export function isBlingReceivableCsv(headers: string[]) {
  const normalized = new Set(headers.map(normalizeHeader));
  return requiredHeaders.every((header) => normalized.has(header));
}

function value(row: string[], indexes: Record<string, number>, key: string) {
  const index = indexes[key];
  return index === undefined ? "" : (row[index] ?? "").trim();
}

function isTotalRow(row: string[], indexes: Record<string, number>) {
  return value(row, indexes, "data_pagamento").toLowerCase() === "total";
}

function normalizeDate(raw: string) {
  const input = raw.trim();
  const match = input.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  const normalized = match ? [match[3], match[2], match[1]].join("-") : input;
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(normalized) ||
    !Number.isFinite(Date.parse(normalized)) ||
    new Date(normalized + "T12:00:00Z").toISOString().slice(0, 10) !==
      normalized
  )
    throw new Error("Data inválida: " + raw);
  return normalized;
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

export function blingImportSources(rows: string[][]): BlingImportSources {
  const indexes = columnIndexes(rows[0] ?? []);
  const validRows = rows.slice(1).filter((row) => !isTotalRow(row, indexes));
  return {
    contacts: unique(validRows.map((row) => value(row, indexes, "cliente"))),
    categories: unique(
      validRows.map((row) => value(row, indexes, "categoria")),
    ),
    accounts: unique(
      validRows.map((row) => value(row, indexes, "conta_financeira")),
    ),
  };
}

function findByName(values: Array<{ id: string; name: string }>, name: string) {
  return values.find(
    (item) =>
      item.name.trim().toLocaleLowerCase("pt-BR") ===
      name.trim().toLocaleLowerCase("pt-BR"),
  )?.id;
}

export function createBlingImportMapping(
  data: FinanceData,
  sources: BlingImportSources,
): BlingImportMapping {
  return {
    contacts: Object.fromEntries(
      sources.contacts.map((name) => [
        name,
        findByName(data.contacts, name) ?? "",
      ]),
    ),
    categories: Object.fromEntries(
      sources.categories.map((name) => [
        name,
        findByName(
          data.categories.filter((category) => category.direction === "income"),
          name,
        ) ?? "",
      ]),
    ),
    accounts: Object.fromEntries(
      sources.accounts.map((name) => [
        name,
        findByName(data.accounts, name) ?? "",
      ]),
    ),
  };
}

function descriptionFor(client: string, category: string, origin: string) {
  return origin || client + " · " + category;
}

function notesFor(
  client: string,
  category: string,
  origin: string,
  document: string,
) {
  return [
    "Importado do CSV de contas a receber do Bling.",
    "Cliente no Bling: " + client,
    "Categoria no Bling: " + category,
    origin ? "Origem no Bling: " + origin : "",
    document ? "Nº documento no Bling: " + document : "",
  ]
    .filter(Boolean)
    .join(" · ");
}

export function previewBlingImport(
  rows: string[][],
  mapping: BlingImportMapping,
  data: FinanceData,
): BlingImportPreview {
  const entries: Entry[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];
  const indexes = columnIndexes(rows[0] ?? []);
  let duplicates = 0;
  let skippedTotals = 0;

  rows.slice(1).forEach((row, index) => {
    const line = index + 2;
    if (isTotalRow(row, indexes)) {
      skippedTotals++;
      return;
    }
    try {
      const client = value(row, indexes, "cliente");
      const category = value(row, indexes, "categoria");
      const account = value(row, indexes, "conta_financeira");
      const paymentDate = normalizeDate(value(row, indexes, "data_pagamento"));
      const dueDate = normalizeDate(value(row, indexes, "data_vencimento"));
      const amount = parseMoney(value(row, indexes, "valor"));
      const contactId = mapping.contacts[client] ?? "";
      const categoryId = mapping.categories[category] ?? "";
      const accountId = mapping.accounts[account] ?? "";
      if (!client) throw new Error("Cliente não informado.");
      if (!category) throw new Error("Categoria não informada.");
      if (!account) throw new Error("Conta financeira não informada.");
      if (!contactId)
        throw new Error(
          'Associe o cliente "' + client + '" a um contato do Maney.',
        );
      if (!categoryId)
        throw new Error(
          'Associe a categoria "' +
            category +
            '" a uma categoria de receita do Maney.',
        );
      if (!accountId)
        throw new Error(
          'Associe a conta "' + account + '" a uma conta financeira do Maney.',
        );
      if (!Number.isSafeInteger(amount) || amount <= 0)
        throw new Error("Valor inválido.");

      const document = value(row, indexes, "n_documento");
      const origin = value(row, indexes, "origem");
      const importKey = JSON.stringify([
        "bling-contas-receber",
        line,
        paymentDate,
        dueDate,
        client,
        category,
        account,
        document,
        amount,
      ]);
      const isSame = (entry: Entry) => entry.importKey === importKey;
      if (data.entries.some(isSame) || entries.some(isSame)) {
        duplicates++;
        return;
      }

      const entry: Entry = {
        id: uid(),
        direction: "income",
        description: descriptionFor(client, category, origin),
        amount,
        competence: dueDate,
        dueDate,
        categoryId,
        accountId,
        contactId,
        service: "",
        project: "",
        notes: notesFor(client, category, origin, document),
        importKey,
        payments: [
          {
            id: uid(),
            amount,
            date: paymentDate,
            accountId,
          },
        ],
        attachments: [],
        history: [audit("Importado do CSV de contas a receber do Bling.")],
      };
      validateEntry(entry);
      if (paymentDate > today())
        throw new Error("A data de pagamento não pode ser futura.");
      const openingDate = data.accounts.find(
        (item) => item.id === accountId,
      )?.openingDate;
      if (openingDate && paymentDate < openingDate)
        throw new Error(
          "A data de pagamento é anterior ao saldo inicial da conta.",
        );
      entries.push(entry);
    } catch (error) {
      errors.push("Linha " + line + ": " + (error as Error).message);
    }
  });

  if (skippedTotals)
    warnings.push(
      skippedTotals + " linha(s) de total do Bling foram ignoradas.",
    );

  return {
    entries,
    errors,
    warnings,
    duplicates,
    skippedTotals,
    total: entries.reduce((sum, entry) => sum + entry.amount, 0),
  };
}
