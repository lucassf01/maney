"use client";
import { useRef, useState, type FormEvent } from "react";
import {
  ArrowDownToLine,
  Check,
  CircleAlert,
  CircleCheck,
  Database,
  FileSpreadsheet,
  HardDrive,
  RotateCcw,
  ShieldCheck,
  Upload,
} from "lucide-react";
import { type FinanceData, money, validateData } from "@/lib/finance";
import {
  csvColumns,
  exportCsv,
  exportEntries,
  parseCsv,
  previewImport,
} from "@/lib/csv";
import {
  blingImportSources,
  createBlingImportMapping,
  isBlingReceivableCsv,
  previewBlingImport,
  type BlingImportMapping,
} from "@/lib/bling-import";
import { backup, previousBackup } from "@/lib/storage";
import { useFinance } from "./provider";
import { Field, FormError, PageHead } from "./ui";

export function Settings() {
  const { data, update, busy, notify } = useFinance(),
    [tab, setTab] = useState("general"),
    [rows, setRows] = useState<string[][] | null>(null),
    [mapping, setMapping] = useState<Record<string, number>>({}),
    [filename, setFilename] = useState(""),
    [error, setError] = useState(""),
    [importFormat, setImportFormat] = useState<"maney" | "bling">("maney"),
    [blingImportMapping, setBlingImportMapping] = useState<BlingImportMapping>({
      contacts: {},
      categories: {},
      accounts: {},
    }),
    [restore, setRestore] = useState<FinanceData | null>(null);
  const csvInput = useRef<HTMLInputElement>(null),
    backupInput = useRef<HTMLInputElement>(null);
  const preview =
    rows && importFormat === "maney"
      ? previewImport(rows, mapping, data)
      : null;
  const importSources =
      rows && importFormat === "bling" ? blingImportSources(rows) : null,
    blingImportPreview =
      rows && importFormat === "bling"
        ? previewBlingImport(rows, blingImportMapping, data)
        : null;
  async function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const f = new FormData(event.currentTarget);
    const lines = (key: string) =>
      Array.from(
        new Set(
          String(f.get(key))
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean),
        ),
      );
    await update(
      (d) => ({
        ...d,
        settings: {
          company: String(f.get("company")).trim(),
          services: lines("services"),
          projects: d.settings.projects,
        },
      }),
      "Preferências salvas.",
    );
  }
  async function readCsv(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setError("");
    try {
      if (file.size > 5 * 1024 * 1024)
        throw new Error("Use um CSV de até 5 MB.");
      const parsed = parseCsv(await file.text());
      if (parsed.length < 2)
        throw new Error(
          "O arquivo precisa de cabeçalho e pelo menos um lançamento.",
        );
      if (parsed.length > 10001)
        throw new Error("Importe até 10 mil lançamentos por arquivo.");
      const normalized = parsed[0].map((s) =>
        s
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .trim()
          .toLowerCase()
          .replaceAll(" ", "_"),
      );
      const m: Record<string, number> = {};
      csvColumns.forEach((c) => (m[c] = normalized.indexOf(c)));
      const format = isBlingReceivableCsv(parsed[0]) ? "bling" : "maney";
      setRows(parsed);
      setImportFormat(format);
      setMapping(m);
      if (format === "bling")
        setBlingImportMapping(
          createBlingImportMapping(data, blingImportSources(parsed)),
        );
      setFilename(file.name);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  async function readBackup(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setError("");
    try {
      if (file.size > 50 * 1024 * 1024)
        throw new Error("O limite para restauração é 50 MB.");
      const value: unknown = JSON.parse(await file.text());
      validateData(value);
      setRestore(value);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <>
      <PageHead title="Configurações" />
      <div className="tabs page-tabs">
        <button
          className={tab === "general" ? "active" : ""}
          onClick={() => setTab("general")}
        >
          Geral
        </button>
        <button
          className={tab === "data" ? "active" : ""}
          onClick={() => setTab("data")}
        >
          Dados e importação
        </button>
      </div>
      {tab === "general" ? (
        <div className="settings-layout">
          <form onSubmit={saveSettings} className="panel settings-panel">
            <div className="panel-heading">
              <h2>Seu negócio</h2>
            </div>
            <div className="settings-fields">
              <Field label="Nome da empresa">
                <input
                  name="company"
                  required
                  defaultValue={data.settings.company}
                  maxLength={100}
                />
              </Field>
              <div className="form-grid">
                <Field label="Moeda">
                  <input value="Real brasileiro · BRL" readOnly />
                </Field>
                <Field label="Fuso horário">
                  <input value="São Paulo · America/Sao_Paulo" readOnly />
                </Field>
              </div>
              <Field
                label="Tipos de serviço"
                hint="Um por linha. Os nomes existentes nos lançamentos são preservados."
              >
                <textarea
                  rows={4}
                  name="services"
                  defaultValue={data.settings.services.join("\n")}
                />
              </Field>
            </div>
            <div className="settings-footer">
              <button className="button primary" disabled={busy}>
                <Check size={15} />
                Salvar preferências
              </button>
            </div>
          </form>
          <aside className="settings-aside">
            <div className="section-heading">
              <HardDrive size={19} />
              <span className="badge neutral">Versão local</span>
            </div>
            <h3>Seu financeiro neste navegador</h3>
            <p>
              Esta versão salva as alterações no armazenamento local do
              navegador.
            </p>
            <p>
              Os dados permanecem ao recarregar a página, mas não são
              sincronizados entre dispositivos. Exporte um backup para guardar
              uma cópia fora do navegador.
            </p>
            <div className="aside-divider" />
            <ShieldCheck size={19} />
            <h3>Acesso à conta</h3>
            <p>Seu e-mail e sua senha são validados pelo Supabase.</p>
          </aside>
        </div>
      ) : (
        <div className="data-settings">
          <section className="panel settings-panel">
            <div className="panel-heading section-heading">
              <div>
                <h2>Exportação e backup</h2>
              </div>
              <Database size={19} className="muted" />
            </div>
            <div className="settings-fields">
              <div className="setting-action">
                <div>
                  <h3>Backup completo</h3>
                  <p>
                    Inclui cadastros, lançamentos, baixas, recorrências, anexos
                    e histórico.
                  </p>
                </div>
                <button className="button" onClick={() => backup(data)}>
                  <ArrowDownToLine size={15} />
                  Baixar backup
                </button>
              </div>
              <div className="setting-action">
                <div>
                  <h3>Planilha de lançamentos</h3>
                  <p>
                    CSV para análise. Para preservar baixas individuais e
                    anexos, use o backup completo.
                  </p>
                </div>
                <button className="button" onClick={() => exportEntries(data)}>
                  <FileSpreadsheet size={15} />
                  Exportar CSV
                </button>
              </div>
              <div className="setting-action">
                <div>
                  <h3>Cópia automática anterior</h3>
                  <p>
                    Uma versão local anterior é guardada a cada gravação
                    bem-sucedida.
                  </p>
                </div>
                <button
                  className="button"
                  onClick={async () => {
                    const previous = await previousBackup();
                    if (previous) backup(previous);
                    else notify("Ainda não existe uma cópia anterior.");
                  }}
                >
                  <RotateCcw size={15} />
                  Baixar cópia anterior
                </button>
              </div>
            </div>
          </section>
          <section className="panel settings-panel">
            <div className="panel-heading">
              <h2>Importar lançamentos</h2>
            </div>
            <div className="settings-fields">
              <p className="muted">
                O Maney detecta automaticamente o CSV de contas a receber
                exportado pelo Bling e abre uma etapa de correspondências. Para
                outros CSVs, use o mapeamento de colunas abaixo.
              </p>
              <div className="inline-actions">
                <button
                  className="button"
                  onClick={() => csvInput.current?.click()}
                >
                  <Upload size={15} />
                  Selecionar CSV
                </button>
                <button
                  className="text-button"
                  onClick={() =>
                    exportCsv("maney-modelo.csv", [
                      Array.from(csvColumns),
                      [
                        "receber",
                        "Exemplo de mensalidade",
                        "1500,00",
                        "2026-11-01",
                        "2026-11-15",
                        "Marketing digital",
                        "Estúdio Aurora",
                        "Nubank PJ",
                        "Marketing",
                        "Marketing mensal",
                        "",
                        "0",
                        "",
                      ],
                    ])
                  }
                >
                  Baixar modelo
                </button>
              </div>
              <input
                type="file"
                accept=".csv,text/csv"
                ref={csvInput}
                hidden
                onChange={readCsv}
              />
              {rows &&
                importFormat === "bling" &&
                importSources &&
                blingImportPreview && (
                  <>
                    <div className="import-file">
                      <FileSpreadsheet size={18} />
                      <strong>{filename}</strong>
                      <span>{rows.length - 1} linha(s) do Bling</span>
                    </div>
                    <div className="bling-import-intro">
                      <strong>Contas a receber pagas</strong>
                      <span>
                        O total do arquivo é convertido em receitas recebidas. A
                        competência usa a data de vencimento.
                      </span>
                    </div>
                    <div className="import-summary">
                      <strong>
                        {blingImportPreview.entries.length} lançamento(s)
                        válido(s)
                      </strong>
                      <span>
                        {blingImportPreview.duplicates} duplicado(s) ignorado(s)
                      </span>
                      <span>Total: {money(blingImportPreview.total)}</span>
                    </div>
                    <div className="bling-mapping-section">
                      <div className="bling-mapping-heading">
                        <h3>Clientes</h3>
                        <span>Correspondência com contatos do Maney</span>
                      </div>
                      <div className="mapping-grid">
                        {importSources.contacts.map((source) => (
                          <Field key={source} label={source}>
                            <select
                              value={blingImportMapping.contacts[source] ?? ""}
                              onChange={(event) =>
                                setBlingImportMapping((current) => ({
                                  ...current,
                                  contacts: {
                                    ...current.contacts,
                                    [source]: event.target.value,
                                  },
                                }))
                              }
                            >
                              <option value="">Selecione um contato</option>
                              {data.contacts
                                .filter((contact) => !contact.archived)
                                .map((contact) => (
                                  <option key={contact.id} value={contact.id}>
                                    {contact.name}
                                  </option>
                                ))}
                            </select>
                          </Field>
                        ))}
                      </div>
                    </div>
                    <div className="bling-mapping-section">
                      <div className="bling-mapping-heading">
                        <h3>Categorias</h3>
                        <span>Somente categorias de receita</span>
                      </div>
                      <div className="mapping-grid">
                        {importSources.categories.map((source) => (
                          <Field key={source} label={source}>
                            <select
                              value={
                                blingImportMapping.categories[source] ?? ""
                              }
                              onChange={(event) =>
                                setBlingImportMapping((current) => ({
                                  ...current,
                                  categories: {
                                    ...current.categories,
                                    [source]: event.target.value,
                                  },
                                }))
                              }
                            >
                              <option value="">Selecione uma categoria</option>
                              {data.categories
                                .filter(
                                  (category) =>
                                    category.direction === "income" &&
                                    !category.archived,
                                )
                                .map((category) => (
                                  <option key={category.id} value={category.id}>
                                    {category.name}
                                  </option>
                                ))}
                            </select>
                          </Field>
                        ))}
                      </div>
                    </div>
                    <div className="bling-mapping-section">
                      <div className="bling-mapping-heading">
                        <h3>Contas financeiras</h3>
                        <span>Correspondência com as contas do Maney</span>
                      </div>
                      <div className="mapping-grid">
                        {importSources.accounts.map((source) => (
                          <Field key={source} label={source}>
                            <select
                              value={blingImportMapping.accounts[source] ?? ""}
                              onChange={(event) =>
                                setBlingImportMapping((current) => ({
                                  ...current,
                                  accounts: {
                                    ...current.accounts,
                                    [source]: event.target.value,
                                  },
                                }))
                              }
                            >
                              <option value="">Selecione uma conta</option>
                              {data.accounts
                                .filter((account) => !account.archived)
                                .map((account) => (
                                  <option key={account.id} value={account.id}>
                                    {account.name}
                                  </option>
                                ))}
                            </select>
                          </Field>
                        ))}
                      </div>
                    </div>
                    {blingImportPreview.warnings.map((warning) => (
                      <div className="bling-warning" key={warning}>
                        <CircleAlert size={16} />
                        <span>{warning}</span>
                      </div>
                    ))}
                    {blingImportPreview.errors.length > 0 && (
                      <div className="import-errors" role="alert">
                        <strong>
                          Corrija as correspondências antes de importar.
                        </strong>
                        <ul>
                          {blingImportPreview.errors
                            .slice(0, 15)
                            .map((message) => (
                              <li key={message}>{message}</li>
                            ))}
                        </ul>
                        {blingImportPreview.errors.length > 15 && (
                          <p>
                            Mais {blingImportPreview.errors.length - 15}{" "}
                            problema(s) no arquivo.
                          </p>
                        )}
                      </div>
                    )}
                    <div className="inline-actions">
                      <button
                        className="button"
                        onClick={() => {
                          setRows(null);
                          setError("");
                        }}
                      >
                        Descartar prévia
                      </button>
                      <button
                        className="button primary"
                        disabled={
                          busy ||
                          !!blingImportPreview.errors.length ||
                          !blingImportPreview.entries.length
                        }
                        onClick={async () => {
                          if (
                            await update((d) => {
                              const fresh = previewBlingImport(
                                rows,
                                blingImportMapping,
                                d,
                              );
                              if (fresh.errors.length)
                                throw new Error(
                                  "Revise as correspondências do arquivo.",
                                );
                              return {
                                ...d,
                                entries: [...d.entries, ...fresh.entries],
                              };
                            }, "Importação do Bling concluída.")
                          )
                            setRows(null);
                        }}
                      >
                        Importar {blingImportPreview.entries.length}{" "}
                        lançamento(s)
                      </button>
                    </div>
                  </>
                )}
              {rows && importFormat === "maney" && (
                <>
                  <div className="import-file">
                    <FileSpreadsheet size={18} />
                    <strong>{filename}</strong>
                    <span>{rows.length - 1} linha(s)</span>
                  </div>
                  <div className="mapping-grid">
                    {csvColumns.map((c) => (
                      <Field key={c} label={c.replaceAll("_", " ")}>
                        <select
                          value={mapping[c] ?? -1}
                          onChange={(e) =>
                            setMapping((m) => ({
                              ...m,
                              [c]: Number(e.target.value),
                            }))
                          }
                        >
                          <option value={-1}>Não associada</option>
                          {rows[0].map((header, i) => (
                            <option value={i} key={i}>
                              {header}
                            </option>
                          ))}
                        </select>
                      </Field>
                    ))}
                  </div>
                  {preview && (
                    <>
                      <div className="import-summary">
                        <strong>
                          {preview.entries.length} lançamento(s) válido(s)
                        </strong>
                        <span>
                          {preview.duplicates} duplicado(s) ignorado(s)
                        </span>
                        <span>Total: {money(preview.total)}</span>
                      </div>
                      {preview.errors.length > 0 && (
                        <div className="import-errors" role="alert">
                          <strong>
                            Corrija os problemas antes de importar:
                          </strong>
                          <ul>
                            {preview.errors.slice(0, 15).map((e, i) => (
                              <li key={i}>{e}</li>
                            ))}
                          </ul>
                          {preview.errors.length > 15 && (
                            <p>
                              Mais {preview.errors.length - 15} problema(s) no
                              arquivo.
                            </p>
                          )}
                        </div>
                      )}
                      {preview.entries.length > 0 && (
                        <div className="table-scroll">
                          <table className="data-table">
                            <thead>
                              <tr>
                                <th>Prévia</th>
                                <th>Competência</th>
                                <th>Vencimento</th>
                                <th className="number">Valor</th>
                              </tr>
                            </thead>
                            <tbody>
                              {preview.entries.slice(0, 5).map((e) => (
                                <tr key={e.id}>
                                  <td>{e.description}</td>
                                  <td>{e.competence}</td>
                                  <td>{e.dueDate}</td>
                                  <td className="number">{money(e.amount)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                      <div className="inline-actions">
                        <button
                          className="button"
                          onClick={() => {
                            setRows(null);
                            setError("");
                          }}
                        >
                          Descartar prévia
                        </button>
                        <button
                          className="button primary"
                          disabled={
                            busy ||
                            !!preview.errors.length ||
                            !preview.entries.length
                          }
                          onClick={async () => {
                            if (
                              await update((d) => {
                                const fresh = previewImport(rows, mapping, d);
                                if (fresh.errors.length)
                                  throw new Error(
                                    "Revise os erros do arquivo.",
                                  );
                                return {
                                  ...d,
                                  entries: [...d.entries, ...fresh.entries],
                                };
                              }, "Importação concluída.")
                            )
                              setRows(null);
                          }}
                        >
                          Importar {preview.entries.length} lançamento(s)
                        </button>
                      </div>
                    </>
                  )}
                </>
              )}
              <FormError text={error} />
            </div>
          </section>
          <section className="panel settings-panel">
            <div className="panel-heading">
              <h2>Restaurar dados</h2>
            </div>
            <div className="settings-fields">
              <div className="inline-actions">
                <button
                  className="button"
                  onClick={() => backupInput.current?.click()}
                >
                  <Upload size={15} />
                  Selecionar backup JSON
                </button>
              </div>
              <input
                type="file"
                ref={backupInput}
                accept=".json,application/json"
                hidden
                onChange={readBackup}
              />
              {restore && (
                <div className="restore-confirm">
                  <CircleAlert size={18} />
                  <div>
                    <h3>Confirmar restauração do backup</h3>
                    <p>
                      {`${restore.entries.length} lançamento(s), ${restore.accounts.length} conta(s).`}{" "}
                      Baixe uma cópia antes de continuar.
                    </p>
                    <div className="inline-actions">
                      <button className="button" onClick={() => backup(data)}>
                        Baixar dados atuais
                      </button>
                      <button
                        className="button"
                        onClick={() => {
                          setRestore(null);
                        }}
                      >
                        Cancelar
                      </button>
                      <button
                        className="button danger"
                        disabled={busy}
                        onClick={async () => {
                          if (
                            await update(() => restore, "Dados restaurados.")
                          ) {
                            setRestore(null);
                          }
                        }}
                      >
                        Confirmar restauração
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </>
  );
}
