"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  CircleAlert,
  Plus,
} from "lucide-react";
import {
  accountBalance,
  addDays,
  dateLabel,
  dre,
  money,
  pending,
  today,
  type Direction,
  type Entry,
} from "@/lib/finance";
import { useFinance } from "./provider";
import { Empty, Metric, MonthPicker, PageHead } from "./ui";
import { EntryDrawer } from "./entry-drawer";
import { inPeriod, periodDre, upcomingDateLabel } from "@/lib/period";

export function Overview() {
  const router = useRouter();
  const { data, period, customPeriod } = useFinance();
  const [drawer, setDrawer] = useState<{ id?: string } | null>(null);
  const [onlyOverdue, setOnlyOverdue] = useState(false);
  const current = today(),
    result = periodDre(data, period);
  const overdue = data.entries
    .filter(
      (e) =>
        pending(e) > 0 &&
        e.dueDate < current &&
        (inPeriod(e.dueDate, period) ||
          (!customPeriod && e.dueDate < period.start)),
    )
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const totalPending = (direction: Direction) =>
    data.entries
      .filter((e) => e.direction === direction && inPeriod(e.dueDate, period))
      .reduce((sum, e) => sum + pending(e), 0);
  return (
    <>
      <PageHead title="Visão geral">
        <MonthPicker />
        <button className="button primary" onClick={() => setDrawer({})}>
          <Plus size={16} />
          Novo lançamento
        </button>
      </PageHead>
      <div className="metrics overview-metrics">
        <Metric
          label="Saldo disponível"
          value={money(accountBalance(data))}
          detail="Hoje · Todas as contas"
        />
        <Metric
          label={customPeriod ? "A receber no período" : "A receber no mês"}
          value={money(totalPending("income"))}
          detail="Valores ainda em aberto"
          action={() => router.push("/receber")}
        />
        <Metric
          label={customPeriod ? "A pagar no período" : "A pagar no mês"}
          value={money(totalPending("expense"))}
          detail="Valores ainda em aberto"
          action={() => router.push("/pagar")}
        />
        <Metric
          label={customPeriod ? "Resultado do período" : "Resultado do mês"}
          value={money(result.net)}
          detail={`${result.margin.toFixed(1).replace(".", ",")}% de margem · Competência`}
          tone={result.net >= 0 ? "green" : "red"}
          action={() => router.push("/dre")}
        />
      </div>
      {overdue.length > 0 && (
        <div className="attention">
          <CircleAlert size={16} />
          <p>
            <strong>
              {overdue.length === 1
                ? "1 lançamento em atraso."
                : `${overdue.length} lançamentos em atraso.`}
            </strong>{" "}
            Confira os vencimentos pendentes.
          </p>
          <button
            className="text-button"
            onClick={() => setOnlyOverdue((value) => !value)}
            aria-pressed={onlyOverdue}
          >
            {onlyOverdue ? "Ver próximos" : "Conferir atrasos"}{" "}
            <ArrowRight size={14} />
          </button>
        </div>
      )}
      <div className="upcoming-grid" id="upcoming">
        <UpcomingAccounts
          direction="expense"
          onlyOverdue={onlyOverdue && overdue.length > 0}
          onOpen={(id) => setDrawer({ id })}
        />
        <UpcomingAccounts
          direction="income"
          onlyOverdue={onlyOverdue && overdue.length > 0}
          onOpen={(id) => setDrawer({ id })}
        />
      </div>
      {drawer && <EntryDrawer id={drawer.id} onClose={() => setDrawer(null)} />}
    </>
  );
}

function UpcomingAccounts({
  direction,
  onOpen,
  onlyOverdue,
}: {
  direction: Direction;
  onOpen: (id: string) => void;
  onlyOverdue: boolean;
}) {
  const { data, period, customPeriod } = useFinance();
  const current = today(),
    income = direction === "income";
  const entries = data.entries
    .filter(
      (e) =>
        e.direction === direction &&
        pending(e) > 0 &&
        (inPeriod(e.dueDate, period) ||
          (!customPeriod &&
            ((e.dueDate < period.start && e.dueDate < current) ||
              e.dueDate > period.end))) &&
        (!onlyOverdue || e.dueDate < current),
    )
    .sort(
      (a, b) =>
        a.dueDate.localeCompare(b.dueDate) ||
        a.description.localeCompare(b.description),
    )
    .slice(0, onlyOverdue ? undefined : 5);
  const title = income ? "Próximas a receber" : "Próximas a pagar";
  const deadline = (entry: Entry) => upcomingDateLabel(entry.dueDate, current);
  return (
    <section
      className={`panel upcoming-panel ${income ? "receivable-panel" : "payable-panel"}`}
      aria-label={title}
    >
      <div className="upcoming-panel-head">
        <div className="upcoming-title">
          <span className="upcoming-direction">
            {income ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
          </span>
          <h2>{title}</h2>
        </div>
        <Link href={income ? "/receber" : "/pagar"} className="upcoming-all">
          Ver todas <ArrowUpRight size={14} />
        </Link>
      </div>
      {entries.length ? (
        <div className="upcoming-list">
          {entries.map((e) => {
            const contact =
              data.contacts.find((c) => c.id === e.contactId)?.name ??
              e.service ??
              "";
            return (
              <button
                className="upcoming-account"
                key={e.id}
                onClick={() => onOpen(e.id)}
                aria-label={`Abrir ${e.description}, ${money(pending(e))}, vencimento ${deadline(e)}`}
              >
                <span className="upcoming-account-copy">
                  <strong>{e.description}</strong>
                  <span>{contact || "Geral / administrativo"}</span>
                </span>
                <span className="upcoming-account-value">
                  <strong>{money(pending(e))}</strong>
                  <span
                    className={`upcoming-deadline ${e.dueDate === current ? "due-today" : ""}`}
                  >
                    <CalendarDays size={11} />
                    {deadline(e)}
                  </span>
                  {e.dueDate < current && (
                    <span className="upcoming-late-label">Atrasado</span>
                  )}
                </span>
                <ArrowUpRight className="upcoming-row-arrow" size={15} />
              </button>
            );
          })}
        </div>
      ) : (
        <Empty
          title={
            income ? "Nenhum recebimento previsto" : "Nenhuma conta para pagar"
          }
          text="Os próximos lançamentos em aberto aparecerão aqui."
        />
      )}
      {entries.length > 0 && (
        <div className="upcoming-total">
          <span>
            Total{" "}
            {entries.length === 1
              ? "deste vencimento"
              : `destes ${entries.length} vencimentos`}
          </span>
          <strong>
            {money(entries.reduce((sum, e) => sum + pending(e), 0))}
          </strong>
        </div>
      )}
    </section>
  );
}
