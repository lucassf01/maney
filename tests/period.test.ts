import { test } from "node:test";
import assert from "node:assert/strict";
import {
  monthPeriod,
  periodCash,
  periodDre,
  upcomingDateLabel,
  validatePeriod,
  weekPeriod,
} from "../src/lib/period";
import { seedData } from "../src/lib/seed";

test("A semana é de segunda a domingo, inclusive quando atravessa o ano", () => {
  assert.deepEqual(weekPeriod("2026-11-12"), {
    start: "2026-11-09",
    end: "2026-11-15",
  });
  assert.equal(upcomingDateLabel("2026-11-09", "2026-11-12"), "segunda");
  assert.equal(upcomingDateLabel("2026-11-12", "2026-11-12"), "quinta");
  assert.equal(upcomingDateLabel("2026-11-15", "2026-11-12"), "domingo");
  assert.equal(upcomingDateLabel("2026-11-16", "2026-11-12"), "16 de nov");
  assert.deepEqual(weekPeriod("2027-01-01"), {
    start: "2026-12-28",
    end: "2027-01-03",
  });
});
test("Datas personalizadas incluem as extremidades e mantêm caixa separado da competência", () => {
  const data = seedData();
  const sample = data.entries.find((e) => e.direction === "income")!;
  data.entries = [
    {
      ...sample,
      id: "range-test",
      amount: 100000,
      competence: "2025-01-15",
      dueDate: "2025-02-10",
      payments: [
        {
          id: "p",
          amount: 75000,
          date: "2025-02-10",
          accountId: data.accounts[0].id,
        },
      ],
      cancelled: false,
    },
  ];
  assert.equal(
    periodDre(data, { start: "2025-01-15", end: "2025-01-15" }).net,
    100000,
  );
  assert.equal(
    periodDre(data, { start: "2025-01-16", end: "2025-02-10" }).net,
    0,
  );
  assert.equal(
    periodCash(data, { start: "2025-02-10", end: "2025-02-10" }).income,
    75000,
  );
  assert.equal(
    periodCash(data, { start: "2025-02-01", end: "2025-02-09" }).income,
    0,
  );
});
test("O período rejeita datas inválidas e invertidas, respeitando anos bissextos", () => {
  assert.deepEqual(monthPeriod("2024-02"), {
    start: "2024-02-01",
    end: "2024-02-29",
  });
  assert.throws(() =>
    validatePeriod({ start: "2026-02-29", end: "2026-03-02" }),
  );
  assert.throws(() =>
    validatePeriod({ start: "2026-11-12", end: "2026-11-11" }),
  );
});
