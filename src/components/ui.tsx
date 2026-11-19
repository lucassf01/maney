"use client";
import {
  cloneElement,
  isValidElement,
  useEffect,
  useId,
  useRef,
  type ReactElement,
  type ReactNode,
} from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Inbox,
  ArrowUpRight,
  Ban,
  CheckCircle2,
  CircleAlert,
  CircleDot,
  Clock3,
} from "lucide-react";
import { addMonths, monthLabel, type Entry, status } from "@/lib/finance";
import { useFinance } from "./provider";
import { DateFilter } from "./date-filter";

export function Sheet({
  title,
  subtitle,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null),
    close = useRef(onClose),
    titleId = useId();
  close.current = onClose;
  useEffect(() => {
    const dialog = ref.current!;
    const previous = document.activeElement as HTMLElement | null;
    dialog.showModal();
    const cancel = (e: Event) => {
      e.preventDefault();
      close.current();
    };
    dialog.addEventListener("cancel", cancel);
    return () => {
      dialog.removeEventListener("cancel", cancel);
      dialog.close();
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      className={`sheet ${wide ? "wide" : ""}`}
      onClick={(e) => {
        if (
          e.target === e.currentTarget &&
          e.clientX < e.currentTarget.getBoundingClientRect().left
        )
          onClose();
      }}
    >
      <div className="sheet-head">
        <div>
          <h2 id={titleId}>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        <button
          className="icon-button"
          onClick={onClose}
          aria-label="Fechar painel"
        >
          <X size={20} />
        </button>
      </div>
      <div className="sheet-content">{children}</div>
    </dialog>
  );
}
export function MonthPicker() {
  return <DateFilter />;
}
export function PageHead({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="page-head">
      <div>
        <h1>{title}</h1>
      </div>
      <div className="head-actions">{children}</div>
    </div>
  );
}
export function StatusBadge({ entry }: { entry: Entry }) {
  const s = status(entry),
    type =
      s === "Atrasado"
        ? "danger"
        : ["Pago", "Recebido"].includes(s)
          ? "success"
          : s === "Cancelado"
            ? "neutral"
            : s === "Parcial"
              ? "warning"
              : "pending";
  const Icon =
    type === "danger"
      ? CircleAlert
      : type === "success"
        ? CheckCircle2
        : type === "neutral"
          ? Ban
          : type === "warning"
            ? CircleDot
            : Clock3;
  return (
    <span className={`badge ${type}`}>
      <Icon size={12} strokeWidth={1.7} aria-hidden="true" />
      {s}
    </span>
  );
}
export function Empty({
  title,
  text,
  action,
}: {
  title: string;
  text: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty">
      <Inbox size={28} strokeWidth={1.3} />
      <h3>{title}</h3>
      <p>{text}</p>
      {action}
    </div>
  );
}
export function Field({
  label,
  hint,
  children,
  full = false,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  full?: boolean;
}) {
  const id = useId();
  const control = isValidElement(children)
    ? cloneElement(children as ReactElement<Record<string, unknown>>, {
        "aria-labelledby": `${id}-label`,
        "aria-describedby": hint ? `${id}-hint` : undefined,
      })
    : children;
  return (
    <label className={`field ${full ? "full" : ""}`}>
      <span id={`${id}-label`}>{label}</span>
      {control}
      {hint && <small id={`${id}-hint`}>{hint}</small>}
    </label>
  );
}
export function Metric({
  label,
  value,
  detail,
  tone,
  action,
}: {
  label: string;
  value: string;
  detail: string;
  tone?: "green" | "red";
  action?: () => void;
}) {
  const inner = (
    <>
      <div className="metric-label">
        {label}
        {action && <ArrowUpRight size={14} />}
      </div>
      <strong className={tone ? `text-${tone}` : ""}>{value}</strong>
      <small>{detail}</small>
    </>
  );
  return action ? (
    <button className="metric metric-button" onClick={action}>
      {inner}
    </button>
  ) : (
    <div className="metric">{inner}</div>
  );
}
export function FormError({ text }: { text: string }) {
  return text ? (
    <p role="alert" className="form-error">
      {text}
    </p>
  ) : null;
}
