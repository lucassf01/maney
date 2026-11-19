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
import { loadData } from "@/lib/storage";
import {
  cloudWorkspace,
  WorkspaceConflict,
  type CloudWorkspace,
} from "@/lib/supabase";
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
  previousBackup: () => Promise<FinanceData | null>;
  busy: boolean;
};
const Context = createContext<Store | null>(null);
export function useFinance() {
  const value = useContext(Context);
  if (!value) throw new Error("Workspace indisponível");
  return value;
}
function hasLocalData(data: FinanceData) {
  return (
    data.contacts.length ||
    data.categories.length ||
    data.accounts.length ||
    data.entries.length ||
    data.recurrences.length ||
    data.transfers.length ||
    data.settings.services.length ||
    data.settings.projects.length ||
    data.settings.company !== emptyData().settings.company
  );
}

export function Provider({
  children,
  userId,
  allowLegacyImport,
}: {
  children: ReactNode;
  userId: string;
  allowLegacyImport: boolean;
}) {
  const [cloud] = useState(() => cloudWorkspace(userId));
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
  const current = useRef<CloudWorkspace | null>(null),
    pendingWrites = useRef(0),
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
  const publish = useCallback((workspace: CloudWorkspace) => {
    current.current = workspace;
    setData(workspace.data);
  }, []);
  useEffect(() => {
    let active = true;
    let refreshing = false;

    async function reconcile(workspace: CloudWorkspace) {
      const next = generateRecurrences(workspace.data);
      if (next.entries.length === workspace.data.entries.length)
        return workspace;
      return cloud.write(next, workspace.revision);
    }

    async function openWorkspace() {
      try {
        const stored = await cloud.read();
        let next = stored ?? { data: emptyData(), revision: null };
        let migrated = false;
        try {
          const local =
            !stored && allowLegacyImport
              ? await loadData().catch(() => null)
              : null;
          const legacy = local ? removeDemoData(local).data : null;
          if (!active) return;
          if (legacy && hasLocalData(legacy)) {
            next = await cloud.write(generateRecurrences(legacy), null);
            migrated = true;
          } else if (stored) {
            next = await reconcile(stored);
          }
        } catch (failure) {
          if (!(failure instanceof WorkspaceConflict)) throw failure;
          const latest = await cloud.read();
          if (!latest) throw failure;
          next = latest;
        }
        if (!active) return;
        publish(next);
        if (migrated) notify("Os dados deste navegador foram sincronizados.");
      } catch {
        if (active)
          setError(
            "Não foi possível carregar seu financeiro no Supabase. Confira sua conexão e tente novamente.",
          );
      }
    }

    function isEditing() {
      return (
        document.visibilityState !== "visible" ||
        document.querySelector("dialog[open], form:focus-within") !== null ||
        pendingWrites.current > 0
      );
    }

    function refresh() {
      if (!current.current || refreshing || isEditing()) return;
      refreshing = true;
      const task = queue.current.then(async () => {
        if (!active || !current.current || isEditing()) return;
        const newer = await cloud.read(current.current.revision);
        if (active && newer && !isEditing()) publish(newer);
      });
      queue.current = task
        .catch(() => {})
        .finally(() => {
          refreshing = false;
        });
    }

    void openWorkspace();
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    const timer = setInterval(refresh, 30_000);
    return () => {
      active = false;
      clearInterval(timer);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [allowLegacyImport, cloud, notify, publish]);
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
      pendingWrites.current++;
      setBusy(true);
      let success = false;
      const task = queue.current
        .catch(() => {})
        .then(async () => {
          try {
            if (!current.current)
              throw new Error("Os dados ainda estão carregando.");
            const next = fn(current.current.data);
            publish(await cloud.write(next, current.current.revision));
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
      pendingWrites.current--;
      setBusy(pendingWrites.current > 0);
      return success;
    },
    [cloud, notify, publish],
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
        previousBackup: cloud.previous,
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
