import { test } from "node:test";
import assert from "node:assert/strict";
import { seedData } from "../src/lib/seed";
import { emptyData, removeDemoData } from "../src/lib/workspace";

test("workspace novo começa vazio", () => {
  const data = emptyData();
  assert.equal(data.entries.length, 0);
  assert.equal(data.contacts.length, 0);
  assert.equal(data.categories.length, 0);
  assert.equal(data.accounts.length, 0);
});

test("dados demonstrativos antigos são removidos da base local", () => {
  const cleaned = removeDemoData(seedData());
  assert.equal(cleaned.changed, true);
  assert.equal(cleaned.data.entries.length, 0);
  assert.equal(cleaned.data.contacts.length, 0);
  assert.equal(cleaned.data.categories.length, 0);
  assert.equal(cleaned.data.accounts.length, 0);
  assert.equal(cleaned.data.recurrences.length, 0);
  assert.equal(cleaned.data.settings.services.length, 0);
  assert.equal(cleaned.data.settings.projects.length, 0);
});
