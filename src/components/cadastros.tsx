"use client";
import { useState, type FormEvent } from "react";
import {
  Archive,
  ArrowLeftRight,
  ArrowUpRight,
  Building2,
  ChevronRight,
  Mail,
  Plus,
  Search,
  Users,
  Wallet,
} from "lucide-react";
import {
  accountBalance,
  audit,
  type Account,
  type Category,
  type Contact,
  type Group,
  groupNames,
  money,
  parseMoney,
  pending,
  today,
  uid,
  validateTransfer,
} from "@/lib/finance";
import { useFinance } from "./provider";
import { Empty, Field, FormError, PageHead, Sheet } from "./ui";
import { EntryTable } from "./ledger";
import { EntryDrawer } from "./entry-drawer";

type Kind = "contacts" | "accounts" | "categories";
export function Cadastros({ kind }: { kind: Kind }) {
  const { data, update, busy, notify } = useFinance(),
    [search, setSearch] = useState(""),
    [edit, setEdit] = useState<string | null>(null),
    [contactId, setContactId] = useState<string | null>(null),
    [entryId, setEntryId] = useState<string | null>(null),
    [transfer, setTransfer] = useState(false),
    [archived, setArchived] = useState(false);
  const names = {
    contacts: [
      "Clientes e fornecedores",
      "Pessoas e empresas que fazem parte do seu financeiro.",
      "Novo contato",
    ],
    accounts: [
      "Contas financeiras",
      "Seus bancos, seus saldos e suas movimentações.",
      "Nova conta",
    ],
    categories: [
      "Categorias financeiras",
      "Uma classificação simples para uma DRE que faz sentido.",
      "Nova categoria",
    ],
  }[kind];
  const items = data[kind].filter(
    (x) =>
      x.name
        .toLocaleLowerCase("pt-BR")
        .includes(search.toLocaleLowerCase("pt-BR")) &&
      (archived || !x.archived),
  );
  const selectedContact = data.contacts.find((c) => c.id === contactId),
    contactEntries = data.entries.filter((e) => e.contactId === contactId);
  const directGroups = ["revenue", "deductions", "direct"];
  const contribution = contactEntries
    .filter(
      (e) =>
        !e.cancelled &&
        directGroups.includes(
          data.categories.find((c) => c.id === e.categoryId)?.group ?? "",
        ),
    )
    .reduce(
      (s, e) =>
        s +
        (data.categories.find((c) => c.id === e.categoryId)?.group === "revenue"
          ? 1
          : -1) *
          e.amount,
      0,
    );
  async function archive(id: string) {
    await update((d) => {
      const item = d[kind].find((x) => x.id === id)!;
      if (
        !item.archived &&
        kind === "accounts" &&
        (Math.abs(accountBalance(d, id)) > 0 ||
          d.entries.some((e) => e.accountId === id && pending(e)) ||
          d.recurrences.some((r) => r.accountId === id && !r.paused))
      )
        throw new Error(
          "Para arquivar, zere o saldo da conta e remova seus lançamentos pendentes e recorrências ativas.",
        );
      if (
        d[kind].filter((x) => !x.archived).length === 1 &&
        !item.archived &&
        kind === "accounts"
      )
        throw new Error("Mantenha pelo menos uma conta ativa.");
      return {
        ...d,
        [kind]: d[kind].map((x) =>
          x.id === id ? { ...x, archived: !x.archived } : x,
        ),
      };
    }, "Cadastro atualizado.");
  }
  return (
    <>
      <PageHead title={names[0]}>
        {kind === "accounts" && (
          <button className="button" onClick={() => setTransfer(true)}>
            <ArrowLeftRight size={15} />
            Transferir
          </button>
        )}
        <button className="button primary" onClick={() => setEdit("new")}>
          <Plus size={15} />
          {names[2]}
        </button>
      </PageHead>
      {kind === "accounts" && (
        <div className="account-grid">
          {data.accounts
            .filter((a) => !a.archived)
            .map((a, i) => (
              <div className="panel bank-card" key={a.id}>
                <div className="section-heading">
                  <span className={`bank-icon bank-${i % 2}`}>{a.name[0]}</span>
                  <button
                    className="icon-button"
                    aria-label={`Editar ${a.name}`}
                    onClick={() => setEdit(a.id)}
                  >
                    <ArrowUpRight size={17} />
                  </button>
                </div>
                <h2>{a.name}</h2>
                <p>{a.bank || "Conta financeira"}</p>
                <strong className="bank-balance">
                  {money(accountBalance(data, a.id))}
                </strong>
                <small>Saldo disponível hoje</small>
              </div>
            ))}
        </div>
      )}
      <section className="panel">
        <div className="table-toolbar">
          <div className="search-field">
            <Search size={16} />
            <input
              aria-label="Buscar cadastros"
              placeholder="Buscar por nome…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={archived}
              onChange={(e) => setArchived(e.target.checked)}
            />
            Mostrar arquivados
          </label>
        </div>
        {items.length ? (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>
                    {kind === "contacts"
                      ? "Tipo"
                      : kind === "categories"
                        ? "Tipo de lançamento"
                        : "Instituição"}
                  </th>
                  <th>
                    {kind === "contacts"
                      ? "Contato"
                      : kind === "categories"
                        ? "Grupo da DRE"
                        : "Saldo inicial"}
                  </th>
                  <th>Situação</th>
                  <th className="number">Ações</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <button
                        className="row-title"
                        onClick={() =>
                          kind === "contacts"
                            ? setContactId(item.id)
                            : setEdit(item.id)
                        }
                      >
                        {item.name}
                      </button>
                    </td>
                    <td>
                      {kind === "contacts"
                        ? {
                            client: "Cliente",
                            supplier: "Fornecedor",
                            both: "Cliente e fornecedor",
                          }[(item as Contact).type]
                        : kind === "categories"
                          ? (item as Category).direction === "income"
                            ? "Receita"
                            : "Despesa"
                          : (item as Account).bank}
                    </td>
                    <td className="muted">
                      {kind === "contacts"
                        ? (item as Contact).email || "—"
                        : kind === "categories"
                          ? groupNames[(item as Category).group]
                          : money((item as Account).opening)}
                    </td>
                    <td>
                      <span
                        className={`badge ${item.archived ? "neutral" : "success"}`}
                      >
                        {item.archived ? "Arquivado" : "Ativo"}
                      </span>
                    </td>
                    <td>
                      <div className="row-actions">
                        <button
                          className="button small"
                          onClick={() => setEdit(item.id)}
                        >
                          Editar
                        </button>
                        <button
                          className="icon-button"
                          disabled={busy}
                          aria-label={`${item.archived ? "Reativar" : "Arquivar"} ${item.name}`}
                          title={item.archived ? "Reativar" : "Arquivar"}
                          onClick={() => archive(item.id)}
                        >
                          <Archive size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty
            title="Nenhum cadastro encontrado"
            text="Crie um cadastro ou ajuste sua busca para continuar."
          />
        )}
        <div className="table-footer">
          <span>{items.length} cadastro(s)</span>
          <span>Arquivar preserva o histórico financeiro.</span>
        </div>
      </section>
      {kind === "accounts" && data.transfers.length > 0 && (
        <section className="panel upcoming" style={{ marginTop: 24 }}>
          <div
            className="panel-heading section-heading"
            style={{ paddingBottom: 18 }}
          >
            <div>
              <h2>Transferências entre contas</h2>
            </div>
          </div>
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Origem → destino</th>
                  <th className="number">Valor</th>
                  <th>Situação</th>
                  <th className="number">Ação</th>
                </tr>
              </thead>
              <tbody>
                {data.transfers
                  .slice()
                  .reverse()
                  .map((t) => (
                    <tr key={t.id}>
                      <td>{t.date.split("-").reverse().join("/")}</td>
                      <td>
                        {data.accounts.find((a) => a.id === t.from)?.name} →{" "}
                        {data.accounts.find((a) => a.id === t.to)?.name}
                      </td>
                      <td className="number">{money(t.amount)}</td>
                      <td>
                        <span className="badge neutral">
                          {t.cancelled ? "Desfeita" : "Registrada"}
                        </span>
                      </td>
                      <td className="number">
                        <button
                          className="button small"
                          disabled={busy || t.cancelled}
                          onClick={() =>
                            update(
                              (d) => ({
                                ...d,
                                transfers: d.transfers.map((x) =>
                                  x.id === t.id ? { ...x, cancelled: true } : x,
                                ),
                              }),
                              "Transferência desfeita. Saldos atualizados.",
                            )
                          }
                        >
                          Desfazer
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
      {edit && (
        <EntityEditor
          key={edit}
          kind={kind}
          id={edit}
          onClose={() => setEdit(null)}
        />
      )}
      {transfer && <TransferEditor onClose={() => setTransfer(false)} />}
      {selectedContact && (
        <Sheet
          title={selectedContact.name}
          subtitle={selectedContact.email || "Histórico financeiro do contato"}
          onClose={() => setContactId(null)}
          wide
        >
          <ContactHistory contactId={selectedContact.id} onOpen={setEntryId} />
        </Sheet>
      )}
      {entryId && <EntryDrawer id={entryId} onClose={() => setEntryId(null)} />}
    </>
  );
}
function ContactHistory({
  contactId,
  onOpen,
}: {
  contactId: string;
  onOpen: (id: string) => void;
}) {
  const { data } = useFinance(),
    [period, setPeriod] = useState(today().slice(0, 7));
  const entries = data.entries.filter(
    (e) =>
      e.contactId === contactId && (!period || e.competence.startsWith(period)),
  );
  const revenue = entries
      .filter(
        (e) =>
          !e.cancelled &&
          data.categories.find((c) => c.id === e.categoryId)?.group ===
            "revenue",
      )
      .reduce((s, e) => s + e.amount, 0),
    costs = entries
      .filter(
        (e) =>
          !e.cancelled &&
          ["direct", "deductions"].includes(
            data.categories.find((c) => c.id === e.categoryId)?.group ?? "",
          ),
      )
      .reduce((s, e) => s + e.amount, 0);
  return (
    <>
      <div className="filter-bar contact-filters">
        <label className="field">
          <span>Competência</span>
          <input
            type="month"
            aria-label="Competência do contato"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          />
        </label>
        <button className="text-button" onClick={() => setPeriod("")}>
          Todo o histórico
        </button>
      </div>
      <div className="contact-metrics">
        <div>
          <small>Receita de serviços</small>
          <strong>{money(revenue)}</strong>
        </div>
        <div>
          <small>Custos e deduções vinculados</small>
          <strong>{money(costs)}</strong>
        </div>
        <div>
          <small>Margem após custos diretos</small>
          <strong className="text-green">{money(revenue - costs)}</strong>
        </div>
        <div>
          <small>Saldo pendente a receber</small>
          <strong>
            {money(
              entries
                .filter((e) => e.direction === "income")
                .reduce((s, e) => s + pending(e), 0),
            )}
          </strong>
        </div>
      </div>
      <p className="note">
        Despesas gerais não são rateadas. Este resultado considera apenas
        receitas, deduções e custos diretamente vinculados ao contato.
      </p>
      {entries.length ? (
        <EntryTable entries={entries} onOpen={onOpen} showKind />
      ) : (
        <Empty
          title="Sem lançamentos neste recorte"
          text="Os lançamentos vinculados a este contato aparecerão aqui."
        />
      )}
    </>
  );
}
function EntityEditor({
  kind,
  id,
  onClose,
}: {
  kind: Kind;
  id: string;
  onClose: () => void;
}) {
  const { data, update, busy } = useFinance(),
    [error, setError] = useState("");
  const item = data[kind].find((x) => x.id === id),
    [direction, setDirection] = useState(
      (item as Category | undefined)?.direction ?? "expense",
    );
  const contact = item as Contact | undefined,
    account = item as Account | undefined,
    category = item as Category | undefined;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const f = new FormData(event.currentTarget),
      v = (key: string) => String(f.get(key) ?? "").trim();
    try {
      const name = v("name");
      if (!name) throw new Error("Preencha o nome.");
      if (
        data[kind].some(
          (x) =>
            x.id !== id &&
            x.name.toLocaleLowerCase("pt-BR") ===
              name.toLocaleLowerCase("pt-BR"),
        )
      )
        throw new Error("Já existe um cadastro com esse nome.");
      let next: Contact | Category | Account;
      if (kind === "contacts")
        next = {
          id: item?.id ?? uid(),
          name,
          type: v("type") as Contact["type"],
          email: v("email"),
          document: v("document"),
          archived: item?.archived,
        };
      else if (kind === "categories") {
        if (
          item &&
          data.entries.some(
            (e) => e.categoryId === id && e.direction !== direction,
          )
        )
          throw new Error(
            "Categorias utilizadas não podem mudar de receita para despesa ou vice-versa.",
          );
        next = {
          id: item?.id ?? uid(),
          name,
          direction,
          group: v("group") as Group,
          archived: item?.archived,
        };
      } else {
        const opening = parseMoney(v("opening"));
        if (!Number.isSafeInteger(opening))
          throw new Error("Informe um saldo inicial válido.");
        const openingDate = v("openingDate");
        if (!openingDate || openingDate > today())
          throw new Error("A data do saldo inicial deve ser hoje ou anterior.");
        if (
          item &&
          (data.entries.some((e) =>
            e.payments.some((p) => p.accountId === id && p.date < openingDate),
          ) ||
            data.transfers.some(
              (t) => (t.from === id || t.to === id) && t.date < openingDate,
            ))
        )
          throw new Error(
            "A data do saldo inicial deve ser anterior ou igual à primeira movimentação da conta.",
          );
        next = {
          id: item?.id ?? uid(),
          name,
          bank: v("bank"),
          opening,
          openingDate,
          archived: item?.archived,
        };
      }
      if (
        await update(
          (d) => ({
            ...d,
            [kind]: item
              ? d[kind].map((x) => (x.id === id ? next : x))
              : [...d[kind], next],
          }),
          "Cadastro salvo.",
        )
      )
        onClose();
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <Sheet
      title={`${item ? "Editar" : "Novo"} ${kind === "contacts" ? "contato" : kind === "accounts" ? "cadastro de conta" : "cadastro de categoria"}`}
      onClose={onClose}
    >
      <form onSubmit={submit}>
        <div className="form-grid">
          <Field label="Nome" full>
            <input
              name="name"
              required
              autoFocus
              maxLength={120}
              defaultValue={item?.name}
            />
          </Field>
          {kind === "contacts" ? (
            <>
              <Field label="Tipo" full>
                <select name="type" defaultValue={contact?.type ?? "client"}>
                  <option value="client">Cliente</option>
                  <option value="supplier">Fornecedor</option>
                  <option value="both">Cliente e fornecedor</option>
                </select>
              </Field>
              <Field label="E-mail (opcional)" full>
                <input
                  type="email"
                  name="email"
                  defaultValue={contact?.email}
                />
              </Field>
              <Field label="CPF / CNPJ (opcional)" full>
                <input
                  name="document"
                  maxLength={25}
                  defaultValue={contact?.document}
                />
              </Field>
            </>
          ) : kind === "accounts" ? (
            <>
              <Field label="Instituição" full>
                <input
                  name="bank"
                  defaultValue={account?.bank}
                  placeholder="Ex.: Nubank"
                />
              </Field>
              <Field label="Saldo inicial (R$)">
                <input
                  name="opening"
                  required
                  inputMode="decimal"
                  defaultValue={
                    account
                      ? (account.opening / 100).toFixed(2).replace(".", ",")
                      : "0,00"
                  }
                />
              </Field>
              <Field label="Data do saldo inicial">
                <input
                  name="openingDate"
                  required
                  type="date"
                  max={today()}
                  defaultValue={account?.openingDate ?? today()}
                />
              </Field>
              <p className="field-note full">
                Use o saldo imediatamente anterior aos lançamentos que serão
                registrados a partir desta data. Ele não entra como receita na
                DRE.
              </p>
            </>
          ) : (
            <>
              <Field label="Tipo de lançamento" full>
                <select
                  value={direction}
                  onChange={(e) =>
                    setDirection(e.target.value as typeof direction)
                  }
                >
                  <option value="income">Receita</option>
                  <option value="expense">Despesa</option>
                </select>
              </Field>
              <Field label="Grupo da DRE" full>
                <select
                  key={direction}
                  name="group"
                  defaultValue={
                    category?.direction === direction
                      ? category.group
                      : direction === "income"
                        ? "revenue"
                        : "operating"
                  }
                >
                  {Object.entries(groupNames)
                    .filter(([g]) =>
                      direction === "income"
                        ? ["revenue", "financialIncome", "excluded"].includes(g)
                        : !["revenue", "financialIncome"].includes(g),
                    )
                    .map(([g, label]) => (
                      <option key={g} value={g}>
                        {label}
                      </option>
                    ))}
                </select>
              </Field>
              <p className="field-note full">
                Use “Fora da DRE” para aportes, distribuição de lucros e outras
                movimentações que não representam resultado operacional.
              </p>
            </>
          )}
        </div>
        <FormError text={error} />
        <div className="form-footer">
          <button type="button" className="button" onClick={onClose}>
            Cancelar
          </button>
          <button className="button primary" disabled={busy}>
            Salvar cadastro
          </button>
        </div>
      </form>
    </Sheet>
  );
}
function TransferEditor({ onClose }: { onClose: () => void }) {
  const { data, update, busy } = useFinance(),
    [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const f = new FormData(event.currentTarget),
      from = String(f.get("from")),
      to = String(f.get("to")),
      amount = parseMoney(String(f.get("amount"))),
      date = String(f.get("date"));
    try {
      validateTransfer(amount, from, to, date, data.accounts);
      if (
        await update(
          (d) => ({
            ...d,
            transfers: [
              ...d.transfers,
              {
                id: uid(),
                from,
                to,
                amount,
                date,
                notes: "",
              },
            ],
          }),
          "Transferência registrada.",
        )
      )
        onClose();
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <Sheet
      title="Registrar transferência"
      subtitle="Registro entre suas contas. O app não movimenta dinheiro no banco."
      onClose={onClose}
    >
      <form onSubmit={submit}>
        <div className="form-grid">
          <Field label="Conta de origem">
            <select name="from">
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
              name="to"
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
          <Field label="Valor (R$)">
            <input
              name="amount"
              inputMode="decimal"
              required
              placeholder="0,00"
            />
          </Field>
          <Field label="Data de competência">
            <input
              name="date"
              type="date"
              required
              max={today()}
              defaultValue={today()}
            />
          </Field>
        </div>
        <FormError text={error} />
        <div className="form-footer">
          <button type="button" className="button" onClick={onClose}>
            Cancelar
          </button>
          <button
            className="button primary"
            disabled={
              busy || data.accounts.filter((a) => !a.archived).length < 2
            }
          >
            Registrar transferência
          </button>
        </div>
      </form>
    </Sheet>
  );
}
