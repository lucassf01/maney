import {
  type FinanceData,
  type Entry,
  audit,
  parseMoney,
  uid,
  validateEntry,
} from "./finance";
import { download } from "./storage";
export function parseCsv(text: string): string[][] {
  const first = text.replace(/^\uFEFF/, "").split(/\r?\n/)[0];
  const separator =
    first.split(";").length > first.split(",").length ? ";" : ",";
  const rows: string[][] = [];
  let row: string[] = [],
    cell = "",
    quoted = false;
  text = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (quoted && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else quoted = !quoted;
    } else if (c === separator && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((c === "\n" || c === "\r") && !quoted) {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      if (row.some(Boolean)) rows.push(row);
      row = [];
      cell = "";
    } else cell += c;
  }
  if (quoted) throw new Error("CSV com aspas não fechadas.");
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}
export const csvColumns = [
  "tipo",
  "descricao",
  "valor",
  "competencia",
  "vencimento",
  "categoria",
  "contato",
  "conta",
  "servico",
  "observacoes",
  "valor_pago",
  "data_pagamento",
] as const;
export function exportEntries(data: FinanceData, entries = data.entries) {
  const rows: unknown[][] = [Array.from(csvColumns)];
  for (const e of entries)
    rows.push([
      e.direction === "income" ? "receber" : "pagar",
      e.description,
      (e.amount / 100).toFixed(2).replace(".", ","),
      e.competence,
      e.dueDate,
      data.categories.find((c) => c.id === e.categoryId)?.name,
      data.contacts.find((c) => c.id === e.contactId)?.name,
      data.accounts.find((a) => a.id === e.accountId)?.name,
      e.service,
      e.notes,
      (e.payments.reduce((s, p) => s + p.amount, 0) / 100)
        .toFixed(2)
        .replace(".", ","),
      e.payments.length === 1 ? e.payments[0].date : "",
    ]);
  exportCsv("maney-lancamentos.csv", rows);
}
export function exportCsv(name: string, rows: unknown[][]) {
  download(
    name,
    "\uFEFF" +
      rows
        .map((r) =>
          r
            .map((v) => {
              const s = String(v ?? "");
              const safe = /^[=+@\t\r-]/.test(s) ? `'${s}` : s;
              return `"${safe.replaceAll('"', '""')}"`;
            })
            .join(";"),
        )
        .join("\r\n"),
    "text/csv;charset=utf-8",
  );
}
function normalizeDate(s: string) {
  const value = s.trim();
  const m = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  const v = m ? `${m[3]}-${m[2]}-${m[1]}` : value;
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(v) ||
    !Number.isFinite(Date.parse(v)) ||
    new Date(v + "T12:00:00Z").toISOString().slice(0, 10) !== v
  )
    throw new Error(`Data inválida: ${s}`);
  return v;
}
export type ImportPreview = {
  entries: Entry[];
  errors: string[];
  duplicates: number;
  total: number;
};
export function previewImport(
  rows: string[][],
  mapping: Record<string, number>,
  data: FinanceData,
): ImportPreview {
  const entries: Entry[] = [],
    errors: string[] = [];
  let duplicates = 0;
  rows.slice(1).forEach((row, i) => {
    try {
      const v = (key: string) => (row[mapping[key]] ?? "").trim();
      const raw = v("tipo").toLowerCase();
      if (!["pagar", "receber", "despesa", "receita"].includes(raw))
        throw new Error("Tipo deve ser pagar ou receber.");
      const direction =
        raw === "receber" || raw === "receita" ? "income" : "expense";
      const categoryId = data.categories.find(
        (c) =>
          c.name.toLowerCase() === v("categoria").toLowerCase() &&
          c.direction === direction,
      )?.id;
      const accountId = data.accounts.find(
        (a) => a.name.toLowerCase() === v("conta").toLowerCase(),
      )?.id;
      if (!categoryId)
        throw new Error(
          `Cadastre a categoria "${v("categoria")}" com o tipo correto.`,
        );
      if (!accountId) throw new Error(`Cadastre a conta "${v("conta")}".`);
      const contactId = v("contato")
        ? data.contacts.find(
            (c) => c.name.toLowerCase() === v("contato").toLowerCase(),
          )?.id
        : "";
      if (v("contato") && !contactId)
        throw new Error(`Cadastre o contato "${v("contato")}".`);
      const amount = parseMoney(v("valor")),
        paidAmount = v("valor_pago") ? parseMoney(v("valor_pago")) : 0;
      if (
        !Number.isSafeInteger(paidAmount) ||
        paidAmount < 0 ||
        paidAmount > amount
      )
        throw new Error("Valor pago inválido.");
      const dueDate = normalizeDate(v("vencimento")),
        competence = normalizeDate(v("competencia"));
      const importKey = JSON.stringify([
        direction,
        v("descricao"),
        amount,
        competence,
        dueDate,
        categoryId,
        contactId,
        accountId,
      ]);
      const sameKey = (e: Entry) =>
        e.importKey === importKey ||
        JSON.stringify([
          e.direction,
          e.description,
          e.amount,
          e.competence,
          e.dueDate,
          e.categoryId,
          e.contactId,
          e.accountId,
        ]) === importKey;
      if (data.entries.some(sameKey) || entries.some(sameKey)) {
        duplicates++;
        return;
      }
      const e: Entry = {
        id: uid(),
        direction,
        description: v("descricao"),
        amount,
        competence,
        dueDate,
        categoryId,
        accountId,
        contactId: contactId ?? "",
        service: v("servico"),
        project: "",
        notes: v("observacoes"),
        importKey,
        payments: paidAmount
          ? [
              {
                id: uid(),
                amount: paidAmount,
                date: normalizeDate(v("data_pagamento")),
                accountId,
              },
            ]
          : [],
        attachments: [],
        history: [audit("Importado de CSV.")],
      };
      validateEntry(e);
      if (
        e.payments.some(
          (p) =>
            p.date >
              new Intl.DateTimeFormat("en-CA", {
                timeZone: "America/Sao_Paulo",
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
              }).format(new Date()) ||
            p.date < data.accounts.find((a) => a.id === accountId)!.openingDate,
        )
      )
        throw new Error(
          "Data de pagamento futura ou anterior ao saldo inicial da conta.",
        );
      entries.push(e);
    } catch (error) {
      errors.push(`Linha ${i + 2}: ${(error as Error).message}`);
    }
  });
  return {
    entries,
    errors,
    duplicates,
    total: entries.reduce((s, e) => s + e.amount, 0),
  };
}
