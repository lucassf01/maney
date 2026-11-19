export type Direction = "income" | "expense";
export type Currency = "BRL" | "USD";
export type PaymentMethod = "credit_card" | "boleto" | "pix";
export type Group =
  | "revenue"
  | "deductions"
  | "direct"
  | "operating"
  | "financialIncome"
  | "financialExpense"
  | "excluded";
export type Contact = {
  id: string;
  name: string;
  type: "client" | "supplier" | "both";
  email: string;
  document: string;
  archived?: boolean;
};
export type Category = {
  id: string;
  name: string;
  direction: Direction;
  group: Group;
  archived?: boolean;
};
export type Account = {
  id: string;
  name: string;
  bank: string;
  opening: number;
  openingDate: string;
  archived?: boolean;
};
export type Payment = {
  id: string;
  amount: number;
  date: string;
  accountId: string;
};
export type Attachment = {
  id: string;
  name: string;
  type: string;
  data: string;
};
export type Audit = { id: string; at: string; action: string };
export type Entry = {
  id: string;
  direction: Direction;
  description: string;
  amount: number;
  /** Currency indicator only. Amounts remain stored in cents without conversion. */
  currency?: Currency;
  paymentMethod?: PaymentMethod;
  competence: string;
  dueDate: string;
  categoryId: string;
  contactId: string;
  service: string;
  project: string;
  accountId: string;
  notes: string;
  payments: Payment[];
  attachments: Attachment[];
  history: Audit[];
  cancelled?: boolean;
  recurrenceId?: string;
  installment?: string;
  importKey?: string;
};
export type Recurrence = Omit<
  Entry,
  | "id"
  | "payments"
  | "attachments"
  | "history"
  | "cancelled"
  | "recurrenceId"
  | "installment"
> & {
  id: string;
  frequency: "monthly" | "yearly";
  endDate: string;
  paused: boolean;
};
export type Transfer = {
  id: string;
  from: string;
  to: string;
  amount: number;
  date: string;
  notes: string;
  cancelled?: boolean;
};
export type FinanceData = {
  version: 1;
  settings: { company: string; services: string[]; projects: string[] };
  contacts: Contact[];
  categories: Category[];
  accounts: Account[];
  entries: Entry[];
  recurrences: Recurrence[];
  transfers: Transfer[];
};
export const groupNames: Record<Group, string> = {
  revenue: "Receita de serviços",
  deductions: "Deduções e impostos",
  direct: "Custos diretos",
  operating: "Despesas operacionais",
  financialIncome: "Receitas financeiras",
  financialExpense: "Despesas financeiras",
  excluded: "Fora da DRE",
};
export const uid = () => crypto.randomUUID();
export const audit = (action: string): Audit => ({
  id: uid(),
  at: new Date().toISOString(),
  action,
});
export const money = (cents: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    cents / 100,
  );
export const shortMoney = (cents: number) =>
  new Intl.NumberFormat("pt-BR", {
    notation: "compact",
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 1,
  }).format(cents / 100);
export function today() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
export function addMonths(date: string, count: number) {
  const [y, m, d] = date.split("-").map(Number);
  const last = new Date(Date.UTC(y, m + count, 0)).getUTCDate();
  return `${new Date(Date.UTC(y, m - 1 + count, 1)).toISOString().slice(0, 7)}-${String(Math.min(d, last)).padStart(2, "0")}`;
}
export function addDays(date: string, count: number) {
  const d = new Date(date + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + count);
  return d.toISOString().slice(0, 10);
}
export const dateLabel = (date: string) =>
  new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" })
    .format(new Date(date + "T12:00:00Z"))
    .replace(".", "");
export const monthLabel = (month: string, short = false) =>
  new Intl.DateTimeFormat("pt-BR", {
    month: short ? "short" : "long",
    year: short ? undefined : "numeric",
  }).format(new Date(month + "-15T12:00:00Z"));
export const validDate = (s: unknown): s is string =>
  typeof s === "string" &&
  /^\d{4}-\d{2}-\d{2}$/.test(s) &&
  Number.isFinite(Date.parse(s)) &&
  new Date(s + "T12:00:00Z").toISOString().slice(0, 10) === s;
export function parseMoney(value: string) {
  let s = value.replace(/[^\d,.-]/g, "");
  if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
  else if (/^-?\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, "");
  const n = Number(s);
  return Number.isFinite(n) && s ? Math.round(n * 100) : NaN;
}
export const paid = (e: Entry) => e.payments.reduce((s, p) => s + p.amount, 0);
export const pending = (e: Entry) =>
  e.cancelled ? 0 : Math.max(0, e.amount - paid(e));
export function status(e: Entry, at = today()) {
  if (e.cancelled) return "Cancelado";
  if (pending(e) === 0) return e.direction === "income" ? "Recebido" : "Pago";
  if (e.dueDate < at) return "Atrasado";
  if (paid(e) > 0) return "Parcial";
  return "Em aberto";
}
export function accountBalance(data: FinanceData, id?: string, at = today()) {
  let value = data.accounts
    .filter((a) => (!id || a.id === id) && a.openingDate <= at)
    .reduce((s, a) => s + a.opening, 0);
  for (const e of data.entries)
    for (const p of e.payments)
      if ((!id || p.accountId === id) && p.date <= at)
        value += (e.direction === "income" ? 1 : -1) * p.amount;
  for (const t of data.transfers)
    if (!t.cancelled && t.date <= at && id)
      value += (t.to === id ? t.amount : 0) - (t.from === id ? t.amount : 0);
  return value;
}
export function settle(
  entry: Entry,
  amount: number,
  date: string,
  accountId: string,
  openingDate?: string,
): Entry {
  if (
    entry.cancelled ||
    !Number.isSafeInteger(amount) ||
    amount <= 0 ||
    amount > pending(entry)
  )
    throw new Error("Informe um valor maior que zero e até o saldo pendente.");
  if (!validDate(date) || date > today())
    throw new Error("A data de pagamento deve ser hoje ou anterior.");
  if (openingDate && date < openingDate)
    throw new Error(
      "A baixa deve ocorrer a partir da data do saldo inicial da conta.",
    );
  return {
    ...entry,
    payments: [...entry.payments, { id: uid(), amount, date, accountId }],
    history: [
      ...entry.history,
      audit(
        `${entry.direction === "income" ? "Recebimento" : "Pagamento"} de ${money(amount)} registrado em ${dateLabel(date)}.`,
      ),
    ],
  };
}

export function validateTransfer(
  amount: number,
  from: string,
  to: string,
  date: string,
  accounts: Pick<Account, "id" | "openingDate">[],
) {
  if (from === to) throw new Error("Selecione contas diferentes.");
  if (!Number.isSafeInteger(amount) || amount <= 0)
    throw new Error("Informe um valor maior que zero.");
  if (!validDate(date) || date > today())
    throw new Error("Use uma data até hoje.");
  if (
    !accounts.some((a) => a.id === from) ||
    !accounts.some((a) => a.id === to)
  )
    throw new Error("Selecione as contas de origem e destino.");
  if (accounts.some((a) => [from, to].includes(a.id) && a.openingDate > date))
    throw new Error(
      "A transferência deve ocorrer a partir da data do saldo inicial das contas.",
    );
}
export function reversePayment(entry: Entry, paymentId: string): Entry {
  const p = entry.payments.find((p) => p.id === paymentId);
  if (!p) return entry;
  return {
    ...entry,
    payments: entry.payments.filter((p) => p.id !== paymentId),
    history: [...entry.history, audit(`Baixa de ${money(p.amount)} desfeita.`)],
  };
}
export function dre(
  data: FinanceData,
  month: string,
  filter?: { contactId?: string; service?: string; project?: string },
) {
  const groups = Object.fromEntries(
    Object.keys(groupNames).map((g) => [g, 0]),
  ) as Record<Group, number>;
  const entries = data.entries.filter(
    (e) =>
      !e.cancelled &&
      e.competence.startsWith(month) &&
      (!filter?.contactId || e.contactId === filter.contactId) &&
      (!filter?.service || e.service === filter.service) &&
      (!filter?.project || e.project === filter.project),
  );
  for (const e of entries) {
    const cat = data.categories.find((c) => c.id === e.categoryId);
    if (cat) groups[cat.group] += e.amount;
  }
  const netRevenue = groups.revenue - groups.deductions;
  const contribution = netRevenue - groups.direct;
  const operating = contribution - groups.operating;
  const net = operating + groups.financialIncome - groups.financialExpense;
  return {
    groups,
    netRevenue,
    contribution,
    operating,
    net,
    margin: netRevenue ? (net / netRevenue) * 100 : 0,
    entries,
  };
}
export function cashMonth(
  data: FinanceData,
  month: string,
  accountId?: string,
) {
  let income = 0,
    expense = 0;
  for (const e of data.entries)
    for (const p of e.payments)
      if (
        p.date.startsWith(month) &&
        (!accountId || p.accountId === accountId)
      ) {
        if (e.direction === "income") income += p.amount;
        else expense += p.amount;
      }
  return { income, expense };
}
export function projectCash(
  data: FinanceData,
  days: number,
  accountId?: string,
  base = today(),
) {
  const end = addDays(base, days);
  let value = accountBalance(data, accountId, base);
  for (const e of data.entries)
    if (
      pending(e) &&
      e.dueDate > base &&
      e.dueDate <= end &&
      (!accountId || e.accountId === accountId)
    )
      value += (e.direction === "income" ? 1 : -1) * pending(e);
  return value;
}
export function generateRecurrences(
  data: FinanceData,
  through = addDays(today(), 90),
): FinanceData {
  const entries = [...data.entries];
  for (const r of data.recurrences) {
    if (r.paused) continue;
    for (let n = 0; n < 600; n++) {
      const offset = n * (r.frequency === "yearly" ? 12 : 1),
        dueDate = addMonths(r.dueDate, offset);
      if (dueDate > through || (r.endDate && dueDate > r.endDate)) break;
      const id = `${r.id}:${dueDate}`;
      if (entries.some((e) => e.id === id)) continue;
      const {
        frequency: _frequency,
        endDate: _endDate,
        paused: _paused,
        ...base
      } = r;
      entries.push({
        ...base,
        id,
        recurrenceId: r.id,
        dueDate,
        competence: addMonths(r.competence, offset),
        payments: [],
        attachments: [],
        history: [audit("Lançamento gerado pela recorrência.")],
      });
    }
  }
  return { ...data, entries };
}

/** Returns the last occurrence that fits inside a recurrence's end date. */
export function recurrenceLastOccurrence(recurrence: Recurrence) {
  if (!recurrence.endDate) return "";
  const step = recurrence.frequency === "yearly" ? 12 : 1;
  let last = "";
  for (let n = 0; n < 600; n++) {
    const dueDate = addMonths(recurrence.dueDate, n * step);
    if (dueDate > recurrence.endDate) break;
    last = dueDate;
  }
  return last;
}

export function recurrenceEndDateFromRepetitions(
  dueDate: string,
  frequency: Recurrence["frequency"],
  repetitions: number,
) {
  if (!Number.isInteger(repetitions) || repetitions < 1 || repetitions > 60)
    throw new Error("Use de 1 a 60 repetições.");
  return addMonths(
    dueDate,
    (repetitions - 1) * (frequency === "yearly" ? 12 : 1),
  );
}

export function isRecurrenceLastMonth(
  entry: Pick<Entry, "dueDate">,
  recurrence?: Recurrence,
) {
  const last = recurrence && recurrenceLastOccurrence(recurrence);
  return !!last && entry.dueDate.slice(0, 7) === last.slice(0, 7);
}

export function isRecurrenceInLastMonth(recurrence: Recurrence, at = today()) {
  const last = recurrenceLastOccurrence(recurrence);
  return !!last && at.slice(0, 7) === last.slice(0, 7);
}

/** Extends a recurrence's horizon and creates any newly available occurrences. */
export function renewRecurrence(
  data: FinanceData,
  recurrenceId: string,
  months: number,
) {
  if (!Number.isInteger(months) || months < 1 || months > 12)
    throw new Error("Escolha de 1 a 12 meses para renovar.");
  const recurrence = data.recurrences.find((r) => r.id === recurrenceId);
  if (!recurrence) throw new Error("Recorrência não encontrada.");
  const anchor = recurrence.endDate || today();
  const renewed = { ...recurrence, endDate: addMonths(anchor, months) };
  return generateRecurrences({
    ...data,
    recurrences: data.recurrences.map((r) =>
      r.id === recurrenceId ? renewed : r,
    ),
  });
}

export function makeInstallments(
  base: Omit<Entry, "id" | "payments" | "attachments" | "history">,
  count: number,
): Entry[] {
  if (!Number.isInteger(count) || count < 1 || count > 60)
    throw new Error("Use de 1 a 60 parcelas.");
  const amount = Math.floor(base.amount / count),
    rest = base.amount % count;
  return Array.from({ length: count }, (_, i) => ({
    ...base,
    id: uid(),
    amount: amount + (i < rest ? 1 : 0),
    dueDate: addMonths(base.dueDate, i),
    installment: count > 1 ? `${i + 1}/${count}` : undefined,
    payments: [],
    attachments: [],
    history: [audit("Lançamento criado.")],
  }));
}
export function validateEntry(
  base: Pick<
    Entry,
    | "amount"
    | "description"
    | "competence"
    | "dueDate"
    | "categoryId"
    | "accountId"
  >,
) {
  if (typeof base.description !== "string" || !base.description.trim())
    throw new Error("Preencha a descrição.");
  if (!Number.isSafeInteger(base.amount) || base.amount <= 0)
    throw new Error("Informe um valor válido, maior que zero.");
  if (!validDate(base.competence) || !validDate(base.dueDate))
    throw new Error("Preencha competência e vencimento com datas válidas.");
  if (!base.categoryId || !base.accountId)
    throw new Error("Selecione a categoria e a conta financeira.");
}
export function validateData(value: unknown): asserts value is FinanceData {
  if (!value || typeof value !== "object")
    throw new Error("Arquivo de backup inválido.");
  const d = value as FinanceData;
  if (
    d.version !== 1 ||
    !d.settings ||
    typeof d.settings.company !== "string" ||
    !Array.isArray(d.settings.services) ||
    !Array.isArray(d.settings.projects) ||
    ![
      "entries",
      "accounts",
      "contacts",
      "categories",
      "recurrences",
      "transfers",
    ].every((k) => Array.isArray((d as unknown as Record<string, unknown>)[k]))
  )
    throw new Error("Formato de backup não reconhecido.");
  const date = validDate;
  for (const list of [
    d.entries,
    d.accounts,
    d.contacts,
    d.categories,
    d.recurrences,
    d.transfers,
  ])
    if (new Set(list.map((i) => i.id)).size !== list.length)
      throw new Error("O arquivo contém identificadores duplicados.");
  for (const a of d.accounts)
    if (
      !a.id ||
      !a.name ||
      !Number.isSafeInteger(a.opening) ||
      !date(a.openingDate)
    )
      throw new Error("Conta financeira inválida no backup.");
  for (const c of d.categories)
    if (
      !c.id ||
      !c.name ||
      !["income", "expense"].includes(c.direction) ||
      !(c.group in groupNames)
    )
      throw new Error("Categoria inválida no backup.");
  for (const c of d.contacts)
    if (
      !c.id ||
      typeof c.name !== "string" ||
      !["client", "supplier", "both"].includes(c.type) ||
      typeof c.email !== "string"
    )
      throw new Error("Contato inválido no backup.");
  for (const e of d.entries) {
    validateEntry(e);
    if (
      !date(e.competence) ||
      !date(e.dueDate) ||
      !["income", "expense"].includes(e.direction) ||
      !Array.isArray(e.payments) ||
      !Array.isArray(e.attachments) ||
      !Array.isArray(e.history) ||
      typeof e.project !== "string" ||
      typeof e.service !== "string" ||
      typeof e.notes !== "string"
    )
      throw new Error("Lançamento inválido no backup.");
    if (
      (e.currency && !["BRL", "USD"].includes(e.currency)) ||
      (e.paymentMethod &&
        !["credit_card", "boleto", "pix"].includes(e.paymentMethod))
    )
      throw new Error("Moeda ou forma de pagamento inválida no backup.");
    if (
      !d.categories.some(
        (c) => c.id === e.categoryId && c.direction === e.direction,
      ) ||
      !d.accounts.some((a) => a.id === e.accountId)
    )
      throw new Error("Lançamento com categoria ou conta inexistente.");
    for (const p of e.payments)
      if (
        !Number.isSafeInteger(p.amount) ||
        p.amount <= 0 ||
        !date(p.date) ||
        p.date > today() ||
        !d.accounts.some((a) => a.id === p.accountId && a.openingDate <= p.date)
      )
        throw new Error("Pagamento inválido no backup.");
    if (paid(e) > e.amount) throw new Error("Pagamento excede o lançamento.");
    if (new Set(e.payments.map((p) => p.id)).size !== e.payments.length)
      throw new Error("Baixas duplicadas no backup.");
    for (const a of e.attachments)
      if (
        !a.id ||
        typeof a.name !== "string" ||
        !["application/pdf", "image/png", "image/jpeg", "image/webp"].includes(
          a.type,
        ) ||
        typeof a.data !== "string" ||
        !a.data.startsWith(`data:${a.type};base64,`) ||
        a.data.length > 2900000
      )
        throw new Error("Anexo inválido no backup.");
    for (const h of e.history)
      if (
        !h.id ||
        typeof h.action !== "string" ||
        !Number.isFinite(Date.parse(h.at))
      )
        throw new Error("Histórico inválido no backup.");
  }
  for (const r of d.recurrences) {
    validateEntry(r);
    if (
      !["monthly", "yearly"].includes(r.frequency) ||
      typeof r.paused !== "boolean" ||
      (r.currency && !["BRL", "USD"].includes(r.currency)) ||
      (r.paymentMethod &&
        !["credit_card", "boleto", "pix"].includes(r.paymentMethod)) ||
      (r.endDate && (!date(r.endDate) || r.endDate < r.dueDate)) ||
      !d.accounts.some((a) => a.id === r.accountId) ||
      !d.categories.some(
        (c) => c.id === r.categoryId && c.direction === r.direction,
      )
    )
      throw new Error("Recorrência inválida no backup.");
  }
  for (const t of d.transfers)
    if (
      t.from === t.to ||
      !Number.isSafeInteger(t.amount) ||
      t.amount <= 0 ||
      !date(t.date) ||
      !d.accounts.some((a) => a.id === t.from) ||
      !d.accounts.some((a) => a.id === t.to)
    )
      throw new Error("Transferência inválida no backup.");
}
