import { expect, test } from "@playwright/test";

test.use({ storageState: { cookies: [], origins: [] } });

test("Painel e perfil exigem uma sessão validada, inclusive depois de sair", async ({
  page,
}) => {
  await page.goto("/pagar");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading")).toHaveCount(0);

  const email = page.getByLabel("E-mail", { exact: true });
  const password = page.getByLabel("Senha", { exact: true });
  const submit = page.getByRole("button", { name: "Entrar", exact: true });
  await email.fill("invalid@example.invalid");
  await password.fill("senha-invalida-de-teste");
  await submit.click();
  await expect(page.getByText("E-mail ou senha incorretos.")).toBeVisible();

  const accountEmail = process.env.MANEY_E2E_EMAIL!;
  await email.fill(accountEmail);
  await password.fill(process.env.MANEY_E2E_PASSWORD!);
  await submit.click();
  await expect(
    page.getByRole("heading", { name: "Visão geral" }),
  ).toBeVisible();

  await page.goto("/perfil");
  await expect(
    page.getByRole("main").getByText(accountEmail).first(),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Perfil", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Sair do Maney" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goto("/perfil");
  await expect(page).toHaveURL(/\/login$/);
});
