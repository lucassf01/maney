const { chromium } = require("@playwright/test");
const fs = require("node:fs");
(async () => {
  const dir = ".impeccable/review";
  fs.mkdirSync(dir, { recursive: true });
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    locale: "pt-BR",
    timezoneId: "America/Sao_Paulo",
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  const captures = [
    ["", "desktop"],
    ["pagar", "payables"],
    ["receber", "receivables"],
    ["fluxo-de-caixa", "cash-flow"],
    ["dre", "dre"],
    ["contatos", "contacts"],
    ["contas", "accounts"],
    ["categorias", "categories"],
    ["configuracoes", "settings"],
  ];
  for (const [route, name] of captures) {
    await page.goto(`http://127.0.0.1:3000/${route}`);
    await page.getByRole("heading", { level: 1 }).waitFor();
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: `${dir}/${name}.png`, fullPage: true });
  }
  await page.goto("http://127.0.0.1:3000/");
  await page
    .getByRole("heading", { level: 1, name: "Visão geral", exact: true })
    .waitFor();
  await page
    .getByRole("button", { name: "Recolher barra lateral", exact: true })
    .click();
  await page.screenshot({
    path: `${dir}/desktop-collapsed.png`,
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Expandir barra lateral", exact: true })
    .click();
  await page.setViewportSize({ width: 1875, height: 905 });
  await page.screenshot({ path: `${dir}/user-1875.png`, fullPage: true });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("http://127.0.0.1:3000/configuracoes");
  await page.getByRole("heading", { level: 1 }).waitFor();
  await page
    .getByRole("button", { name: "Dados e importação", exact: true })
    .click();
  await page.screenshot({ path: `${dir}/settings-data.png`, fullPage: true });
  await page.goto("http://127.0.0.1:3000/receber");
  await page.getByRole("button", { name: "Nova receita", exact: true }).click();
  await page.screenshot({ path: `${dir}/drawer.png`, fullPage: true });
  await page
    .getByRole("button", { name: "Fechar painel", exact: true })
    .click();
  await page.setViewportSize({ width: 390, height: 844 });
  for (const [route, name] of [
    ["", "mobile"],
    ["receber", "mobile-receivables"],
    ["dre", "mobile-dre"],
    ["configuracoes", "mobile-settings"],
  ]) {
    await page.goto(`http://127.0.0.1:3000/${route}`);
    await page.getByRole("heading", { level: 1 }).waitFor();
    await page.screenshot({ path: `${dir}/${name}.png`, fullPage: true });
    console.log(
      name,
      await page.evaluate(() => ({
        viewport: innerWidth,
        page: document.documentElement.scrollWidth,
      })),
    );
  }
  await page.goto("http://127.0.0.1:3000/receber");
  await page.getByRole("button", { name: "Nova receita", exact: true }).click();
  await page.screenshot({ path: `${dir}/mobile-drawer.png`, fullPage: false });
  await page.getByRole("dialog").evaluate((e) => {
    e.scrollTop = e.scrollHeight;
  });
  await page.screenshot({
    path: `${dir}/mobile-drawer-bottom.png`,
    fullPage: false,
  });
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", { name: "Abrir navegação", exact: true })
    .click();
  await page.screenshot({
    path: `${dir}/mobile-navigation.png`,
    fullPage: false,
  });
  await page
    .getByRole("button", { name: "Fechar navegação", exact: true })
    .click();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("http://127.0.0.1:3000/");
  await page
    .getByRole("heading", { level: 1, name: "Visão geral", exact: true })
    .waitFor();
  await page
    .getByRole("button", { name: "Selecionar período", exact: true })
    .click();
  await page
    .getByRole("dialog", { name: "Selecionar período", exact: true })
    .waitFor();
  await page.screenshot({ path: `${dir}/date-filter.png`, fullPage: false });
  const periodMonth = (
    await page.getByLabel("Data inicial", { exact: true }).inputValue()
  ).slice(0, 7);
  await page
    .getByLabel("Data inicial", { exact: true })
    .fill(`${periodMonth}-10`);
  await page
    .getByLabel("Data final", { exact: true })
    .fill(`${periodMonth}-20`);
  await page
    .getByRole("button", { name: "Aplicar período", exact: true })
    .click();
  await page.screenshot({ path: `${dir}/custom-period.png`, fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .getByRole("button", { name: "Selecionar período", exact: true })
    .click();
  await page.screenshot({
    path: `${dir}/date-filter-mobile.png`,
    fullPage: false,
  });
  await browser.close();
  console.log("Capturas concluídas em " + dir);
})();
