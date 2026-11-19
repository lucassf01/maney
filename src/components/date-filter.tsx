"use client";
import { useId, useRef, useState, type FormEvent } from "react";
import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { addDays, addMonths, today } from "@/lib/finance";
import {
  monthPeriod,
  periodLabel,
  shiftPeriod,
  weekPeriod,
  validatePeriod,
  type DatePeriod,
} from "@/lib/period";
import { useFinance } from "./provider";

export function DateFilter() {
  const { month, setMonth, period, customPeriod, setPeriod } = useFinance();
  const id = useId(),
    popover = useRef<HTMLDivElement>(null),
    [draft, setDraft] = useState(period),
    [presetMonth, setPresetMonth] = useState(customPeriod ? "" : month),
    [error, setError] = useState(""),
    [open, setOpen] = useState(false),
    [position, setPosition] = useState({ top: 0, left: 0 });
  function prepare(event: React.MouseEvent<HTMLButtonElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    setPosition({
      top: Math.min(rect.bottom + 8, Math.max(12, innerHeight - 330)),
      left: Math.max(12, Math.min(rect.right - 360, innerWidth - 372)),
    });
    setDraft(period);
    setPresetMonth(customPeriod ? "" : month);
    setError("");
  }
  function apply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      validatePeriod(draft);
      if (presetMonth) setMonth(presetMonth);
      else setPeriod(draft);
      popover.current?.hidePopover();
    } catch (e) {
      setError((e as Error).message);
    }
  }
  function preset(value: DatePeriod, m = "") {
    setDraft(value);
    setPresetMonth(m);
    setError("");
  }
  const shift = (direction: number) =>
    customPeriod
      ? setPeriod(shiftPeriod(period, direction))
      : setMonth(addMonths(month + "-01", direction).slice(0, 7));
  const current = today().slice(0, 7);
  return (
    <div className="month-picker date-filter">
      <button
        className="icon-button"
        aria-label="Período anterior"
        onClick={() => shift(-1)}
      >
        <ChevronLeft size={15} />
      </button>
      <button
        className="date-filter-trigger"
        popoverTarget={id}
        onClick={prepare}
        aria-label="Selecionar período"
        aria-expanded={open}
      >
        <CalendarDays size={15} />
        <span>{periodLabel(period, customPeriod)}</span>
        <ChevronDown size={12} />
      </button>
      <button
        className="icon-button"
        aria-label="Próximo período"
        onClick={() => shift(1)}
      >
        <ChevronRight size={15} />
      </button>
      <div
        ref={popover}
        id={id}
        popover="auto"
        role="dialog"
        aria-labelledby={`${id}-title`}
        className="date-popover"
        style={position}
        onToggle={() =>
          setOpen(popover.current?.matches(":popover-open") ?? false)
        }
      >
        <form onSubmit={apply} noValidate>
          <div className="date-popover-head">
            <h2 id={`${id}-title`}>Selecionar período</h2>
            <button
              type="button"
              className="icon-button"
              aria-label="Fechar filtro de datas"
              onClick={() => popover.current?.hidePopover()}
            >
              <X size={16} />
            </button>
          </div>
          <div className="date-presets">
            <button
              type="button"
              onClick={() => preset(monthPeriod(current), current)}
            >
              Este mês
            </button>
            <button
              type="button"
              onClick={() => {
                const m = addMonths(current + "-01", -1).slice(0, 7);
                preset(monthPeriod(m), m);
              }}
            >
              Mês anterior
            </button>
            <button type="button" onClick={() => preset(weekPeriod())}>
              Esta semana
            </button>
            <button
              type="button"
              onClick={() =>
                preset({ start: addDays(today(), -29), end: today() })
              }
            >
              Últimos 30 dias
            </button>
          </div>
          <div className="date-range-fields">
            <label className="field">
              <span>Data inicial</span>
              <input
                type="date"
                aria-label="Data inicial"
                required
                value={draft.start}
                onChange={(e) => {
                  setDraft((d) => ({ ...d, start: e.target.value }));
                  setPresetMonth("");
                  setError("");
                }}
              />
            </label>
            <label className="field">
              <span>Data final</span>
              <input
                type="date"
                aria-label="Data final"
                required
                min={draft.start}
                value={draft.end}
                onChange={(e) => {
                  setDraft((d) => ({ ...d, end: e.target.value }));
                  setPresetMonth("");
                  setError("");
                }}
              />
            </label>
          </div>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <div className="date-popover-footer">
            <button
              type="button"
              className="button"
              onClick={() => popover.current?.hidePopover()}
            >
              Cancelar
            </button>
            <button className="button primary" type="submit">
              Aplicar período
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
