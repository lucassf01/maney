"use client";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  ArrowDownToLine,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  DollarSign,
  FileText,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import {
  type Direction,
  type Entry,
  addMonths,
  audit,
  dateLabel,
  money,
  paid,
  pending,
  status,
  today,
  generateRecurrences,
  isRecurrenceInLastMonth,
  isRecurrenceLastMonth,
  monthLabel,
  renewRecurrence,
} from "@/lib/finance";
import { exportEntries } from "@/lib/csv";
import { useFinance } from "./provider";
import {
  Empty,
  Field,
  FormError,
  Metric,
  MonthPicker,
  PageHead,
  Sheet,
  StatusBadge,
} from "./ui";
import { EntryDrawer } from "./entry-drawer";
import { inPeriod } from "@/lib/period";

function RenewRecurrenceSheet({
  recurrenceId,
  onClose,
  onRenew,
  busy,
}: {
  recurrenceId: string;
  onClose: () => void;
  onRenew: (months: number) => Promise<void>;
  busy: boolean;
}) {
  const { data } = useFinance();
  const recurrence = data.recurrences.find((r) => r.id === recurrenceId);
  const [months, setMonths] = useState("1");
  const [error, setError] = useState("");
  if (!recurrence) return null;
  const anchor = recurrence.endDate || today();
  const nextEndDate = addMonths(anchor, Number(months));
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    try {
      await onRenew(Number(months));
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <Sheet
      title="Renovar recorrência"
      subtitle={`Escolha por quanto tempo prolongar “${recurrence.description}”.`}
      onClose={onClose}
    >
      <form className="entry-form renewal-form" onSubmit={submit}>
        <Field
          label="Renovar por"
          hint={
            recurrence.endDate
              ? "A nova data final será calculada a partir do fim atual."
              : "Esta recorrência não tem data final. A nova data final partirá de hoje."
          }
        >
          <select
            aria-label="Renovar por"
            value={months}
            onChange={(event) => setMonths(event.target.value)}
          >
            {Array.from({ length: 12 }, (_, index) => index + 1).map(
              (value) => (
                <option key={value} value={value}>
                  {value} {value === 1 ? "mês" : "meses"}
                </option>
              ),
            )}
          </select>
        </Field>
        <p className="field-note full">
          A recorrência continuará até {monthLabel(nextEndDate.slice(0, 7))}.
        </p>
        <FormError text={error} />
        <div className="form-footer">
          <button type="button" className="button" onClick={onClose}>
            Cancelar
          </button>
          <button className="button primary" disabled={busy}>
            <RefreshCw size={15} />
            {busy ? "Renovando…" : "Renovar recorrência"}
          </button>
        </div>
      </form>
    </Sheet>
  );
}

function EntryIndicators({
  entry,
}: {
  entry: Pick<Entry, "description" | "paymentMethod" | "currency">;
}) {
  return (
    <>
      {entry.paymentMethod === "credit_card" && (
        <Link
          href="/cartao"
          className="entry-indicator entry-indicator-link"
          aria-label={`Abrir lançamentos no cartão de ${entry.description}`}
          title="Lançamento no cartão"
        >
          <CreditCard size={13} strokeWidth={1.8} aria-hidden="true" />
        </Link>
      )}
      {entry.currency === "USD" && (
        <span
          className="entry-indicator"
          role="img"
          aria-label="Lançamento em dólar"
          title="Lançamento em dólar"
        >
          <DollarSign size={13} strokeWidth={1.8} aria-hidden="true" />
        </span>
      )}
    </>
  );
}

export function EntryTable({
  entries,
  onOpen,
  onRenew,
  selected,
  onSelect,
  onSelectAll,
  showKind = false,
}: {
  entries: Entry[];
  onOpen: (id: string) => void;
  onRenew?: (recurrenceId: string) => void;
  selected?: Set<string>;
  onSelect?: (id: string) => void;
  onSelectAll?: () => void;
  showKind?: boolean;
}) {
  const { data } = useFinance();
  return (
    <div className="table-scroll">
      <table className="data-table">
        <thead>
          <tr>
            {selected && (
              <th className="checkbox-cell">
                <input
                  type="checkbox"
                  aria-label="Selecionar lançamentos desta página"
                  checked={
                    entries.length > 0 &&
                    entries.every((e) => selected.has(e.id))
                  }
                  onChange={onSelectAll}
                />
              </th>
            )}
            <th>Descrição</th>
            <th>Vencimento</th>
            <th>Categoria</th>
            <th>Situação</th>
            <th className="number">Valor</th>
            <th className="number">Em aberto</th>
            <th className="action-cell">
              <span className="sr-only">Detalhes</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e) => (
            <tr
              key={e.id}
              className={selected?.has(e.id) ? "row-selected" : ""}
            >
              {selected && (
                <td className="checkbox-cell">
                  <input
                    type="checkbox"
                    checked={selected.has(e.id)}
                    aria-label={`Selecionar ${e.description}`}
                    onChange={() => onSelect?.(e.id)}
                  />
                </td>
              )}
              <td>
                <div className="entry-title">
                  <button className="row-title" onClick={() => onOpen(e.id)}>
                    {e.description}
                  </button>
                  <EntryIndicators entry={e} />
                  {e.installment && (
                    <span className="installment">{e.installment}</span>
                  )}
                  {e.recurrenceId &&
                    (() => {
                      const recurrence = data.recurrences.find(
                        (r) => r.id === e.recurrenceId,
                      );
                      return (
                        <>
                          {isRecurrenceLastMonth(e, recurrence) && (
                            <span className="recurrence-tag">último mês</span>
                          )}
                          {onRenew && (
                            <button
                              type="button"
                              className="icon-button recurrence-refresh"
                              aria-label={`Renovar recorrência de ${e.description}`}
                              title="Renovar recorrência"
                              onClick={() => onRenew(e.recurrenceId!)}
                            >
                              <RefreshCw size={14} />
                            </button>
                          )}
                        </>
                      );
                    })()}
                </div>
                <span className="cell-sub">
                  {showKind && (
                    <span
                      className={e.direction === "income" ? "text-green" : ""}
                    >
                      {e.direction === "income" ? "A receber" : "A pagar"}{" "}
                      ·{" "}
                    </span>
                  )}
                  {data.contacts.find((c) => c.id === e.contactId)?.name ??
                    (e.service || "Geral / administrativo")}
                </span>
              </td>
              <td>
                <span className={status(e) === "Atrasado" ? "text-red" : ""}>
                  {dateLabel(e.dueDate)}
                </span>
              </td>
              <td className="category-cell">
                {data.categories.find((c) => c.id === e.categoryId)?.name ??
                  "Sem categoria"}
              </td>
              <td>
                <StatusBadge entry={e} />
              </td>
              <td className="number amount">{money(e.amount)}</td>
              <td className="number muted">
                {pending(e) ? money(pending(e)) : "—"}
              </td>
              <td>
                <button
                  className="icon-button"
                  aria-label={`Abrir ${e.description}`}
                  onClick={() => onOpen(e.id)}
                >
                  <ChevronRight size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
export function Ledger({ direction }: { direction: Direction }) {
  const { data, period, update, busy } = useFinance();
  const [tab, setTab] = useState("entries"),
    [search, setSearch] = useState(""),
    [filterStatus, setFilterStatus] = useState("all"),
    [category, setCategory] = useState(""),
    [contact, setContact] = useState(""),
    [dollarOnly, setDollarOnly] = useState(false),
    [allMonths, setAllMonths] = useState(false),
    [sort, setSort] = useState(false),
    [page, setPage] = useState(0),
    [filters, setFilters] = useState(false),
    [selection, setSelection] = useState<Set<string>>(new Set()),
    [renewal, setRenewal] = useState<string | null>(null),
    [drawer, setDrawer] = useState<{
      id?: string;
      recurrenceId?: string;
    } | null>(null);
  const income = direction === "income";
  useEffect(() => {
    setAllMonths(false);
    setPage(0);
    setSelection(new Set());
  }, [period.start, period.end]);
  const monthEntries = data.entries.filter(
    (e) =>
      e.direction === direction && (allMonths || inPeriod(e.dueDate, period)),
  );
  const visible = useMemo(
    () =>
      monthEntries
        .filter(
          (e) =>
            `${e.description} ${data.contacts.find((c) => c.id === e.contactId)?.name ?? ""}`
              .toLocaleLowerCase("pt-BR")
              .includes(search.toLocaleLowerCase("pt-BR")) &&
            (!category || e.categoryId === category) &&
            (!contact || e.contactId === contact) &&
            (!dollarOnly || e.currency === "USD") &&
            (filterStatus === "all"
              ? !e.cancelled
              : filterStatus === "open"
                ? pending(e) > 0
                : filterStatus === "overdue"
                  ? status(e) === "Atrasado"
                  : filterStatus === "paid"
                    ? !e.cancelled && pending(e) === 0
                    : !!e.cancelled),
        )
        .sort((a, b) =>
          sort ? b.amount - a.amount : a.dueDate.localeCompare(b.dueDate),
        ),
    [
      monthEntries,
      data.contacts,
      search,
      category,
      contact,
      dollarOnly,
      filterStatus,
      sort,
    ],
  );
  const totalPages = Math.max(1, Math.ceil(visible.length / 12)),
    safePage = Math.min(page, totalPages - 1),
    rows = visible.slice(safePage * 12, (safePage + 1) * 12);
  const reset = (fn: () => void) => {
    fn();
    setPage(0);
    setSelection(new Set());
  };
  const overdue = monthEntries
      .filter((e) => status(e) === "Atrasado")
      .reduce((s, e) => s + pending(e), 0),
    outstanding = monthEntries.reduce((s, e) => s + pending(e), 0),
    settled = monthEntries.reduce((s, e) => s + paid(e), 0);
  const select = (id: string) =>
    setSelection((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  async function toggleRecurrence(id: string) {
    await update((d) => {
      const r = d.recurrences.find((r) => r.id === id)!;
      return generateRecurrences({
        ...d,
        recurrences: d.recurrences.map((x) =>
          x.id === id ? { ...x, paused: !x.paused } : x,
        ),
        entries: d.entries.map((e) =>
          e.recurrenceId === id &&
          !paid(e) &&
          e.dueDate >= today() &&
          (!e.cancelled || e.history.at(-1)?.action === "Recorrência pausada.")
            ? {
                ...e,
                cancelled: !r.paused,
                history: [
                  ...e.history,
                  audit(
                    r.paused ? "Recorrência retomada." : "Recorrência pausada.",
                  ),
                ],
              }
            : e,
        ),
      });
    }, "Recorrência atualizada.");
  }
  async function renew(id: string, months: number) {
    const ok = await update(
      (d) => renewRecurrence(d, id, months),
      "Recorrência renovada.",
    );
    if (ok) setRenewal(null);
  }
  return (
    <>
      <PageHead title={income ? "Contas a receber" : "Contas a pagar"}>
        <MonthPicker />
        <button className="button primary" onClick={() => setDrawer({})}>
          <Plus size={16} />
          Novo lançamento
        </button>
      </PageHead>
      <div className="metrics">
        <Metric
          label="Total do período"
          value={money(
            monthEntries
              .filter((e) => !e.cancelled)
              .reduce((s, e) => s + e.amount, 0),
          )}
          detail="Por data de vencimento"
        />
        <Metric
          label={income ? "A receber" : "A pagar"}
          value={money(outstanding)}
          detail="Saldo ainda em aberto"
        />
        <Metric
          label={income ? "Recebido" : "Pago"}
          value={money(settled)}
          detail="Baixas destes lançamentos"
          tone="green"
        />
        <Metric
          label="Em atraso"
          value={money(overdue)}
          detail="Vencidos e não liquidados"
          tone={overdue ? "red" : undefined}
          action={() => reset(() => setFilterStatus("overdue"))}
        />
      </div>
      <div className="tabs page-tabs">
        <button
          className={tab === "entries" ? "active" : ""}
          onClick={() => setTab("entries")}
        >
          Lançamentos{" "}
          <span>{monthEntries.filter((e) => !e.cancelled).length}</span>
        </button>
        <button
          className={tab === "recurrences" ? "active" : ""}
          onClick={() => setTab("recurrences")}
        >
          Recorrências{" "}
          <span>
            {data.recurrences.filter((r) => r.direction === direction).length}
          </span>
        </button>
      </div>
      {tab === "entries" ? (
        <section className="panel ledger-panel">
          <div className="table-toolbar">
            <div className="search-field">
              <Search size={16} />
              <input
                aria-label="Buscar lançamentos"
                placeholder="Buscar por descrição ou contato…"
                value={search}
                onChange={(e) => reset(() => setSearch(e.target.value))}
              />
            </div>
            <div className="toolbar-actions">
              <select
                aria-label="Filtrar situação"
                value={filterStatus}
                onChange={(e) => reset(() => setFilterStatus(e.target.value))}
              >
                <option value="all">Todas as situações</option>
                <option value="open">Em aberto</option>
                <option value="overdue">Em atraso</option>
                <option value="paid">{income ? "Recebidas" : "Pagas"}</option>
                <option value="cancelled">Canceladas</option>
              </select>
              <button
                className={`button ${filters ? "pressed" : ""}`}
                onClick={() => setFilters(!filters)}
              >
                <SlidersHorizontal size={14} />
                Filtros
              </button>
              <button
                className="icon-button bordered"
                title="Exportar lançamentos filtrados"
                aria-label="Exportar lançamentos filtrados"
                onClick={() => exportEntries(data, visible)}
              >
                <ArrowDownToLine size={16} />
              </button>
            </div>
          </div>
          {filters && (
            <div className="filter-bar">
              <select
                aria-label="Filtrar categoria"
                value={category}
                onChange={(e) => reset(() => setCategory(e.target.value))}
              >
                <option value="">Todas as categorias</option>
                {data.categories
                  .filter((c) => c.direction === direction)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
              <select
                aria-label="Filtrar contato"
                value={contact}
                onChange={(e) => reset(() => setContact(e.target.value))}
              >
                <option value="">Todos os contatos</option>
                {data.contacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={dollarOnly}
                  onChange={(e) =>
                    reset(() => setDollarOnly(e.target.checked))
                  }
                />
                Somente lançamentos em dólar
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={allMonths}
                  onChange={(e) => reset(() => setAllMonths(e.target.checked))}
                />
                Todos os meses
              </label>
              <button
                className="text-button"
                onClick={() => reset(() => setSort(!sort))}
              >
                <ArrowUpDown size={14} />
                {sort ? "Maior valor" : "Por vencimento"}
              </button>
            </div>
          )}
          {selection.size > 0 && (
            <div className="batch-bar">
              <strong>{selection.size} selecionado(s)</strong>
              <select
                aria-label="Categorizar selecionados"
                value=""
                disabled={busy}
                onChange={async (e) => {
                  const categoryId = e.target.value;
                  if (categoryId) {
                    await update(
                      (d) => ({
                        ...d,
                        entries: d.entries.map((x) =>
                          selection.has(x.id)
                            ? {
                                ...x,
                                categoryId,
                                history: [
                                  ...x.history,
                                  audit("Categoria alterada em lote."),
                                ],
                              }
                            : x,
                        ),
                      }),
                      "Categorias atualizadas.",
                    );
                    setSelection(new Set());
                  }
                }}
              >
                <option value="">Alterar categoria…</option>
                {data.categories
                  .filter((c) => c.direction === direction && !c.archived)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
              <button
                className="text-button"
                onClick={() => setSelection(new Set())}
              >
                Limpar seleção
              </button>
            </div>
          )}
          {rows.length ? (
            <EntryTable
              entries={rows}
              onOpen={(id) => setDrawer({ id })}
              onRenew={(recurrenceId) => setRenewal(recurrenceId)}
              selected={selection}
              onSelect={select}
              onSelectAll={() =>
                setSelection((s) => {
                  const next = new Set(s);
                  if (rows.every((e) => next.has(e.id)))
                    rows.forEach((e) => next.delete(e.id));
                  else rows.forEach((e) => next.add(e.id));
                  return next;
                })
              }
            />
          ) : (
            <Empty
              title="Nenhum lançamento encontrado"
              text="Ajuste os filtros ou cadastre um lançamento para começar."
              action={
                <button className="button" onClick={() => setDrawer({})}>
                  <Plus size={15} />
                  Criar lançamento
                </button>
              }
            />
          )}
          <div className="table-footer">
            <span>
              {visible.length} lançamento(s) · Total de{" "}
              {money(visible.reduce((s, e) => s + e.amount, 0))}
            </span>
            <div>
              <span>
                {safePage + 1} de {totalPages}
              </span>
              <button
                className="icon-button"
                aria-label="Página anterior"
                disabled={!safePage}
                onClick={() => setPage(safePage - 1)}
              >
                <ChevronLeft size={16} />
              </button>
              <button
                className="icon-button"
                aria-label="Próxima página"
                disabled={safePage + 1 >= totalPages}
                onClick={() => setPage(safePage + 1)}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </section>
      ) : (
        <section className="panel">
          <div className="section-heading panel-heading">
            <div>
              <h2>Seu financeiro no automático</h2>
            </div>
            <button className="button" onClick={() => setDrawer({})}>
              <Plus size={15} />
              Nova recorrência
            </button>
          </div>
          {data.recurrences.filter((r) => r.direction === direction).length ? (
            <div className="recurrence-list">
              {data.recurrences
                .filter((r) => r.direction === direction)
                .map((r) => (
                  <div className="recurrence-row" key={r.id}>
                    <div className="list-icon">
                      <FileText size={18} />
                    </div>
                    <div className="flex-1">
                      <div className="entry-title">
                        <button
                          className="row-title"
                          onClick={() => setDrawer({ recurrenceId: r.id })}
                        >
                          {r.description}
                        </button>
                        <EntryIndicators entry={r} />
                        {isRecurrenceInLastMonth(r) && (
                          <span className="recurrence-tag">último mês</span>
                        )}
                      </div>
                      <small>
                        {r.frequency === "monthly" ? "Mensal" : "Anual"} · Dia{" "}
                        {Number(r.dueDate.slice(8))} ·{" "}
                        {r.paused ? "Pausada" : "Ativa"}
                      </small>
                    </div>
                    <strong className="amount">{money(r.amount)}</strong>
                    <button
                      className="icon-button"
                      type="button"
                      aria-label={`Renovar recorrência de ${r.description}`}
                      title="Renovar recorrência"
                      onClick={() => setRenewal(r.id)}
                    >
                      <RefreshCw size={15} />
                    </button>
                    <button
                      className="button small"
                      disabled={busy}
                      onClick={() => toggleRecurrence(r.id)}
                    >
                      {r.paused ? <Play size={13} /> : <Pause size={13} />}{" "}
                      {r.paused ? "Retomar" : "Pausar"}
                    </button>
                  </div>
                ))}
            </div>
          ) : (
            <Empty
              title="Nenhuma recorrência ainda"
              text="Crie um lançamento e selecione Criar recorrência para gerar os próximos períodos."
            />
          )}
          <div className="panel-footnote">
            Pausar cancela as ocorrências futuras ainda não pagas. Lançamentos
            passados são preservados.
          </div>
        </section>
      )}
      {drawer && (
        <EntryDrawer
          key={`${drawer.id ?? "new"}:${drawer.recurrenceId ?? ""}`}
          id={drawer.id}
          recurrenceId={drawer.recurrenceId}
          direction={direction}
          recurring={tab === "recurrences"}
          onClose={() => setDrawer(null)}
        />
      )}
      {renewal && (
        <RenewRecurrenceSheet
          recurrenceId={renewal}
          busy={busy}
          onClose={() => setRenewal(null)}
          onRenew={(months) => renew(renewal, months)}
        />
      )}
    </>
  );
}
