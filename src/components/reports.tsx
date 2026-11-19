"use client";
import { useState } from "react";
import { ArrowDownToLine, ChevronDown, ChevronRight } from "lucide-react";
import {
  accountBalance,
  addDays,
  addMonths,
  cashMonth,
  dateLabel,
  dre,
  type Group,
  money,
  monthLabel,
  pending,
  projectCash,
  today,
  type Entry,
} from "@/lib/finance";
import { exportCsv } from "@/lib/csv";
import { useFinance } from "./provider";
import { Empty, Metric, MonthPicker, PageHead, Sheet } from "./ui";
import { EntryDrawer } from "./entry-drawer";
import { EntryTable } from "./ledger";
import { FinancialChart } from "./chart";
import {
  inPeriod,
  intersectMonth,
  monthPeriod,
  monthsInPeriod,
  periodCash,
  periodDre,
} from "@/lib/period";

export function CashFlow() {
  const { data, month, period, customPeriod } = useFinance(),
    [account, setAccount] = useState(""),
    [mode, setMode] = useState("actual"),
    [horizon, setHorizon] = useState(30),
    [entryId, setEntryId] = useState<string | null>(null);
  const now = today(),
    end = customPeriod ? period.end : addDays(now, horizon),
    cash = periodCash(data, period, account || undefined);
  const rows: {
    id: string;
    date: string;
    description: string;
    account: string;
    value: number;
    entryId?: string;
    type: string;
  }[] = [];
  for (const e of data.entries) {
    if (mode === "actual") {
      for (const p of e.payments)
        if (inPeriod(p.date, period) && (!account || p.accountId === account))
          rows.push({
            id: p.id,
            date: p.date,
            description: e.description,
            account:
              data.accounts.find((a) => a.id === p.accountId)?.name ?? "",
            value: (e.direction === "income" ? 1 : -1) * p.amount,
            entryId: e.id,
            type: "Realizado",
          });
    } else if (
      pending(e) > 0 &&
      e.dueDate > now &&
      e.dueDate <= end &&
      (!customPeriod || e.dueDate >= period.start) &&
      (!account || e.accountId === account)
    )
      rows.push({
        id: e.id,
        date: e.dueDate,
        description: e.description,
        account: data.accounts.find((a) => a.id === e.accountId)?.name ?? "",
        value: (e.direction === "income" ? 1 : -1) * pending(e),
        entryId: e.id,
        type: "Previsto",
      });
  }
  if (mode === "actual")
    for (const t of data.transfers)
      if (
        !t.cancelled &&
        inPeriod(t.date, period) &&
        (!account || t.from === account || t.to === account)
      )
        rows.push({
          id: t.id,
          date: t.date,
          description: `Transferência · ${data.accounts.find((a) => a.id === t.from)?.name} → ${data.accounts.find((a) => a.id === t.to)?.name}`,
          account: "Entre contas próprias",
          value: account ? (t.to === account ? t.amount : -t.amount) : 0,
          type: "Transferência",
        });
  rows.sort((a, b) => b.date.localeCompare(a.date));
  const chartMonths = customPeriod
    ? monthsInPeriod(period)
    : Array.from({ length: 6 }, (_, i) =>
        addMonths(month + "-01", i - 5).slice(0, 7),
      );
  const points = chartMonths.map((m) => ({
    label: monthLabel(m, true),
    ...periodCash(
      data,
      customPeriod ? intersectMonth(m, period) : monthPeriod(m),
      account || undefined,
    ),
  }));
  return (
    <>
      <PageHead title="Fluxo de caixa">
        <MonthPicker />
        <select
          aria-label="Conta do fluxo de caixa"
          value={account}
          onChange={(e) => setAccount(e.target.value)}
        >
          <option value="">Todas as contas</option>
          {data.accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </PageHead>
      <div className="metrics">
        <Metric
          label="Saldo disponível hoje"
          value={money(accountBalance(data, account || undefined))}
          detail={
            account
              ? (data.accounts.find((a) => a.id === account)?.name ?? "")
              : "Todas as contas financeiras"
          }
        />
        {[30, 60, 90].map((days) => (
          <Metric
            key={days}
            label={`Saldo previsto em ${days} dias`}
            value={money(projectCash(data, days, account || undefined))}
            detail={`Até ${dateLabel(addDays(now, days))} · Contas futuras`}
            tone={
              projectCash(data, days, account || undefined) < 0
                ? "red"
                : undefined
            }
          />
        ))}
      </div>
      <section className="panel">
        <div className="panel-heading section-heading">
          <div>
            <h2>Movimentação financeira</h2>
          </div>
          <span className="badge neutral">Regime de caixa</span>
        </div>
        <FinancialChart points={points} />
        <div className="chart-summary">
          <span>
            {customPeriod ? "Entradas no período" : "Entradas no mês"}{" "}
            <strong className="text-green">{money(cash.income)}</strong>
          </span>
          <span>
            {customPeriod ? "Saídas no período" : "Saídas no mês"}{" "}
            <strong>{money(cash.expense)}</strong>
          </span>
          <span>
            Saldo das operações{" "}
            <strong>{money(cash.income - cash.expense)}</strong>
          </span>
        </div>
      </section>
      <div className="section-heading above-table">
        <div className="tabs">
          <button
            className={mode === "actual" ? "active" : ""}
            onClick={() => setMode("actual")}
          >
            Realizado
          </button>
          <button
            className={mode === "forecast" ? "active" : ""}
            onClick={() => setMode("forecast")}
          >
            Previsto
          </button>
        </div>
        <div className="toolbar-actions">
          {mode === "forecast" && !customPeriod && (
            <select
              value={horizon}
              aria-label="Horizonte da projeção"
              onChange={(e) => setHorizon(Number(e.target.value))}
            >
              {[30, 60, 90].map((d) => (
                <option key={d} value={d}>
                  Próximos {d} dias
                </option>
              ))}
            </select>
          )}
          <button
            className="button"
            onClick={() =>
              exportCsv("maney-fluxo.csv", [
                ["Data", "Descrição", "Conta", "Valor", "Tipo"],
                ...rows.map((r) => [
                  r.date,
                  r.description,
                  r.account,
                  (r.value / 100).toFixed(2).replace(".", ","),
                  r.type,
                ]),
              ])
            }
          >
            <ArrowDownToLine size={14} />
            Exportar
          </button>
        </div>
      </div>
      {mode === "forecast" && (
        <p className="note">
          A projeção parte do saldo de hoje. Contas vencidas ou com vencimento
          hoje ficam fora da previsão até serem reprogramadas ou baixadas.
        </p>
      )}
      <section className="panel">
        {rows.length ? (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Descrição</th>
                  <th>Conta</th>
                  <th>Situação</th>
                  <th className="number">Valor</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td>{dateLabel(r.date)}</td>
                    <td>
                      {r.entryId ? (
                        <button
                          className="row-title"
                          onClick={() => setEntryId(r.entryId!)}
                        >
                          {r.description}
                        </button>
                      ) : (
                        r.description
                      )}
                    </td>
                    <td className="muted">{r.account}</td>
                    <td>
                      <span className="badge neutral">{r.type}</span>
                    </td>
                    <td
                      className={`number amount ${r.value > 0 ? "text-green" : ""}`}
                    >
                      {r.value ? money(r.value) : "Neutra"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty
            title="Sem movimentações neste período"
            text="Os pagamentos e recebimentos registrados aparecerão aqui."
          />
        )}
        <div className="panel-footnote">
          Transferências entre contas próprias não alteram o saldo consolidado
          nem a DRE.
        </div>
      </section>
      {entryId && <EntryDrawer id={entryId} onClose={() => setEntryId(null)} />}
    </>
  );
}

export function IncomeStatement() {
  const { data, month, period, customPeriod, setMonth } = useFinance(),
    [service, setService] = useState(""),
    [annual, setAnnual] = useState(false),
    [expanded, setExpanded] = useState<Set<string>>(new Set(["revenue"])),
    [detail, setDetail] = useState<{
      title: string;
      entries: Entry[];
      total: number;
    } | null>(null),
    [entryId, setEntryId] = useState<string | null>(null);
  const months = customPeriod
    ? monthsInPeriod(period)
    : annual
      ? Array.from(
          { length: 12 },
          (_, i) => `${month.slice(0, 4)}-${String(i + 1).padStart(2, "0")}`,
        )
      : Array.from({ length: 6 }, (_, i) =>
          addMonths(month + "-01", i - 5).slice(0, 7),
        );
  const reports = months.map((m) =>
      customPeriod
        ? periodDre(data, intersectMonth(m, period), { service })
        : dre(data, m, { service }),
    ),
    current = periodDre(data, period, { service });
  const structure: {
    key: string;
    title: string;
    type: "group" | "subtotal" | "net";
    group?: Group;
    value: (r: ReturnType<typeof dre>) => number;
  }[] = [
    {
      key: "revenue",
      title: "Receita bruta de serviços",
      type: "group",
      group: "revenue",
      value: (r) => r.groups.revenue,
    },
    {
      key: "deductions",
      title: "(−) Deduções e impostos",
      type: "group",
      group: "deductions",
      value: (r) => -r.groups.deductions,
    },
    {
      key: "netRevenue",
      title: "Receita líquida",
      type: "subtotal",
      value: (r) => r.netRevenue,
    },
    {
      key: "direct",
      title: "(−) Custos diretos dos serviços",
      type: "group",
      group: "direct",
      value: (r) => -r.groups.direct,
    },
    {
      key: "contribution",
      title: "Margem após custos diretos",
      type: "subtotal",
      value: (r) => r.contribution,
    },
    {
      key: "operating",
      title: "(−) Despesas operacionais",
      type: "group",
      group: "operating",
      value: (r) => -r.groups.operating,
    },
    {
      key: "operatingResult",
      title: "Resultado operacional",
      type: "subtotal",
      value: (r) => r.operating,
    },
    {
      key: "financialIncome",
      title: "(+) Receitas financeiras",
      type: "group",
      group: "financialIncome",
      value: (r) => r.groups.financialIncome,
    },
    {
      key: "financialExpense",
      title: "(−) Despesas financeiras",
      type: "group",
      group: "financialExpense",
      value: (r) => -r.groups.financialExpense,
    },
    {
      key: "net",
      title: "Resultado líquido gerencial",
      type: "net",
      value: (r) => r.net,
    },
  ];
  const show = (title: string, entries: Entry[], total: number) =>
    setDetail({ title, entries, total });
  return (
    <>
      <PageHead title="DRE gerencial">
        <MonthPicker />
        <button
          className="button"
          onClick={() =>
            exportCsv("maney-dre.csv", [
              ["Grupo", ...months.map((m) => monthLabel(m))],
              ...structure.map((row) => [
                row.title,
                ...reports.map((r) =>
                  (row.value(r) / 100).toFixed(2).replace(".", ","),
                ),
              ]),
            ])
          }
        >
          <ArrowDownToLine size={14} />
          Exportar
        </button>
      </PageHead>
      <div className="metrics">
        <Metric
          label={
            customPeriod
              ? "Receita líquida do período"
              : "Receita líquida do mês"
          }
          value={money(current.netRevenue)}
          detail="Receita bruta menos deduções"
        />
        <Metric
          label="Custos e despesas"
          value={money(
            current.groups.direct +
              current.groups.operating +
              current.groups.financialExpense,
          )}
          detail="Serviços, estrutura e financeiro"
        />
        <Metric
          label="Resultado líquido"
          value={money(current.net)}
          detail="Por data de competência"
          tone={current.net >= 0 ? "green" : "red"}
        />
        <Metric
          label="Margem líquida"
          value={`${current.margin.toFixed(1).replace(".", ",")}%`}
          detail="Sobre a receita líquida"
        />
      </div>
      <div className="report-toolbar">
        <div className="segmented">
          <button
            className={!annual && !customPeriod ? "selected" : ""}
            onClick={() => {
              setAnnual(false);
              setMonth(period.end.slice(0, 7));
            }}
          >
            Últimos 6 meses
          </button>
          <button
            className={annual && !customPeriod ? "selected" : ""}
            onClick={() => {
              setAnnual(true);
              setMonth(period.end.slice(0, 7));
            }}
          >
            Ano inteiro
          </button>
          {customPeriod && (
            <span className="custom-period-tab">Personalizado</span>
          )}
        </div>
        <div className="toolbar-actions">
          <select
            aria-label="Filtrar DRE por serviço"
            value={service}
            onChange={(e) => setService(e.target.value)}
          >
            <option value="">Todos os serviços</option>
            {data.settings.services.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>
      {service && (
        <p className="note">
          Este recorte considera somente lançamentos com o serviço selecionado.
          Despesas gerais sem vínculo não são rateadas.
        </p>
      )}
      <section className="panel">
        <div className="table-scroll">
          <table className="dre-table">
            <thead>
              <tr>
                <th>Descrição</th>
                {months.map((m) => (
                  <th
                    key={m}
                    className={`number ${m === month ? "current-month" : ""}`}
                  >
                    {monthLabel(m, true)}
                    <small>{m.slice(0, 4)}</small>
                  </th>
                ))}
                <th className="number">Acumulado</th>
              </tr>
            </thead>
            <tbody>
              {structure.map((row) => (
                <FragmentRow
                  key={row.key}
                  row={row}
                  months={months}
                  reports={reports}
                  expanded={expanded.has(row.key)}
                  onToggle={() =>
                    setExpanded((old) => {
                      const n = new Set(old);
                      if (n.has(row.key)) n.delete(row.key);
                      else n.add(row.key);
                      return n;
                    })
                  }
                  onDetail={show}
                />
              ))}
              <tr className="margin-row">
                <td>Margem líquida</td>
                {reports.map((r, i) => (
                  <td className="number" key={i}>
                    {r.margin.toFixed(1).replace(".", ",")}%
                  </td>
                ))}
                <td className="number">
                  {(() => {
                    const rev = reports.reduce((s, r) => s + r.netRevenue, 0);
                    return (
                      rev
                        ? (reports.reduce((s, r) => s + r.net, 0) / rev) * 100
                        : 0
                    )
                      .toFixed(1)
                      .replace(".", ",");
                  })()}
                  %
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="panel-footnote">
          Clique em um valor para conferir os lançamentos. Transferências,
          saldos iniciais e categorias “Fora da DRE” são desconsiderados.
        </div>
      </section>
      <p className="report-note">
        Visão gerencial por competência. A classificação das categorias pode ser
        ajustada com sua contabilidade.
      </p>
      {detail && (
        <Sheet
          title={detail.title}
          subtitle={`${detail.entries.length} lançamento(s) · ${money(detail.total)}`}
          onClose={() => setDetail(null)}
          wide
        >
          {detail.entries.length ? (
            <EntryTable entries={detail.entries} onOpen={setEntryId} showKind />
          ) : (
            <Empty
              title="Nenhum lançamento neste grupo"
              text="Os lançamentos classificados neste grupo aparecerão aqui."
            />
          )}
        </Sheet>
      )}
      {entryId && <EntryDrawer id={entryId} onClose={() => setEntryId(null)} />}
    </>
  );
}
function FragmentRow({
  row,
  months,
  reports,
  expanded,
  onToggle,
  onDetail,
}: {
  row: {
    key: string;
    title: string;
    type: string;
    group?: Group;
    value: (r: ReturnType<typeof dre>) => number;
  };
  months: string[];
  reports: ReturnType<typeof dre>[];
  expanded: boolean;
  onToggle: () => void;
  onDetail: (title: string, entries: Entry[], total: number) => void;
}) {
  const { data } = useFinance();
  const categories = data.categories.filter((c) => c.group === row.group),
    sign = ["deductions", "direct", "operating", "financialExpense"].includes(
      row.key,
    )
      ? -1
      : 1;
  return (
    <>
      <tr className={`dre-${row.type}`}>
        <td>
          {row.type === "group" ? (
            <button onClick={onToggle} className="dre-toggle">
              {expanded ? (
                <ChevronDown size={14} />
              ) : (
                <ChevronRight size={14} />
              )}{" "}
              {row.title}
            </button>
          ) : (
            row.title
          )}
        </td>
        {reports.map((r, i) => (
          <td
            key={months[i]}
            className={`number ${row.type === "net" && row.value(r) >= 0 ? "text-green" : ""}`}
          >
            <button
              className="report-number"
              onClick={() =>
                onDetail(
                  `${row.title} · ${monthLabel(months[i])}`,
                  r.entries.filter((e) =>
                    row.group
                      ? data.categories.find((c) => c.id === e.categoryId)
                          ?.group === row.group
                      : (row.key === "netRevenue"
                          ? ["revenue", "deductions"]
                          : row.key === "contribution"
                            ? ["revenue", "deductions", "direct"]
                            : row.key === "operatingResult"
                              ? ["revenue", "deductions", "direct", "operating"]
                              : [
                                  "revenue",
                                  "deductions",
                                  "direct",
                                  "operating",
                                  "financialIncome",
                                  "financialExpense",
                                ]
                        ).includes(
                          data.categories.find((c) => c.id === e.categoryId)
                            ?.group ?? "",
                        ),
                  ),
                  row.value(r),
                )
              }
            >
              {money(row.value(r))}
            </button>
          </td>
        ))}
        <td className="number amount">
          {money(reports.reduce((s, r) => s + row.value(r), 0))}
        </td>
      </tr>
      {expanded &&
        row.group &&
        categories.map((c) => (
          <tr key={c.id} className="dre-category">
            <td>{c.name}</td>
            {reports.map((r, i) => {
              const es = r.entries.filter((e) => e.categoryId === c.id);
              return (
                <td key={months[i]} className="number">
                  <button
                    className="report-number"
                    onClick={() =>
                      onDetail(
                        `${c.name} · ${monthLabel(months[i])}`,
                        es,
                        es.reduce((s, e) => s + e.amount * sign, 0),
                      )
                    }
                  >
                    {money(es.reduce((s, e) => s + e.amount * sign, 0))}
                  </button>
                </td>
              );
            })}
            <td className="number">
              {money(
                reports.reduce(
                  (s, r) =>
                    s +
                    r.entries
                      .filter((e) => e.categoryId === c.id)
                      .reduce((t, e) => t + e.amount * sign, 0),
                  0,
                ),
              )}
            </td>
          </tr>
        ))}
    </>
  );
}
