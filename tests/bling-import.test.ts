import { test } from "node:test";
import assert from "node:assert/strict";
import {
  blingImportSources,
  createBlingImportMapping,
  isBlingReceivableCsv,
  previewBlingImport,
} from "../src/lib/bling-import";
import { seedData } from "../src/lib/seed";

const headers = [
  "Data pagamento",
  "Cliente",
  "Categoria",
  "Conta financeira",
  "Nº documento",
  "Data vencimento",
  "Origem",
  "Valor",
];

test("detecta o layout exportado de contas a receber do Bling", () => {
  assert.equal(isBlingReceivableCsv(headers), true);
  assert.equal(
    isBlingReceivableCsv(["tipo", "descricao", "valor", "vencimento"]),
    false,
  );
});

test("converte datas, valores, baixa paga e ignora a linha Total", () => {
  const data = seedData();
  data.accounts.forEach((account) => {
    account.openingDate = "2025-01-01";
  });
  const rows = [
    headers,
    [
      "05/01/2026",
      "Estúdio Aurora",
      "Marketing digital",
      "Nubank PJ",
      "NF-42",
      "05/01/2026",
      "",
      "1.500,00",
    ],
    ["Total", "1.500,00", "", "", "", "", "", ""],
  ];
  const sources = blingImportSources(rows);
  const mapping = createBlingImportMapping(data, sources);
  const preview = previewBlingImport(rows, mapping, data);
  const entry = preview.entries[0];

  assert.equal(preview.errors.length, 0);
  assert.equal(preview.skippedTotals, 1);
  assert.equal(preview.entries.length, 1);
  assert.equal(entry.direction, "income");
  assert.equal(entry.amount, 150000);
  assert.equal(entry.competence, "2026-01-05");
  assert.equal(entry.payments[0].date, "2026-01-05");
  assert.match(entry.notes, /NF-42/);
  assert.equal(preview.total, 150000);
});

test("mantém linhas repetidas e bloqueia correspondências ausentes", () => {
  const data = seedData();
  data.accounts.forEach((account) => {
    account.openingDate = "2025-01-01";
  });
  const rows = [
    headers,
    [
      "05/01/2026",
      "Cliente novo",
      "Categoria nova",
      "Conta nova",
      "",
      "05/01/2026",
      "",
      "50,00",
    ],
    [
      "05/01/2026",
      "Cliente novo",
      "Categoria nova",
      "Conta nova",
      "",
      "05/01/2026",
      "",
      "50,00",
    ],
  ];
  const sources = blingImportSources(rows);
  const preview = previewBlingImport(
    rows,
    createBlingImportMapping(data, sources),
    data,
  );

  assert.equal(preview.entries.length, 0);
  assert.equal(preview.errors.length, 2);
  assert.equal(preview.duplicates, 0);
});
