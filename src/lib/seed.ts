import {
  type FinanceData,
  type Entry,
  audit,
  addMonths,
  today,
} from "./finance";

export function seedData(): FinanceData {
  const now = today(),
    month = now.slice(0, 7),
    yearStart = addMonths(`${month}-01`, -5);
  const contacts: FinanceData["contacts"] = [
    {
      id: "c1",
      name: "Estúdio Aurora",
      type: "client",
      email: "financeiro@aurora.example",
      document: "",
    },
    {
      id: "c2",
      name: "Norte Tecnologia",
      type: "client",
      email: "contato@norte.example",
      document: "",
    },
    {
      id: "c3",
      name: "Casa Botânica",
      type: "client",
      email: "ola@botanica.example",
      document: "",
    },
    {
      id: "c4",
      name: "Órbita Educação",
      type: "client",
      email: "financeiro@orbita.example",
      document: "",
    },
    {
      id: "c5",
      name: "Clínica Horizonte",
      type: "client",
      email: "contato@horizonte.example",
      document: "",
    },
    {
      id: "s1",
      name: "Marina Costa · Design",
      type: "supplier",
      email: "marina@example.com",
      document: "",
    },
    {
      id: "s2",
      name: "Pedro Lima · Desenvolvimento",
      type: "supplier",
      email: "pedro@example.com",
      document: "",
    },
    {
      id: "s3",
      name: "Ferramentas e serviços",
      type: "supplier",
      email: "",
      document: "",
    },
    {
      id: "s4",
      name: "Contabilidade Ágil",
      type: "supplier",
      email: "contato@contabil.example",
      document: "",
    },
  ];
  const categories: FinanceData["categories"] = [
    {
      id: "marketing",
      name: "Marketing digital",
      direction: "income",
      group: "revenue",
    },
    {
      id: "dev",
      name: "Desenvolvimento de software",
      direction: "income",
      group: "revenue",
    },
    {
      id: "support",
      name: "Manutenção e suporte",
      direction: "income",
      group: "revenue",
    },
    {
      id: "tax",
      name: "Impostos sobre faturamento",
      direction: "expense",
      group: "deductions",
    },
    {
      id: "freelance",
      name: "Freelancers e parceiros",
      direction: "expense",
      group: "direct",
    },
    {
      id: "infra",
      name: "Infraestrutura de clientes",
      direction: "expense",
      group: "direct",
    },
    {
      id: "tools",
      name: "Software e assinaturas",
      direction: "expense",
      group: "operating",
    },
    {
      id: "accounting",
      name: "Contabilidade",
      direction: "expense",
      group: "operating",
    },
    {
      id: "prolabore",
      name: "Pró-labore",
      direction: "expense",
      group: "operating",
    },
    {
      id: "office",
      name: "Estrutura e internet",
      direction: "expense",
      group: "operating",
    },
    {
      id: "fees",
      name: "Tarifas e juros",
      direction: "expense",
      group: "financialExpense",
    },
    {
      id: "yield",
      name: "Rendimentos",
      direction: "income",
      group: "financialIncome",
    },
    {
      id: "profit",
      name: "Distribuição de lucros",
      direction: "expense",
      group: "excluded",
    },
    {
      id: "capital",
      name: "Aportes dos sócios",
      direction: "income",
      group: "excluded",
    },
  ];
  const data: FinanceData = {
    version: 1,
    settings: {
      company: "Meu negócio",
      services: ["Marketing", "Desenvolvimento", "Manutenção e suporte"],
      projects: [
        "Site institucional · Norte",
        "Plataforma · Órbita",
        "Marketing mensal",
      ],
    },
    contacts,
    categories,
    accounts: [
      {
        id: "nubank",
        name: "Nubank PJ",
        bank: "Nubank",
        opening: 1285000,
        openingDate: yearStart,
      },
      {
        id: "inter",
        name: "Inter Empresas",
        bank: "Inter",
        opening: 630000,
        openingDate: yearStart,
      },
    ],
    entries: [],
    recurrences: [],
    transfers: [],
  };
  const rows: [string, number, string, string, number, string, string][] = [
    [
      "Gestão de marketing · Aurora",
      650000,
      "marketing",
      "c1",
      5,
      "Marketing",
      "Marketing mensal",
    ],
    [
      "Marketing e conteúdo · Botânica",
      580000,
      "marketing",
      "c3",
      10,
      "Marketing",
      "Marketing mensal",
    ],
    [
      "Desenvolvimento · Norte",
      1200000,
      "dev",
      "c2",
      15,
      "Desenvolvimento",
      "Site institucional · Norte",
    ],
    [
      "Plataforma · Órbita",
      950000,
      "dev",
      "c4",
      20,
      "Desenvolvimento",
      "Plataforma · Órbita",
    ],
    [
      "Suporte e manutenção · Horizonte",
      420000,
      "support",
      "c5",
      25,
      "Manutenção e suporte",
      "",
    ],
    [
      "Design e criação · Marina",
      320000,
      "freelance",
      "s1",
      8,
      "Marketing",
      "Marketing mensal",
    ],
    [
      "Desenvolvimento parceiro · Pedro",
      480000,
      "freelance",
      "s2",
      18,
      "Desenvolvimento",
      "Plataforma · Órbita",
    ],
    ["Impostos do mês", 250000, "tax", "", 20, "", ""],
    ["Pró-labore", 700000, "prolabore", "", 5, "", ""],
    [
      "Vercel · Hospedagem",
      12500,
      "infra",
      "s3",
      12,
      "Desenvolvimento",
      "Site institucional · Norte",
    ],
    ["Figma Professional", 8500, "tools", "s3", 14, "", ""],
    ["Google Workspace", 15600, "tools", "s3", 10, "", ""],
    ["Ferramentas de marketing", 45000, "tools", "s3", 16, "", ""],
    ["Contabilidade mensal", 65000, "accounting", "s4", 10, "", ""],
    ["Internet e coworking", 98000, "office", "", 7, "", ""],
    ["Tarifas bancárias", 4500, "fees", "", 28, "", ""],
  ];
  for (let offset = -5; offset <= 2; offset++) {
    const m = addMonths(month + "-01", offset).slice(0, 7);
    rows.forEach(
      (
        [description, amount, categoryId, contactId, day, service, project],
        i,
      ) => {
        const dueDate = `${m}-${String(day).padStart(2, "0")}`,
          direction = categories.find((c) => c.id === categoryId)!.direction;
        const variation =
          offset < 0 && direction === "income" ? 1 + offset * 0.025 : 1;
        const value = Math.round(amount * variation),
          accountId = i % 3 === 0 ? "inter" : "nubank";
        const shouldPay =
          dueDate < now &&
          !(offset === 0 && categoryId === "marketing" && contactId === "c3");
        const e: Entry = {
          id: `demo:${m}:${i}`,
          description,
          direction,
          amount: value,
          competence: `${m}-01`,
          dueDate,
          categoryId,
          contactId,
          service,
          project,
          accountId,
          notes: "",
          payments: shouldPay
            ? [{ id: `pay:${m}:${i}`, amount: value, date: dueDate, accountId }]
            : [],
          attachments: [],
          history: [audit("Lançamento de demonstração criado.")],
        };
        if (offset === 0 && contactId === "c3" && now >= `${m}-09`)
          e.payments = [
            { id: "partial-demo", amount: 200000, date: `${m}-09`, accountId },
          ];
        data.entries.push(e);
      },
    );
  }
  data.recurrences.push({
    id: "rec-figma",
    direction: "expense",
    description: "Figma Professional",
    amount: 8500,
    categoryId: "tools",
    contactId: "s3",
    accountId: "nubank",
    dueDate: `${month}-14`,
    competence: `${month}-01`,
    service: "",
    project: "",
    notes: "",
    frequency: "monthly",
    endDate: "",
    paused: false,
  });
  data.entries
    .filter(
      (e) =>
        e.description === "Figma Professional" && e.dueDate >= month + "-01",
    )
    .forEach((e) => {
      e.recurrenceId = "rec-figma";
      e.id = `rec-figma:${e.dueDate}`;
    });
  return data;
}
