import type { FinanceData } from "./finance";

const demoContactIds = new Set([
  "c1",
  "c2",
  "c3",
  "c4",
  "c5",
  "s1",
  "s2",
  "s3",
  "s4",
]);
const demoCategoryIds = new Set([
  "marketing",
  "dev",
  "support",
  "tax",
  "freelance",
  "infra",
  "tools",
  "accounting",
  "prolabore",
  "office",
  "fees",
  "yield",
  "profit",
  "capital",
]);
const demoAccountIds = new Set(["nubank", "inter"]);
const demoServices = new Set([
  "Marketing",
  "Desenvolvimento",
  "Manutenção e suporte",
]);
const demoProjects = new Set([
  "Site institucional · Norte",
  "Plataforma · Órbita",
  "Marketing mensal",
]);

export function emptyData(): FinanceData {
  return {
    version: 1,
    settings: {
      company: "Meu negócio",
      services: [],
      projects: [],
    },
    contacts: [],
    categories: [],
    accounts: [],
    entries: [],
    recurrences: [],
    transfers: [],
  };
}

function isDemoEntry(entry: FinanceData["entries"][number]) {
  return (
    entry.id.startsWith("demo:") ||
    entry.id.startsWith("rec-figma:") ||
    entry.history.some((item) =>
      item.action.includes("Lançamento de demonstração"),
    )
  );
}

export function removeDemoData(data: FinanceData) {
  const demoOnlyWorkspace = data.entries.every(isDemoEntry);
  const entries = data.entries.filter((entry) => !isDemoEntry(entry));
  const recurrences = data.recurrences.filter(
    (recurrence) => recurrence.id !== "rec-figma",
  );
  const usedContacts = new Set(
    entries
      .map((entry) => entry.contactId)
      .concat(recurrences.map((recurrence) => recurrence.contactId))
      .filter(Boolean),
  );
  const usedCategories = new Set(
    entries
      .map((entry) => entry.categoryId)
      .concat(recurrences.map((recurrence) => recurrence.categoryId))
      .filter(Boolean),
  );
  const usedAccounts = new Set(
    entries
      .flatMap((entry) => [
        entry.accountId,
        ...entry.payments.map((payment) => payment.accountId),
      ])
      .concat(
        recurrences.map((recurrence) => recurrence.accountId),
        data.transfers.flatMap((transfer) => [transfer.from, transfer.to]),
      )
      .filter(Boolean),
  );
  const next: FinanceData = {
    ...data,
    settings: {
      ...data.settings,
      services: demoOnlyWorkspace
        ? data.settings.services.filter((service) => !demoServices.has(service))
        : data.settings.services,
      projects: demoOnlyWorkspace
        ? data.settings.projects.filter((project) => !demoProjects.has(project))
        : data.settings.projects,
    },
    contacts: data.contacts.filter(
      (contact) =>
        !demoContactIds.has(contact.id) || usedContacts.has(contact.id),
    ),
    categories: data.categories.filter(
      (category) =>
        !demoCategoryIds.has(category.id) || usedCategories.has(category.id),
    ),
    accounts: data.accounts.filter(
      (account) =>
        !demoAccountIds.has(account.id) || usedAccounts.has(account.id),
    ),
    entries,
    recurrences,
  };
  const changed =
    entries.length !== data.entries.length ||
    recurrences.length !== data.recurrences.length ||
    next.contacts.length !== data.contacts.length ||
    next.categories.length !== data.categories.length ||
    next.accounts.length !== data.accounts.length ||
    next.settings.services.length !== data.settings.services.length ||
    next.settings.projects.length !== data.settings.projects.length;
  return { data: next, changed };
}
