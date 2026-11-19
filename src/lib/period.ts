import {
  addDays,
  cashMonth,
  dre,
  monthLabel,
  today,
  validDate,
  type FinanceData,
} from "./finance";

export type DatePeriod = { start: string; end: string };
export function monthPeriod(month: string): DatePeriod {
  const [year, index] = month.split("-").map(Number);
  return {
    start: `${month}-01`,
    end: `${month}-${new Date(Date.UTC(year, index, 0)).getUTCDate()}`,
  };
}
export const inPeriod = (date: string, period: DatePeriod) =>
  date >= period.start && date <= period.end;
export function validatePeriod(period: DatePeriod) {
  if (!validDate(period.start) || !validDate(period.end))
    throw new Error("Preencha as duas datas do período.");
  if (period.start > period.end)
    throw new Error("A data final deve ser igual ou posterior à data inicial.");
}
export function weekPeriod(date = today()): DatePeriod {
  const day = new Date(date + "T12:00:00Z").getUTCDay();
  const start = addDays(date, -((day + 6) % 7));
  return { start, end: addDays(start, 6) };
}
export function upcomingDateLabel(date: string, base = today()) {
  if (inPeriod(date, weekPeriod(base)))
    return new Intl.DateTimeFormat("pt-BR", {
      weekday: "long",
      timeZone: "UTC",
    })
      .format(new Date(date + "T12:00:00Z"))
      .replace("-feira", "");
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: date.slice(0, 4) !== base.slice(0, 4) ? "numeric" : undefined,
    timeZone: "UTC",
  })
    .format(new Date(date + "T12:00:00Z"))
    .replace(".", "");
}
export function periodLabel(period: DatePeriod, custom: boolean) {
  if (!custom) return monthLabel(period.start.slice(0, 7));
  const compact = (date: string) => `${date.slice(8, 10)}/${date.slice(5, 7)}`;
  return `${compact(period.start)}${period.start.slice(0, 4) !== period.end.slice(0, 4) ? "/" + period.start.slice(0, 4) : ""} – ${compact(period.end)}/${period.end.slice(0, 4)}`;
}
export function shiftPeriod(period: DatePeriod, direction: number): DatePeriod {
  const days =
    (Date.parse(period.end) - Date.parse(period.start)) / 86400000 + 1;
  return {
    start: addDays(period.start, direction * days),
    end: addDays(period.end, direction * days),
  };
}
export function monthsInPeriod(period: DatePeriod) {
  const [sy, sm] = period.start.split("-").map(Number),
    [ey, em] = period.end.split("-").map(Number);
  return Array.from({ length: (ey - sy) * 12 + em - sm + 1 }, (_, i) => {
    const date = new Date(Date.UTC(sy, sm - 1 + i, 1));
    return date.toISOString().slice(0, 7);
  });
}
export const intersectMonth = (
  month: string,
  period: DatePeriod,
): DatePeriod => {
  const full = monthPeriod(month);
  return {
    start: full.start > period.start ? full.start : period.start,
    end: full.end < period.end ? full.end : period.end,
  };
};
export function periodDre(
  data: FinanceData,
  period: DatePeriod,
  filter?: Parameters<typeof dre>[2],
) {
  return dre(
    {
      ...data,
      entries: data.entries.filter((e) => inPeriod(e.competence, period)),
    },
    "",
    filter,
  );
}
export function periodCash(
  data: FinanceData,
  period: DatePeriod,
  accountId?: string,
) {
  return cashMonth(
    {
      ...data,
      entries: data.entries.map((e) => ({
        ...e,
        payments: e.payments.filter((p) => inPeriod(p.date, period)),
      })),
    },
    "",
    accountId,
  );
}
