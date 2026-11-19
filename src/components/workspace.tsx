"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sidebar, type SidebarSection } from "./reactframe/sidebar";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Bell,
  ChartNoAxesCombined,
  ChevronRight,
  FileBarChart2,
  House,
  Landmark,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings2,
  Tags,
  Users,
  X,
} from "lucide-react";
import { dateLabel, money, pending, today } from "@/lib/finance";
import { useFinance } from "./provider";
import { CashFlow, IncomeStatement } from "./reports";
import { Overview } from "./overview";
import { Ledger } from "./ledger";
import { Cadastros } from "./cadastros";
import { Settings } from "./settings";
import { EntryDrawer } from "./entry-drawer";
import { Empty, Sheet, StatusBadge } from "./ui";
import { Brand } from "./brand";
import { profileInitials, type Profile as AccountProfile } from "@/lib/auth";
import { Profile } from "./profile";

const primary = [
  { path: "", name: "Visão geral", icon: House },
  { path: "pagar", name: "Contas a pagar", icon: ArrowUpRight },
  { path: "receber", name: "Contas a receber", icon: ArrowDownLeft },
  { path: "fluxo-de-caixa", name: "Fluxo de caixa", icon: ChartNoAxesCombined },
  { path: "dre", name: "DRE gerencial", icon: FileBarChart2 },
];
const secondary = [
  { path: "contatos", name: "Clientes e fornecedores", icon: Users },
  { path: "contas", name: "Contas financeiras", icon: Landmark },
  { path: "categorias", name: "Categorias financeiras", icon: Tags },
];
export function Workspace({
  page,
  profile,
}: {
  page: string;
  profile: AccountProfile;
}) {
  const router = useRouter();
  const { data } = useFinance(),
    [mobile, setMobile] = useState(false),
    [collapsed, setCollapsed] = useState(false),
    [searchOpen, setSearchOpen] = useState(false),
    [search, setSearch] = useState(""),
    [notificationOpen, setNotificationOpen] = useState(false),
    [newEntry, setNewEntry] = useState(false),
    [entryId, setEntryId] = useState<string | null>(null);
  const due = data.entries.filter((e) => pending(e) && e.dueDate <= today()),
    pageName = [
      ...primary,
      ...secondary,
      { path: "configuracoes", name: "Configurações" },
      { path: "perfil", name: "Perfil" },
    ].find((n) => n.path === page)?.name;
  const mobileRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem("dimdim-sidebar-collapsed") === "true");
    } catch {
      /* Keep navigation available if storage is disabled. */
    }
  }, []);
  const toggleSidebar = () => {
    const next = !collapsed;
    setCollapsed(next);
    try {
      localStorage.setItem("dimdim-sidebar-collapsed", String(next));
    } catch {
      /* The layout still works for this visit. */
    }
  };
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((s) => !s);
      }
    };
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, []);
  useEffect(() => {
    if (mobile) mobileRef.current?.showModal();
    else mobileRef.current?.close();
  }, [mobile]);
  useEffect(() => {
    setMobile(false);
  }, [page]);
  const sections: SidebarSection[] = [
    {
      id: "financeiro",
      items: primary.map((n) => ({
        id: n.path || "overview",
        label: n.name,
        icon: <n.icon size={17} />,
        badge:
          n.path === "pagar" &&
          due.filter((e) => e.direction === "expense").length
            ? due.filter((e) => e.direction === "expense").length
            : undefined,
      })),
    },
    {
      id: "cadastros",
      label: "Cadastros",
      items: secondary.map((n) => ({
        id: n.path,
        label: n.name,
        icon: <n.icon size={17} />,
      })),
    },
    {
      id: "preferencias",
      items: [
        {
          id: "configuracoes",
          label: "Configurações",
          icon: <Settings2 size={17} />,
        },
      ],
    },
  ];
  const navigation = (isMobile = false) => (
    <Sidebar
      sections={sections}
      activeId={page || "overview"}
      onActiveChange={(id) => {
        router.push(id === "overview" ? "/" : "/" + id);
        setMobile(false);
      }}
      collapsed={isMobile ? false : collapsed}
      onCollapsedChange={() => toggleSidebar()}
      collapsible={!isMobile}
      header={
        <Link href="/" className="brand" aria-label="maney · Início">
          <Brand />
        </Link>
      }
      footer={
        <div
          className="rf-local-notice"
          title="Dados na nuvem · Acesse com a mesma conta"
        >
          <span className="rf-local-dot" />
          <span>Dados na nuvem</span>
        </div>
      }
      user={{
        name: profile.name,
        subtitle: profile.email,
        initials: profileInitials(profile.name),
        onClick: () => {
          router.push("/perfil");
          setMobile(false);
        },
      }}
      width={isMobile ? 266 : 236}
      collapsedWidth={64}
      height="100%"
      size="sm"
      theme="light"
    />
  );
  const results = search.trim()
    ? data.entries
        .filter((e) =>
          `${e.description} ${data.contacts.find((c) => c.id === e.contactId)?.name ?? ""}`
            .toLocaleLowerCase("pt-BR")
            .includes(search.toLocaleLowerCase("pt-BR")),
        )
        .slice(0, 20)
    : [];
  return (
    <div className={`app-shell ${collapsed ? "sidebar-collapsed" : ""}`}>
      <a href="#main" className="skip-link">
        Pular para o conteúdo
      </a>
      <aside className="sidebar sidebar-reactframe" id="desktop-sidebar">
        {navigation()}
      </aside>
      <dialog
        className="mobile-nav mobile-reactframe"
        ref={mobileRef}
        onCancel={(e) => {
          e.preventDefault();
          setMobile(false);
        }}
      >
        <button
          className="icon-button mobile-close"
          onClick={() => setMobile(false)}
          aria-label="Fechar navegação"
        >
          <X size={20} />
        </button>
        {navigation(true)}
      </dialog>
      <div className="workspace-main">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="icon-button mobile-trigger"
              aria-label="Abrir navegação"
              onClick={() => setMobile(true)}
            >
              <Menu size={20} />
            </button>
            <span className="breadcrumb-company">Meu negócio</span>
            <ChevronRight size={13} />
            <strong>{pageName}</strong>
          </div>
          <div className="topbar-actions">
            <button
              className="global-search"
              aria-label="Buscar no financeiro"
              onClick={() => setSearchOpen(true)}
            >
              <Search size={15} />
              <span>Buscar no financeiro…</span>
              <kbd>Ctrl K</kbd>
            </button>
            <button
              className="icon-button notification-button"
              aria-label={`Alertas: ${due.length} contas pendentes até hoje`}
              onClick={() => setNotificationOpen(true)}
            >
              <Bell size={18} />
              {due.length > 0 && <i />}
            </button>
            <button
              className="profile-avatar top-avatar"
              aria-label={`Abrir perfil de ${profile.name}`}
              onClick={() => router.push("/perfil")}
            >
              {profileInitials(profile.name)}
            </button>
          </div>
        </header>
        <main id="main" className="main-content">
          {page === "perfil" ? (
            <Profile profile={profile} />
          ) : page === "" ? (
            <Overview />
          ) : page === "pagar" ? (
            <Ledger key="expense" direction="expense" />
          ) : page === "receber" ? (
            <Ledger key="income" direction="income" />
          ) : page === "fluxo-de-caixa" ? (
            <CashFlow />
          ) : page === "dre" ? (
            <IncomeStatement />
          ) : page === "contatos" ? (
            <Cadastros key="contacts" kind="contacts" />
          ) : page === "contas" ? (
            <Cadastros key="accounts" kind="accounts" />
          ) : page === "categorias" ? (
            <Cadastros key="categories" kind="categories" />
          ) : (
            <Settings />
          )}
          <footer className="app-footer">
            <span>
              maney<span className="muted"> · Seu financeiro, em ordem.</span>
            </span>
            <span>Dados na nuvem · BRL</span>
          </footer>
        </main>
      </div>
      {searchOpen && (
        <Sheet
          title="Buscar no financeiro"
          subtitle="Pesquise por descrição ou nome do contato."
          onClose={() => setSearchOpen(false)}
        >
          <div className="search-field command-search">
            <Search size={18} />
            <input
              autoFocus
              value={search}
              placeholder="O que você procura?"
              aria-label="Busca global"
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {results.length ? (
            <div className="search-results">
              {results.map((e) => (
                <button
                  key={e.id}
                  onClick={() => {
                    setSearchOpen(false);
                    setEntryId(e.id);
                  }}
                >
                  <span
                    className={`list-icon ${e.direction === "income" ? "income" : ""}`}
                  >
                    {e.direction === "income" ? (
                      <ArrowDownLeft size={16} />
                    ) : (
                      <ArrowUpRight size={16} />
                    )}
                  </span>
                  <span>
                    <strong>{e.description}</strong>
                    <small>
                      {dateLabel(e.dueDate)} ·{" "}
                      {data.contacts.find((c) => c.id === e.contactId)?.name ??
                        "Geral"}
                    </small>
                  </span>
                  <b>{money(e.amount)}</b>
                </button>
              ))}
            </div>
          ) : (
            <Empty
              title={search ? "Nenhum resultado" : "Encontre um lançamento"}
              text={
                search
                  ? "Tente outro nome ou parte da descrição."
                  : "Digite para buscar em todos os períodos."
              }
            />
          )}
        </Sheet>
      )}
      {notificationOpen && (
        <Sheet
          title="Precisa da sua atenção"
          subtitle="Lançamentos pendentes com vencimento até hoje."
          onClose={() => setNotificationOpen(false)}
        >
          {due.length ? (
            <div className="search-results">
              {due
                .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
                .map((e) => (
                  <button
                    key={e.id}
                    onClick={() => {
                      setNotificationOpen(false);
                      setEntryId(e.id);
                    }}
                  >
                    <span>
                      <strong>{e.description}</strong>
                      <small>
                        {dateLabel(e.dueDate)} · {money(pending(e))} em aberto
                      </small>
                    </span>
                    <StatusBadge entry={e} />
                  </button>
                ))}
            </div>
          ) : (
            <Empty
              title="Tudo em dia"
              text="Você não tem contas pendentes com vencimento até hoje."
            />
          )}
        </Sheet>
      )}
      {(newEntry || entryId) && (
        <EntryDrawer
          id={entryId ?? undefined}
          onClose={() => {
            setNewEntry(false);
            setEntryId(null);
          }}
        />
      )}
    </div>
  );
}
