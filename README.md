# maney

Financeiro enxuto para uma pequena empresa de marketing e desenvolvimento. Interface em português, baseada nas fundações do [Geist](https://vercel.com/geist/introduction), com fontes Geist locais, React, TypeScript e Next.js App Router.

## Rodar localmente

Requer Node.js 20.9+ e pnpm. Dependências fixadas em `pnpm-lock.yaml`.

```sh
pnpm install
pnpm dev
```

Copie `.env.example` para `.env.local`. Em **Connect** no Supabase, obtenha a URL do projeto e a chave publicável. Configure `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` e reinicie o servidor. Acesse http://127.0.0.1:3000 e entre com uma conta cadastrada no Supabase Auth.

```sh
pnpm typecheck
pnpm test
pnpm build
```

Para rodar `pnpm exec playwright test`, mantenha o app em execução com um projeto Supabase de testes. Defina `MANEY_E2E_EMAIL` e `MANEY_E2E_PASSWORD` no ambiente do terminal com as credenciais de uma conta de teste. `MANEY_E2E_BASE_URL` permite usar outra URL do app.

## Funcionalidades

- Visão geral com indicadores coloridos, próximas contas a pagar e receber e atrasos destacados. Barra lateral recolhível com estado persistido.
- Contas a pagar e receber: cadastro, edição, duplicação, cancelamento e reabertura, filtros, paginação e categorização em lote.
- Baixas totais e parciais, com data efetiva, conta e estorno.
- Recorrências mensais e anuais com pausa, retomada e edição das ocorrências futuras. Geração até 90 dias à frente ao abrir o app ou salvar uma recorrência.
- Parcelamento com divisão exata em centavos e competência preservada.
- Anexos PDF/PNG/JPG/WebP até 2 MB, máximo de 5 por lançamento; observações e histórico.
- Fluxo de caixa realizado e projeções para 30/60/90 dias. A projeção não assume recebimento automático de contas vencidas ou com vencimento hoje.
- DRE gerencial por competência: meses, acumulado, categorias, filtros por serviço/projeto e detalhamento dos valores.
- Cadastros de contatos, categorias e contas com arquivamento; histórico por cliente e margem após custos diretos.
- Registro de transferências entre contas próprias, sem execução bancária.
- CSV com mapeamento de colunas, prévia, validação e detecção de reimportação. Não há conciliação bancária.
- Importação de exportações do Bling: detecta o layout de contas a receber pagas, ignora a linha de total, faz correspondências de clientes, categorias e contas financeiras e registra os recebimentos no Maney.
- Backup JSON completo, restauração validada e uma cópia local anterior automática.

## Persistência e limites desta versão

O Supabase autentica a conta. Os lançamentos ficam em **IndexedDB neste navegador e origem**. Para levar lançamentos entre endereços ou dispositivos, exporte e restaure um backup JSON em Configurações. O JSON inclui anexos, baixas e metadados. O CSV é uma extração para análise.

Valores são inteiros em centavos. Competência alimenta a DRE; pagamentos alimentam o caixa. Aportes, empréstimos e distribuição de lucros podem ser classificados em categorias fora da DRE. Não há cálculo tributário automático, emissão fiscal, cobrança bancária nem rateio de despesas por cliente. A DRE é gerencial e depende da classificação correta dos lançamentos.

## Supabase e Vercel

1. No Supabase, cadastre a conta em **Authentication → Users** e desative o cadastro público em um projeto de uso individual.
2. Na Vercel, configure `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` no ambiente Production. Faça um novo deploy para aplicar as variáveis.
3. Abra a URL publicada em uma janela anônima e confirme que o painel exige login.

A migração `supabase/migrations/202611120001_workspace.sql` prepara a futura sincronização dos lançamentos. O login usa somente o Supabase Auth.

Brand update: use the supplied `maney logo novo.png` and `favicon.png`. The interface uses white and neutral light-gray surfaces; lime is the only accent and is reserved for relevant actions and selection. Financial amounts and ordinary states stay neutral and retain explicit labels/icons. Existing browser database and sidebar preference identifiers are preserved for compatibility.

## Sidebar e períodos

A navegação usa o componente [ReactFrame Sidebar](https://devlibraries.com/libraries/reactframe/sidebar), obtido do [repositório oficial](https://github.com/AhmetLoca/reactframe-public), adaptado para CSS com escopo e a identidade maney. A licença MIT está em `third-party-notices/ReactFrame-LICENSE`. O registro público de instalação estava indisponível durante a implementação.

Clique no filtro de datas para escolher início/fim ou um atalho. O período acompanha a navegação; contas são filtradas pelo vencimento, fluxo realizado pela data da baixa e DRE pela competência. A semana vai de segunda a domingo. O painel inclui atrasos de meses anteriores na visão mensal e respeita os limites exatos em períodos personalizados. O lembrete permite ver somente os atrasos.
