"use client";
import { useState, type FormEvent } from "react";
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Check,
  Copy,
  Pencil,
  RotateCcw,
  Trash2,
} from "lucide-react";
import {
  audit,
  type Currency,
  type Direction,
  type Entry,
  type PaymentMethod,
  type Recurrence,
  makeInstallments,
  generateRecurrences,
  money,
  paid,
  pending,
  parseMoney,
  reversePayment,
  settle,
  today,
  uid,
  validDate,
  validateTransfer,
  validateEntry,
  dateLabel,
  recurrenceEndDateFromRepetitions,
} from "@/lib/finance";
import { useFinance } from "./provider";
import { Field, FormError, Sheet, StatusBadge } from "./ui";

export function EntryDrawer({
  id,
  direction = "expense",
  recurrenceId,
  recurring = false,
  onClose,
}: {
  id?: string;
  direction?: Direction;
  recurrenceId?: string;
  recurring?: boolean;
  onClose: () => void;
}) {
  const { data, update, busy } = useFinance();
  const entry = data.entries.find((e) => e.id === id),
    recurrence = data.recurrences.find((r) => r.id === recurrenceId);
  const [editing, setEditing] = useState(!entry),
    [tab, setTab] = useState("details"),
    [error, setError] = useState(""),
    [payOpen, setPayOpen] = useState(false),
    [confirm, setConfirm] = useState(false),
    [occurrence, setOccurrence] = useState(
      recurrence || recurring ? "recurrence" : "once",
    ),
    [frequency, setFrequency] = useState<Recurrence["frequency"]>(
      recurrence?.frequency ?? "monthly",
    ),
    [recurrenceEndMode, setRecurrenceEndMode] = useState<
      "repetitions" | "date"
    >(recurrence?.endDate ? "date" : "repetitions"),
    [repetitions, setRepetitions] = useState("0"),
    [recurrenceEndDate, setRecurrenceEndDate] = useState(
      recurrence?.endDate ?? "",
    ),
    [dueDate, setDueDate] = useState(
      entry?.dueDate ?? recurrence?.dueDate ?? today(),
    ),
    [kind, setKind] = useState<Direction | "transfer">(
      entry?.direction ?? recurrence?.direction ?? direction,
    ),
    [currency, setCurrency] = useState<Currency>(
      entry?.currency ?? recurrence?.currency ?? "BRL",
    );
  const base = entry ?? recurrence;
  const calculatedRecurrenceEndDate =
    recurrenceEndMode === "repetitions" &&
    Number(repetitions) > 0 &&
    validDate(dueDate)
      ? recurrenceEndDateFromRepetitions(
          dueDate,
          frequency,
          Number(repetitions),
        )
      : "";
  const calculatedRecurrenceEndDateLabel = calculatedRecurrenceEndDate
    ? new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(new Date(`${calculatedRecurrenceEndDate}T12:00:00Z`))
    : "";
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const f = new FormData(event.currentTarget);
    const str = (key: string) => String(f.get(key) ?? "");
    try {
      if (kind === "transfer") {
        const amount = parseMoney(str("amount")),
          from = str("fromAccountId"),
          to = str("toAccountId"),
          date = str("competence");
        validateTransfer(amount, from, to, date, data.accounts);
        const ok = await update(
          (d) => ({
            ...d,
            transfers: [
              ...d.transfers,
              { id: uid(), from, to, amount, date, notes: "" },
            ],
          }),
          "Transferência registrada.",
        );
        if (ok) onClose();
        return;
      }
      const values = {
        direction: kind,
        description: str("description").trim(),
        amount: parseMoney(str("amount")),
        currency,
        paymentMethod: str("paymentMethod") as PaymentMethod,
        competence: str("competence"),
        dueDate: str("dueDate"),
        categoryId: str("categoryId"),
        accountId: str("accountId"),
        contactId: str("contactId"),
        service: str("service"),
        project: base?.project ?? "",
        notes: str("notes"),
      };
      validateEntry(values);
      if (entry && values.amount < paid(entry))
        throw new Error("O valor não pode ser menor que o total já baixado.");
      const installments = Number(str("installments") || 1);
      const recurrenceEndDateValue =
        occurrence === "recurrence"
          ? recurrenceEndMode === "repetitions"
            ? Number(repetitions) > 0
              ? recurrenceEndDateFromRepetitions(
                  values.dueDate,
                  frequency,
                  Number(repetitions),
                )
              : ""
            : recurrenceEndDate
          : "";
      if (occurrence === "installments" && values.amount < installments)
        throw new Error(
          "O valor precisa permitir pelo menos R$ 0,01 por parcela.",
        );
      if (
        occurrence === "recurrence" &&
        recurrenceEndDateValue &&
        recurrenceEndDateValue < values.dueDate
      )
        throw new Error(
          "O fim da recorrência deve ser igual ou posterior ao primeiro vencimento.",
        );
      const ok = await update(
        (d) => {
          if (recurrence) {
            const r: Recurrence = {
              ...values,
              id: recurrence.id,
              frequency,
              endDate: recurrenceEndDateValue,
              paused: recurrence.paused,
            };
            return generateRecurrences({
              ...d,
              recurrences: d.recurrences.map((x) => (x.id === r.id ? r : x)),
              entries: d.entries.filter(
                (e) =>
                  !(
                    e.recurrenceId === r.id &&
                    !paid(e) &&
                    e.dueDate >= today()
                  ),
              ),
            });
          }
          if (entry)
            return {
              ...d,
              entries: d.entries.map((e) =>
                e.id === entry.id
                  ? {
                      ...e,
                      ...values,
                      history: [
                        ...e.history,
                        audit("Dados do lançamento atualizados."),
                      ],
                    }
                  : e,
              ),
            };
          if (occurrence === "recurrence") {
            const r: Recurrence = {
              ...values,
              id: uid(),
              frequency,
              endDate: recurrenceEndDateValue,
              paused: false,
            };
            return generateRecurrences({
              ...d,
              recurrences: [...d.recurrences, r],
            });
          }
          return {
            ...d,
            entries: [
              ...d.entries,
              ...makeInstallments(
                values,
                occurrence === "installments" ? installments : 1,
              ),
            ],
          };
        },
        entry || recurrence ? "Alterações salvas." : "Lançamento criado.",
      );
      if (ok) onClose();
    } catch (e) {
      setError((e as Error).message);
    }
  }
  async function pay(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const f = new FormData(event.currentTarget);
    try {
      const amount = parseMoney(String(f.get("amount"))),
        date = String(f.get("date")),
        account = String(f.get("accountId"));
      if (!data.accounts.some((a) => a.id === account))
        throw new Error("Escolha uma conta financeira.");
      if (entry) {
        settle(
          entry,
          amount,
          date,
          account,
          data.accounts.find((a) => a.id === account)?.openingDate,
        );
        const ok = await update(
          (d) => ({
            ...d,
            entries: d.entries.map((e) =>
              e.id === entry.id
                ? settle(
                    e,
                    amount,
                    date,
                    account,
                    d.accounts.find((a) => a.id === account)?.openingDate,
                  )
                : e,
            ),
          }),
          kind === "income"
            ? "Recebimento registrado."
            : "Pagamento registrado.",
        );
        if (ok) setPayOpen(false);
      }
    } catch (e) {
      setError((e as Error).message);
    }
  }
  const paymentAction =
    entry && pending(entry) > 0 ? (
      <button
        className="button primary"
        onClick={() => {
          setPayOpen(!payOpen);
          setError("");
        }}
      >
        <Check size={15} />
        {kind === "income" ? "Registrar recebimento" : "Registrar pagamento"}
      </button>
    ) : null;
  return (
    <Sheet
      title={
        recurrence
          ? "Editar recorrência"
          : editing
            ? entry
              ? "Editar lançamento"
              : "Novo lançamento"
            : "Detalhes do lançamento"
      }
      subtitle={
        recurrence
          ? "As mudanças valem para ocorrências futuras em aberto."
          : undefined
      }
      onClose={onClose}
    >
      {editing ? (
        <form onSubmit={submit} className="entry-form">
          {!entry && !recurrence && (
            <div className="segmented full entry-kind-switcher">
              <button
                type="button"
                className={kind === "expense" ? "selected" : ""}
                onClick={() => setKind("expense")}
              >
                <ArrowUpRight size={15} /> A pagar
              </button>
              <button
                type="button"
                className={kind === "income" ? "selected" : ""}
                onClick={() => setKind("income")}
              >
                <ArrowDownLeft size={15} /> A receber
              </button>
              <button
                type="button"
                className={kind === "transfer" ? "selected" : ""}
                onClick={() => {
                  setKind("transfer");
                  setOccurrence("once");
                }}
              >
                <ArrowLeftRight size={15} /> Transferência
              </button>
            </div>
          )}
          {kind === "transfer" ? (
            <div className="form-grid transfer-form-grid">
              <Field label="Valor total (R$)">
                <input
                  name="amount"
                  required
                  inputMode="decimal"
                  placeholder="0,00"
                  aria-label="Valor total (R$)"
                  autoFocus
                />
              </Field>
              <Field label="Conta de origem">
                <select name="fromAccountId" required>
                  {data.accounts
                    .filter((a) => !a.archived)
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                </select>
              </Field>
              <Field label="Conta de destino">
                <select
                  name="toAccountId"
                  required
                  defaultValue={data.accounts.filter((a) => !a.archived)[1]?.id}
                >
                  {data.accounts
                    .filter((a) => !a.archived)
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                </select>
              </Field>
              <Field label="Data de competência">
                <input
                  name="competence"
                  type="date"
                  required
                  max={today()}
                  defaultValue={today()}
                />
              </Field>
            </div>
          ) : (
            <>
              <Field label="Descrição" full>
                <input
                  name="description"
                  required
                  maxLength={160}
                  autoFocus
                  defaultValue={base?.description}
                  placeholder={
                    kind === "income"
                      ? "Ex.: Mensalidade de marketing"
                      : "Ex.: Assinatura de software"
                  }
                />
              </Field>
              <div className="form-grid">
                <div className="field">
                  <span>Valor total (R$)</span>
                  <div className="amount-control">
                    <input
                      name="amount"
                      required
                      inputMode="decimal"
                      placeholder="0,00"
                      aria-label="Valor total (R$)"
                      defaultValue={
                        base
                          ? (base.amount / 100).toFixed(2).replace(".", ",")
                          : ""
                      }
                    />
                    <div
                      className="segmented currency-switcher"
                      role="group"
                      aria-label="Moeda"
                    >
                      <button
                        type="button"
                        className={currency === "BRL" ? "selected" : ""}
                        onClick={() => setCurrency("BRL")}
                      >
                        R$
                      </button>
                      <button
                        type="button"
                        className={currency === "USD" ? "selected" : ""}
                        onClick={() => setCurrency("USD")}
                      >
                        U$
                      </button>
                    </div>
                  </div>
                </div>
                <Field label={kind === "income" ? "Cliente" : "Fornecedor"}>
                  <select name="contactId" defaultValue={base?.contactId ?? ""}>
                    <option value="">Sem contato</option>
                    {data.contacts
                      .filter((c) => !c.archived || c.id === base?.contactId)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                </Field>
                <Field label="Tipo de serviço">
                  <select name="service" defaultValue={base?.service ?? ""}>
                    <option value="">Geral / administrativo</option>
                    {Array.from(
                      new Set(
                        [...data.settings.services, base?.service].filter(
                          Boolean,
                        ),
                      ),
                    ).map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Categoria">
                  <select
                    key={kind}
                    name="categoryId"
                    required
                    defaultValue={base?.categoryId ?? ""}
                  >
                    <option value="" disabled>
                      Selecione uma categoria
                    </option>
                    {data.categories
                      .filter(
                        (c) =>
                          c.direction === kind &&
                          (!c.archived || c.id === base?.categoryId),
                      )
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                </Field>
                <Field label="Forma de pagamento">
                  <select
                    name="paymentMethod"
                    defaultValue={base?.paymentMethod ?? "credit_card"}
                  >
                    <option value="credit_card">Cartão de crédito</option>
                    <option value="boleto">Boleto</option>
                    <option value="pix">PIX</option>
                  </select>
                </Field>
                <Field label="Conta financeira">
                  <select
                    name="accountId"
                    defaultValue={
                      base?.accountId ??
                      data.accounts.find((a) => !a.archived)?.id
                    }
                  >
                    {data.accounts
                      .filter((a) => !a.archived || a.id === base?.accountId)
                      .map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name}
                        </option>
                      ))}
                  </select>
                </Field>
                <Field
                  label="Data de competência"
                  hint="Quando o serviço ou a despesa aconteceu. Define o mês da DRE."
                >
                  <input
                    name="competence"
                    type="date"
                    required
                    defaultValue={base?.competence ?? today()}
                  />
                </Field>
                <Field
                  label="Vencimento"
                  hint="Quando o pagamento ou recebimento deve ser realizado. Define o fluxo de caixa."
                >
                  <input
                    name="dueDate"
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </Field>
                {!entry && (
                  <>
                    <Field label="Repetição" full>
                      <select
                        value={occurrence}
                        disabled={!!recurrence}
                        onChange={(e) => setOccurrence(e.target.value)}
                      >
                        <option value="once">Lançamento único</option>
                        <option value="installments">
                          Parcelar o valor total
                        </option>
                        <option value="recurrence">Criar recorrência</option>
                      </select>
                    </Field>
                    {occurrence === "installments" && (
                      <Field
                        label="Número de parcelas"
                        full
                        hint="O valor total será dividido. A competência será mantida em todas as parcelas; os vencimentos serão mensais."
                      >
                        <input
                          type="number"
                          min="2"
                          max="60"
                          name="installments"
                          defaultValue={2}
                        />
                      </Field>
                    )}
                    {occurrence === "recurrence" && (
                      <>
                        <div className="recurrence-settings full">
                          <div className="recurrence-settings-fields">
                            <Field label="Frequência">
                              <select
                                name="frequency"
                                value={frequency}
                                onChange={(e) =>
                                  setFrequency(
                                    e.target.value as Recurrence["frequency"],
                                  )
                                }
                              >
                                <option value="monthly">Mensal</option>
                                <option value="yearly">Anual</option>
                              </select>
                            </Field>
                            {recurrenceEndMode === "repetitions" ? (
                              <Field label="Repetições">
                                <select
                                  name="repetitions"
                                  aria-label="Repetições"
                                  value={repetitions}
                                  onChange={(e) =>
                                    setRepetitions(e.target.value)
                                  }
                                >
                                  <option value="0">-</option>
                                  {Array.from(
                                    { length: 60 },
                                    (_, index) => index + 1,
                                  ).map((value) => (
                                    <option key={value} value={value}>
                                      {value}
                                    </option>
                                  ))}
                                </select>
                              </Field>
                            ) : (
                              <Field label="Data final">
                                <input
                                  type="date"
                                  name="endDate"
                                  aria-label="Data final"
                                  value={recurrenceEndDate}
                                  onChange={(e) =>
                                    setRecurrenceEndDate(e.target.value)
                                  }
                                />
                              </Field>
                            )}
                          </div>
                          {recurrenceEndMode === "repetitions" ? (
                            calculatedRecurrenceEndDateLabel ? (
                              <p className="recurrence-end-preview">
                                {calculatedRecurrenceEndDateLabel}
                              </p>
                            ) : (
                              <button
                                type="button"
                                className="recurrence-end-toggle"
                                onClick={() => setRecurrenceEndMode("date")}
                              >
                                Definir data final
                              </button>
                            )
                          ) : (
                            <button
                              type="button"
                              className="recurrence-end-toggle"
                              onClick={() =>
                                setRecurrenceEndMode("repetitions")
                              }
                            >
                              Definir por repetições
                            </button>
                          )}
                          <p className="field-note recurrence-settings-note">
                            As próximas ocorrências são geradas com até 90 dias
                            de antecedência.
                          </p>
                        </div>
                        {recurrenceEndMode === "repetitions" && (
                          <input
                            type="hidden"
                            name="endDate"
                            value={calculatedRecurrenceEndDate}
                            readOnly
                          />
                        )}
                      </>
                    )}
                  </>
                )}
                <Field label="Observações" full>
                  <textarea
                    name="notes"
                    rows={3}
                    maxLength={2000}
                    defaultValue={base?.notes}
                    placeholder="Informações úteis sobre este lançamento"
                  />
                </Field>
              </div>
            </>
          )}
          <FormError text={error} />
          <div className="form-footer">
            <button
              type="button"
              className="button"
              onClick={() => (entry ? setEditing(false) : onClose())}
            >
              Cancelar
            </button>
            <button
              className="button primary"
              disabled={
                busy ||
                (kind === "transfer" &&
                  data.accounts.filter((a) => !a.archived).length < 2)
              }
            >
              <Check size={15} />
              {busy
                ? "Salvando…"
                : kind === "transfer"
                  ? "Registrar transferência"
                  : entry || recurrence
                    ? "Salvar alterações"
                    : "Criar lançamento"}
            </button>
          </div>
        </form>
      ) : (
        entry && (
          <>
            <div className="entry-summary">
              <div className={`entry-direction ${entry.direction}`}>
                {entry.direction === "income" ? (
                  <ArrowDownLeft size={23} />
                ) : (
                  <ArrowUpRight size={23} />
                )}
              </div>
              <div className="entry-summary-copy">
                <h3>{entry.description}</h3>
                <div className="entry-summary-amount">
                  <strong>{money(entry.amount)}</strong>
                  <StatusBadge entry={entry} />
                </div>
              </div>
              <div className="detail-actions">
                <button className="button" onClick={() => setEditing(true)}>
                  <Pencil size={14} />
                  Editar
                </button>
                <button
                  className="icon-button bordered"
                  title="Duplicar lançamento"
                  aria-label="Duplicar lançamento"
                  onClick={async () => {
                    const copy = {
                      ...entry,
                      id: uid(),
                      description: `${entry.description} (cópia)`,
                      payments: [],
                      history: [audit("Duplicado de outro lançamento.")],
                      attachments: [],
                      cancelled: false,
                      recurrenceId: undefined,
                      installment: undefined,
                      importKey: undefined,
                    };
                    if (
                      await update(
                        (d) => ({ ...d, entries: [...d.entries, copy] }),
                        "Cópia criada em aberto.",
                      )
                    )
                      onClose();
                  }}
                >
                  <Copy size={15} />
                </button>
              </div>
            </div>
            {payOpen && (
              <form className="payment-form" onSubmit={pay}>
                <h3>
                  {kind === "income"
                    ? "Registrar recebimento"
                    : "Registrar pagamento"}
                </h3>
                <p>
                  Saldo pendente: <b>{money(pending(entry))}</b>
                </p>
                <div className="form-grid">
                  <Field label="Valor (R$)">
                    <input
                      autoFocus
                      name="amount"
                      inputMode="decimal"
                      required
                      defaultValue={(pending(entry) / 100)
                        .toFixed(2)
                        .replace(".", ",")}
                    />
                  </Field>
                  <Field label="Data efetiva">
                    <input
                      name="date"
                      type="date"
                      required
                      max={today()}
                      defaultValue={today()}
                    />
                  </Field>
                  <Field label="Conta financeira" full>
                    <select name="accountId" defaultValue={entry.accountId}>
                      {data.accounts
                        .filter((a) => !a.archived || a.id === entry.accountId)
                        .map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.name}
                          </option>
                        ))}
                    </select>
                  </Field>
                </div>
                <FormError text={error} />
                <div className="inline-actions">
                  <button
                    className="button"
                    type="button"
                    onClick={() => setPayOpen(false)}
                  >
                    Voltar
                  </button>
                  <button className="button primary" disabled={busy}>
                    Confirmar registro
                  </button>
                </div>
              </form>
            )}
            <div className="tabs">
              <button
                className={tab === "details" ? "active" : ""}
                onClick={() => setTab("details")}
              >
                Detalhes
              </button>
              <button
                className={tab === "payments" ? "active" : ""}
                onClick={() => setTab("payments")}
              >
                Baixas ({entry.payments.length})
              </button>
              <button
                className={tab === "history" ? "active" : ""}
                onClick={() => setTab("history")}
              >
                Histórico
              </button>
            </div>
            {tab === "details" && (
              <>
                <dl className="details-list">
                  {[
                    [
                      "Contato",
                      data.contacts.find((c) => c.id === entry.contactId)
                        ?.name ?? "Não informado",
                    ],
                    [
                      "Categoria",
                      data.categories.find((c) => c.id === entry.categoryId)
                        ?.name,
                    ],
                    [
                      "Conta financeira",
                      data.accounts.find((a) => a.id === entry.accountId)?.name,
                    ],
                    ["Competência", dateLabel(entry.competence)],
                    ["Vencimento", dateLabel(entry.dueDate)],
                    ["Tipo de serviço", entry.service || "Geral"],
                    ["Moeda", entry.currency === "USD" ? "U$" : "R$"],
                    [
                      "Forma de pagamento",
                      entry.paymentMethod
                        ? {
                            credit_card: "Cartão de crédito",
                            boleto: "Boleto",
                            pix: "PIX",
                          }[entry.paymentMethod]
                        : "Não informado",
                    ],
                    ["Total baixado", money(paid(entry))],
                    ["Saldo pendente", money(pending(entry))],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <dt>{label}</dt>
                      <dd>{value}</dd>
                    </div>
                  ))}
                </dl>
                {entry.installment && (
                  <p className="note">
                    Parcela {entry.installment} · Competência independente do
                    vencimento.
                  </p>
                )}
                {entry.recurrenceId && (
                  <p className="note">
                    Gerado por recorrência. Editar este lançamento altera apenas
                    esta ocorrência.
                  </p>
                )}
                {entry.notes && (
                  <section className="detail-section">
                    <h3>Observações</h3>
                    <p className="preserve-lines">{entry.notes}</p>
                  </section>
                )}
                {!entry.cancelled && !paid(entry) && (
                  <div className="cancel-area">
                    {confirm ? (
                      <>
                        <p>
                          Cancelar este lançamento? Ele será preservado no
                          histórico e sairá dos relatórios.
                        </p>
                        <div className="inline-actions">
                          <button
                            className="button"
                            onClick={() => setConfirm(false)}
                          >
                            Manter
                          </button>
                          <button
                            className="button danger"
                            onClick={() =>
                              update(
                                (d) => ({
                                  ...d,
                                  entries: d.entries.map((e) =>
                                    e.id === entry.id
                                      ? {
                                          ...e,
                                          cancelled: true,
                                          history: [
                                            ...e.history,
                                            audit("Lançamento cancelado."),
                                          ],
                                        }
                                      : e,
                                  ),
                                }),
                                "Lançamento cancelado.",
                              )
                            }
                          >
                            Confirmar cancelamento
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="detail-bottom-actions">
                        <button
                          className="text-button text-red"
                          onClick={() => setConfirm(true)}
                        >
                          <Trash2 size={14} />
                          Cancelar lançamento
                        </button>
                        {paymentAction}
                      </div>
                    )}
                  </div>
                )}
                {paid(entry) > 0 && paymentAction && (
                  <div className="detail-payment-action">{paymentAction}</div>
                )}
                {entry.cancelled && (
                  <button
                    className="button"
                    onClick={() =>
                      update(
                        (d) => ({
                          ...d,
                          entries: d.entries.map((e) =>
                            e.id === entry.id
                              ? {
                                  ...e,
                                  cancelled: false,
                                  history: [
                                    ...e.history,
                                    audit("Lançamento reaberto."),
                                  ],
                                }
                              : e,
                          ),
                        }),
                        "Lançamento reaberto.",
                      )
                    }
                  >
                    <RotateCcw size={14} />
                    Reabrir lançamento
                  </button>
                )}
              </>
            )}
            {tab === "payments" && (
              <div className="payment-list">
                {!entry.payments.length && (
                  <p className="muted">
                    Nenhuma baixa registrada. Registre um pagamento ou
                    recebimento para movimentar o saldo da conta.
                  </p>
                )}
                {entry.payments.map((p) => (
                  <div className="payment-row" key={p.id}>
                    <div>
                      <strong>{money(p.amount)}</strong>
                      <small>
                        {dateLabel(p.date)} ·{" "}
                        {data.accounts.find((a) => a.id === p.accountId)?.name}
                      </small>
                    </div>
                    <button
                      className="button small"
                      disabled={busy}
                      onClick={() =>
                        update(
                          (d) => ({
                            ...d,
                            entries: d.entries.map((e) =>
                              e.id === entry.id ? reversePayment(e, p.id) : e,
                            ),
                          }),
                          "Baixa desfeita. O saldo foi atualizado.",
                        )
                      }
                    >
                      <RotateCcw size={13} />
                      Desfazer
                    </button>
                  </div>
                ))}
              </div>
            )}
            {tab === "history" && (
              <ol className="timeline">
                {entry.history
                  .slice()
                  .reverse()
                  .map((h) => (
                    <li key={h.id}>
                      <span className="timeline-dot" />
                      <p>{h.action}</p>
                      <small>
                        {new Date(h.at).toLocaleString("pt-BR", {
                          timeZone: "America/Sao_Paulo",
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </small>
                    </li>
                  ))}
              </ol>
            )}
          </>
        )
      )}
    </Sheet>
  );
}
