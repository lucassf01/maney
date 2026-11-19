import { test, expect } from "@playwright/test";
import { today } from "../../src/lib/finance";
import fs from "node:fs/promises";

async function createCategory(
  page: import("@playwright/test").Page,
  name: string,
  direction: "income" | "expense",
) {
  await page.goto("/categorias");
  await page
    .getByRole("button", { name: "Nova categoria", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Nome", { exact: true }).fill(name);
  await dialog
    .getByLabel("Tipo de lançamento", { exact: true })
    .selectOption(direction);
  await dialog
    .getByRole("button", { name: "Salvar cadastro", exact: true })
    .click();
  await expect(page.getByRole("button", { name, exact: true })).toBeVisible();
}

async function createAccount(
  page: import("@playwright/test").Page,
  name: string,
) {
  await page.goto("/contas");
  await page.getByRole("button", { name: "Nova conta", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Nome", { exact: true }).fill(name);
  await dialog.getByLabel("Instituição", { exact: true }).fill("Teste");
  await dialog.getByLabel("Saldo inicial (R$)", { exact: true }).fill("0,00");
  await dialog
    .getByLabel("Data do saldo inicial", { exact: true })
    .fill(today());
  await dialog
    .getByRole("button", { name: "Salvar cadastro", exact: true })
    .click();
  await expect(page.getByRole("button", { name, exact: true })).toBeVisible();
}

async function createContact(
  page: import("@playwright/test").Page,
  name: string,
) {
  await page.goto("/contatos");
  await page.getByRole("button", { name: "Novo contato", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Nome", { exact: true }).fill(name);
  await dialog
    .getByRole("button", { name: "Salvar cadastro", exact: true })
    .click();
  await expect(page.getByRole("button", { name, exact: true })).toBeVisible();
}

test("Receita pode ser criada, recebida parcialmente, estornada e preservada após recarregar", async ({
  page,
}) => {
  await createCategory(page, "Receita de teste", "income");
  await createAccount(page, "Conta de teste");
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/receber");
  await page
    .getByRole("button", { name: "Novo lançamento", exact: true })
    .click();
  const drawer = page.getByRole("dialog");
  await drawer
    .getByLabel("Descrição", { exact: true })
    .fill("Projeto de teste de persistência");
  await drawer.getByLabel("Valor total (R$)", { exact: true }).fill("1.234,56");
  await drawer
    .getByLabel("Categoria", { exact: true })
    .selectOption({ label: "Receita de teste" });
  await drawer
    .getByLabel("Conta financeira", { exact: true })
    .selectOption({ label: "Conta de teste" });
  await drawer
    .getByRole("button", { name: "Criar lançamento", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page
    .getByLabel("Buscar lançamentos", { exact: true })
    .fill("Projeto de teste de persistência");
  await page
    .getByRole("button", {
      name: "Projeto de teste de persistência",
      exact: true,
    })
    .click();
  await page
    .getByRole("button", { name: "Registrar recebimento", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByLabel("Valor (R$)", { exact: true })
    .fill("200,00");
  await page
    .getByRole("button", { name: "Confirmar registro", exact: true })
    .click();
  await page.getByRole("button", { name: "Baixas (1)", exact: true }).click();
  await expect(
    page.getByRole("dialog").getByText("R$ 200,00", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Desfazer", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Baixas (0)", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Fechar painel", exact: true })
    .click();
  await page.reload();
  await page
    .getByLabel("Buscar lançamentos", { exact: true })
    .fill("Projeto de teste de persistência");
  await expect(
    page.getByRole("button", {
      name: "Projeto de teste de persistência",
      exact: true,
    }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("Todas as páginas abrem e o menu funciona no celular sem overflow de página", async ({
  page,
}) => {
  for (const [path, title] of [
    ["/", "Visão geral"],
    ["/pagar", "Contas a pagar"],
    ["/receber", "Contas a receber"],
    ["/fluxo-de-caixa", "Fluxo de caixa"],
    ["/dre", "DRE gerencial"],
    ["/contatos", "Clientes e fornecedores"],
    ["/contas", "Contas financeiras"],
    ["/categorias", "Categorias financeiras"],
    ["/configuracoes", "Configurações"],
  ]) {
    await page.goto(path);
    await expect(
      page.getByRole("heading", { level: 1, name: title, exact: true }),
    ).toBeVisible();
    await expect(page.locator(".page-head p")).toHaveCount(0);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { level: 1, name: "Visão geral", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page
    .getByRole("button", { name: "Abrir navegação", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Contas a receber", exact: true })
    .click();
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Contas a receber",
      exact: true,
    }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("Painel exibe próximos vencimentos e a barra lateral recolhida persiste", async ({
  page,
}) => {
  await page.goto("/");
  const payable = page.getByRole("region", {
    name: "Próximas a pagar",
    exact: true,
  });
  const receivable = page.getByRole("region", {
    name: "Próximas a receber",
    exact: true,
  });
  await expect(payable).toBeVisible();
  await expect(receivable).toBeVisible();
  await expect(payable.locator(".upcoming-account")).toHaveCount(0);
  await expect(receivable.locator(".upcoming-account")).toHaveCount(0);
  await expect(page.locator("main .chart")).toHaveCount(0);
  await expect(page.locator(".workspace-switch")).toHaveCount(0);
  const payableBox = await payable.boundingBox(),
    receivableBox = await receivable.boundingBox();
  expect(Math.abs(payableBox!.y - receivableBox!.y)).toBeLessThan(1);
  expect(receivableBox!.x).toBeGreaterThan(payableBox!.x);
  await page
    .getByRole("button", { name: "Recolher barra lateral", exact: true })
    .click();
  await expect(page.locator("#desktop-sidebar")).toHaveCSS("width", "88px");
  await page
    .locator("#desktop-sidebar")
    .getByRole("button", { name: "Contas a receber", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Contas a receber", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(page.locator("#desktop-sidebar")).toHaveCSS("width", "88px");
  await page
    .getByRole("button", { name: "Expandir barra lateral", exact: true })
    .click();
  await expect(page.locator("#desktop-sidebar")).toHaveCSS("width", "260px");
});

test("Recorrência, cadastro e transferência alteram o financeiro sem executar operação bancária", async ({
  page,
}) => {
  await createCategory(page, "Despesa de teste", "expense");
  await createAccount(page, "Conta de teste 1");
  await createAccount(page, "Conta de teste 2");
  await page.goto("/pagar");
  await page.getByRole("button", { name: /^Recorrências/ }).click();
  await page
    .getByRole("button", { name: "Nova recorrência", exact: true })
    .click();
  const drawer = page.getByRole("dialog");
  await expect(drawer.getByLabel("Repetições", { exact: true })).toHaveValue(
    "0",
  );
  await expect(
    drawer.getByRole("button", { name: "Definir data final", exact: true }),
  ).toBeVisible();
  await drawer.getByLabel("Repetições", { exact: true }).selectOption("3");
  await expect(drawer.locator(".recurrence-end-preview")).toBeVisible();
  await drawer.getByLabel("Repetições", { exact: true }).selectOption("0");
  await drawer
    .getByRole("button", { name: "Definir data final", exact: true })
    .click();
  await expect(drawer.getByLabel("Data final", { exact: true })).toBeVisible();
  await drawer
    .getByRole("button", { name: "Definir por repetições", exact: true })
    .click();
  await drawer
    .getByLabel("Descrição", { exact: true })
    .fill("Assinatura de teste");
  await drawer.getByLabel("Valor total (R$)", { exact: true }).fill("99,90");
  await drawer
    .getByLabel("Categoria", { exact: true })
    .selectOption({ label: "Despesa de teste" });
  await drawer
    .getByLabel("Conta financeira", { exact: true })
    .selectOption({ label: "Conta de teste 1" });
  await drawer
    .getByRole("button", { name: "Criar lançamento", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Assinatura de teste", exact: true }),
  ).toBeVisible();
  const row = page
    .locator(".recurrence-row")
    .filter({ hasText: "Assinatura de teste" });
  await row.getByRole("button", { name: "Pausar", exact: true }).click();
  await expect(
    row.getByRole("button", { name: "Retomar", exact: true }),
  ).toBeVisible();
  await row.getByRole("button", { name: "Retomar", exact: true }).click();
  await page.goto("/contatos");
  await page.getByRole("button", { name: "Novo contato", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByLabel("Nome", { exact: true })
    .fill("Cliente de teste");
  await page
    .getByRole("button", { name: "Salvar cadastro", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Cliente de teste", exact: true }),
  ).toBeVisible();
  await page.goto("/contas");
  const balances = await page.locator(".bank-balance").allTextContents();
  await page.getByRole("button", { name: "Transferir", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByLabel("Valor (R$)", { exact: true })
    .fill("100,00");
  await page
    .getByRole("button", { name: "Registrar transferência", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(await page.locator(".bank-balance").allTextContents()).not.toEqual(
    balances,
  );
});

test("CSV e backup completo preservam os dados", async ({ page }) => {
  await createCategory(page, "Marketing digital", "income");
  await createAccount(page, "Nubank PJ");
  await createContact(page, "Estúdio Aurora");
  await page.goto("/configuracoes");
  await page
    .getByRole("button", { name: "Dados e importação", exact: true })
    .click();
  const date = today();
  const csv = `tipo;descricao;valor;competencia;vencimento;categoria;contato;conta\nreceber;Importação de integração;250,00;${date};${date};Marketing digital;Estúdio Aurora;Nubank PJ`;
  await page.locator('input[accept=".csv,text/csv"]').setInputFiles({
    name: "lancamentos.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(csv),
  });
  await expect(
    page.getByText("1 lançamento(s) válido(s)", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Importar 1 lançamento(s)", exact: true })
    .click();
  await expect(
    page.getByText("Importação concluída.", { exact: true }),
  ).toBeVisible();
  await page.goto("/receber");
  await page
    .getByLabel("Buscar lançamentos", { exact: true })
    .fill("Importação de integração");
  await page
    .getByRole("button", { name: "Importação de integração", exact: true })
    .click();
  await expect(
    page.getByRole("dialog").locator("input[type=file]"),
  ).toHaveCount(0);
  await page.keyboard.press("Escape");
  await page.goto("/configuracoes");
  await page
    .getByRole("button", { name: "Dados e importação", exact: true })
    .click();
  const downloadPromise = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Baixar backup", exact: true })
    .click();
  const download = await downloadPromise;
  const saved = JSON.parse(await fs.readFile((await download.path())!, "utf8"));
  expect(
    saved.entries.find(
      (e: { description: string }) =>
        e.description === "Importação de integração",
    ).attachments,
  ).toHaveLength(0);
  saved.settings.company = "Empresa restaurada";
  await page.locator('input[accept=".json,application/json"]').setInputFiles({
    name: "backup.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(saved)),
  });
  await page
    .getByRole("button", { name: "Confirmar restauração", exact: true })
    .click();
  await expect(
    page.getByText("Dados restaurados.", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Geral", exact: true }).click();
  await expect(page.getByLabel("Nome da empresa", { exact: true })).toHaveValue(
    "Empresa restaurada",
  );
});

test("DRE mantém alinhamento de tabela e detalha apenas os grupos do subtotal", async ({
  page,
}) => {
  await page.goto("/dre");
  const row = page.locator(".dre-table tr.dre-group").first();
  await expect(row).toHaveCSS("display", "table-row");
  const subtotal = page
    .locator("tr.dre-subtotal")
    .filter({ hasText: "Receita líquida" });
  await subtotal.locator("button.report-number").first().click();
  const detail = page.getByRole("dialog", { name: /Receita líquida/ });
  await expect(detail).toBeVisible();
  await expect(
    detail.getByRole("button", { name: "Pró-labore", exact: true }),
  ).toHaveCount(0);
  await expect(
    detail.locator("button:not([aria-label='Fechar painel'])"),
  ).toHaveCount(0);
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Ano inteiro", exact: true }).click();
  await expect(page.locator(".dre-table thead th")).toHaveCount(14);
});
