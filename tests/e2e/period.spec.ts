import { test, expect, type Page } from "@playwright/test";
import { addDays, today } from "../../src/lib/finance";
import { upcomingDateLabel } from "../../src/lib/period";

async function createCategory(page: Page) {
  await page.goto("/categorias");
  await page
    .getByRole("button", { name: "Nova categoria", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Nome", { exact: true }).fill("Despesa de período");
  await dialog
    .getByLabel("Tipo de lançamento", { exact: true })
    .selectOption("expense");
  await dialog
    .getByRole("button", { name: "Salvar cadastro", exact: true })
    .click();
}

async function createAccount(page: Page) {
  await page.goto("/contas");
  await page.getByRole("button", { name: "Nova conta", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Nome", { exact: true }).fill("Conta do período");
  await dialog.getByLabel("Instituição", { exact: true }).fill("Teste");
  await dialog.getByLabel("Saldo inicial (R$)", { exact: true }).fill("0,00");
  await dialog
    .getByLabel("Data do saldo inicial", { exact: true })
    .fill("2025-01-01");
  await dialog
    .getByRole("button", { name: "Salvar cadastro", exact: true })
    .click();
}

async function selectPeriod(page: Page, start: string, end: string) {
  await page
    .getByRole("button", { name: "Selecionar período", exact: true })
    .click();
  const filter = page.getByRole("dialog", {
    name: "Selecionar período",
    exact: true,
  });
  await filter.getByLabel("Data inicial", { exact: true }).fill(start);
  await filter.getByLabel("Data final", { exact: true }).fill(end);
  await filter
    .getByRole("button", { name: "Aplicar período", exact: true })
    .click();
  await expect(filter).not.toBeVisible();
}

test("Contas vencidas aparecem na lista e o período personalizado acompanha a navegação", async ({
  page,
}) => {
  await createCategory(page);
  await createAccount(page);
  const past = addDays(today(), -40);
  await page.goto("/pagar");
  await page
    .getByRole("button", { name: "Novo lançamento", exact: true })
    .click();
  const entry = page.getByRole("dialog", {
    name: "Novo lançamento",
    exact: true,
  });
  await entry
    .getByLabel("Descrição", { exact: true })
    .fill("Despesa vencida de teste");
  await entry.getByLabel("Valor total (R$)", { exact: true }).fill("321,00");
  await entry
    .getByLabel("Categoria", { exact: true })
    .selectOption({ label: "Despesa de período" });
  await entry
    .getByLabel("Conta financeira", { exact: true })
    .selectOption({ label: "Conta do período" });
  await entry.getByLabel("Data de competência", { exact: true }).fill(past);
  await entry.getByLabel("Vencimento", { exact: true }).fill(past);
  await entry
    .getByRole("button", { name: "Criar lançamento", exact: true })
    .click();
  await expect(entry).not.toBeVisible();
  await page
    .locator("#desktop-sidebar")
    .getByRole("button", { name: "Visão geral", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { level: 1, name: "Visão geral", exact: true }),
  ).toBeVisible();
  await expect(
    page
      .getByRole("region", { name: "Próximas a pagar", exact: true })
      .getByText("Despesa vencida de teste", { exact: true }),
  ).toBeVisible();
  await selectPeriod(page, past, past);
  const upcoming = page.getByRole("region", {
    name: "Próximas a pagar",
    exact: true,
  });
  const row = upcoming
    .locator(".upcoming-account")
    .filter({ hasText: "Despesa vencida de teste" });
  await expect(row).toBeVisible();
  await expect(row.getByText("Atrasado", { exact: true })).toBeVisible();
  await expect(
    row.getByText(upcomingDateLabel(past), { exact: true }),
  ).toBeVisible();
  await expect(page.locator(".overdue-panel")).toHaveCount(0);
  const metric = page.getByRole("button", { name: /A pagar no período/ });
  await expect(metric.locator("strong")).toHaveText("R$ 321,00");
  await page
    .getByRole("button", { name: "Conferir atrasos", exact: true })
    .click();
  await expect(row).toBeVisible();
  await page.getByRole("button", { name: "Ver próximos", exact: true }).click();
  await metric.click();
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Contas a pagar",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Despesa vencida de teste", exact: true }),
  ).toBeVisible();
  await page
    .locator("#desktop-sidebar")
    .getByRole("button", { name: "DRE gerencial", exact: true })
    .click();
  await expect(page.locator(".custom-period-tab")).toHaveText("Personalizado");
  await expect(page.locator(".dre-table thead th")).toHaveCount(3);
});

test("Filtro rejeita intervalo invertido e funciona no celular; sidebar aceita teclado", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .locator("#desktop-sidebar")
    .getByRole("button", { name: "Visão geral", exact: true })
    .focus();
  await page.keyboard.press("ArrowDown");
  await expect(
    page
      .locator("#desktop-sidebar")
      .getByRole("button", { name: "Contas a pagar", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("heading", { name: "Contas a pagar", exact: true }),
  ).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .getByRole("button", { name: "Selecionar período", exact: true })
    .click();
  const filter = page.getByRole("dialog", {
    name: "Selecionar período",
    exact: true,
  });
  const bounds = await filter.boundingBox();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(390);
  await filter.getByLabel("Data inicial", { exact: true }).fill("2026-11-20");
  await filter.getByLabel("Data final", { exact: true }).fill("2026-11-10");
  await filter
    .getByRole("button", { name: "Aplicar período", exact: true })
    .click();
  await expect(filter.getByRole("alert")).toContainText("data final");
  await filter.getByRole("button", { name: "Este mês", exact: true }).click();
  await filter
    .getByRole("button", { name: "Aplicar período", exact: true })
    .click();
  await expect(filter).not.toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
