import { test } from "node:test";
import assert from "node:assert/strict";
import {
  accountBalance,
  addMonths,
  cashMonth,
  dre,
  generateRecurrences,
  makeInstallments,
  pending,
  isRecurrenceLastMonth,
  recurrenceEndDateFromRepetitions,
  recurrenceLastOccurrence,
  renewRecurrence,
  reversePayment,
  settle,
  today,
  validateData,
  type Entry,
  type FinanceData,
} from "../src/lib/finance";
import { seedData } from "../src/lib/seed";
import { parseCsv, previewImport } from "../src/lib/csv";

function fixture(): { data: FinanceData; entry: Entry } {
  const data = seedData();
  data.entries = [];
  data.recurrences = [];
  data.transfers = [];
  data.accounts = [
    {
      id: "nubank",
      name: "Nubank PJ",
      bank: "",
      opening: 100000,
      openingDate: "2020-01-01",
    },
    {
      id: "inter",
      name: "Inter Empresas",
      bank: "",
      opening: 0,
      openingDate: "2020-01-01",
    },
  ];
  const entry: Entry = {
    id: "test",
    direction: "income",
    description: "Projeto de software",
    amount: 100000,
    competence: "2025-01-01",
    dueDate: "2025-02-10",
    categoryId: "dev",
    contactId: "c2",
    service: "Desenvolvimento",
    project: "",
    accountId: "nubank",
    notes: "",
    payments: [],
    history: [],
    attachments: [],
  };
  data.entries = [entry];
  return { data, entry };
}
test("Receita entra na competência mesmo sem pagamento; caixa só muda na data da baixa", () => {
  const { data, entry } = fixture();
  assert.equal(dre(data, "2025-01").net, 100000);
  assert.equal(cashMonth(data, "2025-01").income, 0);
  data.entries = [settle(entry, 100000, "2025-02-10", "nubank")];
  assert.equal(dre(data, "2025-02").net, 0);
  assert.equal(cashMonth(data, "2025-02").income, 100000);
  assert.equal(accountBalance(data, "nubank", "2025-02-09"), 100000);
  assert.equal(accountBalance(data, "nubank", "2025-02-10"), 200000);
});
test("Baixas parciais e estorno preservam saldo e resultado, impedindo excesso", () => {
  const { data, entry } = fixture();
  const partial = settle(entry, 30000, "2025-02-01", "inter");
  assert.equal(pending(partial), 70000);
  assert.throws(() => settle(partial, 70001, "2025-02-01", "nubank"));
  const reversed = reversePayment(partial, partial.payments[0].id);
  assert.equal(pending(reversed), 100000);
  data.entries = [reversed];
  assert.equal(accountBalance(data, "inter"), 0);
  assert.equal(dre(data, "2025-01").net, 100000);
});
test("Parcelamento conserva cada centavo e a competência original", () => {
  const { entry } = fixture();
  const installments = makeInstallments(
    { ...entry, amount: 10000, dueDate: "2025-01-31" },
    3,
  );
  assert.deepEqual(
    installments.map((e) => e.amount),
    [3334, 3333, 3333],
  );
  assert.deepEqual(
    installments.map((e) => e.dueDate),
    ["2025-01-31", "2025-02-28", "2025-03-31"],
  );
  assert.ok(installments.every((e) => e.competence === "2025-01-01"));
});
test("Transferência movimenta as duas contas sem gerar receita, despesa ou alterar o consolidado", () => {
  const { data } = fixture();
  data.entries = [];
  data.transfers = [
    {
      id: "t",
      from: "nubank",
      to: "inter",
      amount: 30000,
      date: "2025-01-10",
      notes: "",
    },
  ];
  assert.equal(accountBalance(data, "nubank"), 70000);
  assert.equal(accountBalance(data, "inter"), 30000);
  assert.equal(accountBalance(data), 100000);
  assert.equal(dre(data, "2025-01").net, 0);
  assert.deepEqual(cashMonth(data, "2025-01"), { income: 0, expense: 0 });
});
test("Aporte e distribuição de lucros movimentam caixa, mas ficam fora da DRE", () => {
  const { data, entry } = fixture();
  data.entries = [
    {
      ...entry,
      categoryId: "capital",
      payments: [
        { id: "p", amount: 100000, date: "2025-01-15", accountId: "nubank" },
      ],
    },
  ];
  assert.equal(dre(data, "2025-01").net, 0);
  assert.equal(cashMonth(data, "2025-01").income, 100000);
});
test("Recorrência mantém o dia de referência e não duplica ocorrências ao recarregar", () => {
  const { data, entry } = fixture();
  data.entries = [];
  data.recurrences = [
    {
      ...entry,
      id: "r",
      dueDate: "2025-01-31",
      competence: "2025-01-01",
      frequency: "monthly",
      endDate: "2025-03-31",
      paused: false,
    },
  ];
  const generated = generateRecurrences(data, "2025-04-30");
  assert.equal(generated.entries.length, 3);
  assert.equal(generateRecurrences(generated, "2025-04-30").entries.length, 3);
  assert.deepEqual(
    generated.entries.map((e) => e.dueDate),
    ["2025-01-31", "2025-02-28", "2025-03-31"],
  );
  assert.equal(
    generateRecurrences({
      ...data,
      recurrences: [{ ...data.recurrences[0], paused: true }],
    }).entries.length,
    0,
  );
});
test("Renovação estende a data final e marca a última ocorrência", () => {
  const { data, entry } = fixture();
  data.entries = [];
  data.recurrences = [
    {
      ...entry,
      id: "r",
      dueDate: "2025-01-31",
      competence: "2025-01-01",
      frequency: "monthly",
      endDate: "2025-03-31",
      paused: false,
    },
  ];
  const renewed = renewRecurrence(data, "r", 3);
  const recurrence = renewed.recurrences[0];
  assert.equal(recurrence.endDate, "2025-06-30");
  assert.equal(recurrenceLastOccurrence(recurrence), "2025-06-30");
  const last = renewed.entries.find((e) => e.dueDate === "2025-06-30");
  assert.ok(last && isRecurrenceLastMonth(last, recurrence));
  assert.throws(() => renewRecurrence(data, "r", 13));
});
test("Quantidade de repetições calcula a data final a partir do primeiro vencimento", () => {
  assert.equal(
    recurrenceEndDateFromRepetitions("2025-01-31", "monthly", 3),
    "2025-03-31",
  );
  assert.equal(
    recurrenceEndDateFromRepetitions("2025-01-31", "yearly", 2),
    "2026-01-31",
  );
  assert.throws(() =>
    recurrenceEndDateFromRepetitions("2025-01-31", "monthly", 0),
  );
});
test("Importação lê campos com separadores e exige categorias válidas", () => {
  const { data } = fixture();
  data.entries = [];
  const rows = parseCsv(
    'tipo;descricao;valor;competencia;vencimento;categoria;conta\nreceber;"Projeto; etapa 1";"1.000,00";01/01/2025;10/02/2025;Desenvolvimento de software;Nubank PJ',
  );
  const mapping = Object.fromEntries(rows[0].map((c, i) => [c, i]));
  const result = previewImport(rows, mapping, data);
  assert.equal(result.errors.length, 0);
  assert.equal(result.total, 100000);
  data.entries = result.entries;
  assert.equal(previewImport(rows, mapping, data).duplicates, 1);
  rows[1][5] = "Categoria inexistente";
  assert.equal(previewImport(rows, mapping, data).errors.length, 1);
});
test("Backup inválido não pode introduzir pagamento excessivo, anexo executável ou recorrência inválida", () => {
  const { data } = fixture();
  validateData(data);
  data.entries[0].payments = [
    { id: "p", amount: 100001, accountId: "nubank", date: "2025-02-01" },
  ];
  assert.throws(() => validateData(data));
  data.entries[0].payments = [];
  data.entries[0].attachments = [
    { id: "a", name: "x", type: "text/html", data: "data:text/html;base64,x" },
  ];
  assert.throws(() => validateData(data));
});
test("Dados fictícios passam pela mesma validação dos backups", () => {
  validateData(generateRecurrences(seedData()));
});
