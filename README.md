# maney

Financeiro enxuto para uma pequena empresa de marketing e desenvolvimento. Interface em português, baseada nas fundações do [Geist](https://vercel.com/geist/introduction), com fontes Geist locais, React, TypeScript e Next.js App Router.

## Rodar localmente

Requer Node.js 20.9+ e pnpm. Dependências fixadas em `pnpm-lock.yaml`.

```sh
pnpm install
pnpm dev
```

Acesse http://127.0.0.1:3000. A primeira visita abre um workspace vazio. O servidor escuta apenas no computador local.

```sh
pnpm typecheck
pnpm test
pnpm build
pnpm exec playwright test
```

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

Os dados são armazenados em **IndexedDB neste navegador e origem**. Não é necessário configurar serviços externos para testar. Limpar os dados do site remove o armazenamento; exporte um backup em Configurações. Não há autenticação nem sincronização entre dispositivos nesta versão local. Anexos ficam dentro do backup, sujeitos à quota do navegador. O CSV é uma extração para análise, não um backup: use JSON para preservar baixas individuais e todos os metadados.

Valores são inteiros em centavos. Competência alimenta a DRE; pagamentos alimentam o caixa. Aportes, empréstimos e distribuição de lucros podem ser classificados em categorias fora da DRE. Não há cálculo tributário automático, emissão fiscal, cobrança bancária nem rateio de despesas por cliente. A DRE é gerencial e depende da classificação correta dos lançamentos.

## Supabase e Vercel

A aplicação está pronta para build na Vercel. O modo atual permanece local, inclusive se publicado: **publicação não ativa nuvem nem autenticação**.

O adaptador em `src/lib/supabase.ts` e a migração `supabase/migrations/202611120001_workspace.sql` preparam a próxima etapa. A tabela armazena um documento por usuário, com RLS e controle otimista de revisão. Para uma aplicação individual com baixo volume, isso mantém a migração do domínio simples. Autenticação, recuperação de acesso, sincronização e backup externo ainda precisam ser conectados antes de usar dados reais em nuvem.

1. Crie seu projeto Supabase e aplique a migração.
2. Copie `.env.example` para `.env.local` e configure URL e chave publicável. Nunca use uma chave de serviço no cliente.
3. Na próxima etapa, conecte autenticação e o Provider ao adaptador; mantenha o modo local isolado e valide as políticas RLS com duas contas.
4. Configure as mesmas variáveis na Vercel e os endereços de redirecionamento de autenticação.

Nenhuma conexão externa ou publicação é feita automaticamente.

Brand update: use the supplied `maney logo novo.png` and `favicon.png`. The interface uses white and neutral light-gray surfaces; lime is the only accent and is reserved for relevant actions and selection. Financial amounts and ordinary states stay neutral and retain explicit labels/icons. Existing browser database and sidebar preference identifiers are preserved for compatibility.

## Sidebar e períodos

A navegação usa o componente [ReactFrame Sidebar](https://devlibraries.com/libraries/reactframe/sidebar), obtido do [repositório oficial](https://github.com/AhmetLoca/reactframe-public), adaptado para CSS com escopo e a identidade maney. A licença MIT está em `third-party-notices/ReactFrame-LICENSE`. O registro público de instalação estava indisponível durante a implementação.

Clique no filtro de datas para escolher início/fim ou um atalho. O período acompanha a navegação; contas são filtradas pelo vencimento, fluxo realizado pela data da baixa e DRE pela competência. A semana vai de segunda a domingo. O painel inclui atrasos de meses anteriores na visão mensal e respeita os limites exatos em períodos personalizados. O lembrete permite ver somente os atrasos.
