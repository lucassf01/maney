"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { type FinanceData, generateRecurrences, today } from "@/lib/finance";
import { emptyData, removeDemoData } from "@/lib/workspace";
import { loadData, replaceData, saveData } from "@/lib/storage";
import { CheckCircle2, CircleAlert, X } from "lucide-react";
import { Brand } from "./brand";
import { monthPeriod, validatePeriod, type DatePeriod } from "@/lib/period";

type Store = {
  data: FinanceData;
  month: string;
  setMonth: (v: string) => void;
  period: DatePeriod;
  customPeriod: boolean;
  setPeriod: (period: DatePeriod) => void;
  update: (
    fn: (data: FinanceData) => FinanceData,
    message?: string,
  ) => Promise<boolean>;
  notify: (message: string, error?: boolean) => void;
  busy: boolean;
};
const Context = createContext<Store | null>(null);
export function useFinance() {
  const value = useContext(Context);
  if (!value) throw new Error("Workspace indisponível");
  return value;
}
export function Provider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<FinanceData | null>(null),
    [month, setMonthValue] = useState(today().slice(0, 7)),
    [period, setPeriodValue] = useState<DatePeriod>(() =>
      monthPeriod(today().slice(0, 7)),
    ),
    [customPeriod, setCustomPeriod] = useState(false),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [toast, setToast] = useState<{ message: string; error?: boolean } | null>(
      null,
    );
  const current = useRef<FinanceData | null>(null),
    queue = useRef<Promise<unknown>>(Promise.resolve());
  const setMonth = useCallback((value: string) => {
    setMonthValue(value);
    setPeriodValue(monthPeriod(value));
    setCustomPeriod(false);
  }, []);
  const setPeriod = useCallback((value: DatePeriod) => {
    validatePeriod(value);
    setPeriodValue(value);
    setMonthValue(value.start.slice(0, 7));
    setCustomPeriod(true);
  }, []);
  const notify = useCallback(
    (message: string, error = false) => setToast({ message, error }),
    [],
  );
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const stored = await loadData();
        const cleaned = stored ? removeDemoData(stored) : null;
        const next = generateRecurrences(cleaned?.data ?? emptyData());
        if (!stored || cleaned?.changed) await replaceData(next);
        else await saveData(next);
        if (active) {
          current.current = next;
          setData(next);
          if (cleaned?.changed)
            notify("Dados demonstrativos removidos. O workspace está vazio.");
        }
      } catch {
        if (active)
          setError(
            "Não foi possível abrir os dados locais. Verifique se o navegador permite armazenamento e tente novamente.",
          );
      }
    })();
    return () => {
      active = false;
    };
  }, [notify]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 5500);
    return () => clearTimeout(timer);
  }, [toast]);
  const update = useCallback(
    async (
      fn: (d: FinanceData) => FinanceData,
      message?: string,
    ): Promise<boolean> => {
      setBusy(true);
      let success = false;
      const task = queue.current
        .catch(() => {})
        .then(async () => {
          try {
            if (!current.current)
              throw new Error("Os dados ainda estão carregando.");
            const next = fn(current.current);
            await saveData(next);
            current.current = next;
            setData(next);
            if (message) notify(message);
            success = true;
          } catch (e) {
            notify(
              (e as Error).message ||
                "Não foi possível salvar. Tente novamente.",
              true,
            );
          }
        });
      queue.current = task;
      await task;
      setBusy(false);
      return success;
    },
    [notify],
  );
  if (error)
    return (
      <main className="startup">
        <CircleAlert size={28} />
        <h1>Vamos tentar novamente</h1>
        <p>{error}</p>
        <button className="button primary" onClick={() => location.reload()}>
          Tentar novamente
        </button>
      </main>
    );
  if (!data)
    return (
      <div className="startup" aria-busy="true">
        <div className="brand loading-brand">
          <Brand />
        </div>
        <p>Preparando seu financeiro…</p>
        <div className="skeleton" style={{ width: 240, height: 6 }} />
      </div>
    );
  return (
    <Context.Provider
      value={{
        data,
        month,
        setMonth,
        period,
        customPeriod,
        setPeriod,
        update,
        notify,
        busy,
      }}
    >
      {children}
      {toast && (
        <div
          className={`toast ${toast.error ? "error" : ""}`}
          role={toast.error ? "alert" : "status"}
        >
          {toast.error ? <CircleAlert size={18} /> : <CheckCircle2 size={18} />}
          <span>{toast.message}</span>
          <button
            className="icon-button"
            aria-label="Fechar aviso"
            onClick={() => setToast(null)}
          >
            <X size={15} />
          </button>
        </div>
      )}
    </Context.Provider>
  );
}
