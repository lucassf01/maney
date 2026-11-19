import { chromium, type FullConfig } from "@playwright/test";
import fs from "node:fs/promises";

export default async function globalSetup(config: FullConfig) {
  const baseURL = String(
    config.projects[0]?.use.baseURL ?? "http://127.0.0.1:3000",
  );
  const email = process.env.MANEY_E2E_EMAIL;
  const password = process.env.MANEY_E2E_PASSWORD;
  if (!email || !password) {
    throw new Error(
      "Configure MANEY_E2E_EMAIL e MANEY_E2E_PASSWORD para os testes de navegador.",
    );
  }

  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({ baseURL });
    const page = await context.newPage();
    await page.goto("/perfil");
    await page.waitForURL("**/login", { timeout: 10_000 });
    await page.getByLabel("E-mail", { exact: true }).fill(email);
    await page.getByLabel("Senha", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Entrar", exact: true }).click();
    await page
      .getByRole("heading", { name: "Visão geral" })
      .waitFor({ timeout: 10_000 });
    await fs.mkdir("test-results", { recursive: true });
    await context.storageState({ path: "test-results/e2e-auth.json" });
  } finally {
    await browser.close();
  }
}
