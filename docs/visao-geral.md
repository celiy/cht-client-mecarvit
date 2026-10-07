# Visão geral

O `cht-client-mecarvit` é o frontend do sistema Mecarvit: um sistema de gestão para oficinas mecânicas. Ele **não é um app Vue completo**. É um conjunto de páginas, componentes e módulos que o [`cht-base`](https://github.com/celiy/cht-base) carrega (pelo alias `@client`) e executa, junto com o [`cht-design-system`](https://github.com/celiy/cht-design-system) e o [`cht-shared`](https://github.com/celiy/cht-shared). A API é o [`cht-backend-mecarvit`](https://github.com/celiy/cht-backend-mecarvit).

Esta documentação cobre só o que existe **neste repositório**. As funções do base, do design system e do shared são citadas por nome, sem explicar o código delas.

## O que o sistema faz

Uma oficina (empresa) cadastra funcionários, clientes, veículos e serviços; abre **ordens de serviço** (OS) e orçamentos; registra pagamentos; e acompanha o financeiro e um painel de gestão. O acesso de cada funcionário é limitado pelo cargo.

## Como o código se organiza

| Pasta ou arquivo | Papel |
| --- | --- |
| `cht.config.ts` | Identidade do cliente para o runner do workspace: nome, URLs da API, backend, publicação. |
| `src/App.vue` | Raiz da interface: tela de arranque do desktop, `RouterView`, toasts. |
| `src/bootstrap.ts` | Guarda de navegação, carregamento da sessão e aviso em tempo real. Ver [bootstrap e sessão](./bootstrap-e-sessao.md). |
| `src/routes.ts` | Todas as rotas. Ver [rotas e navegação](./rotas-e-navegacao.md). |
| `src/layouts/MainLayout.vue` | Moldura das telas logadas. Ver [layout principal](./layout-principal.md). |
| `src/pages/` | Uma página por tela. Ver o [índice de páginas](./README.md#páginas). |
| `src/components/` | Componentes próprios do cliente. Ver o [índice de componentes](./README.md#componentes). |
| `src/js/` | Módulos de apoio (sessão, HTTP, campos de formulário, PDF…). Ver o [índice de módulos](./README.md#módulos). |
| `src/css/style.css`, `src/theme.config.json` | Estilo e tema. Ver [estilo e tema](./estilo-e-tema.md). |
| `src/types/vue-globals.d.ts` | Tipos das propriedades globais (`$mecarvit`, `$http`, …). |

## Padrões que se repetem

- **Telas de cadastro iguais.** Funcionários, clientes, veículos, OS e entradas/saídas montam a mesma estrutura: [`CrudListPage`](./componentes/lista-crud.md) (título, filtros, tabela, paginação, exclusão) mais [`ItemViewEdit`](./componentes/visualizar-editar-item.md) (modal para ver, editar e criar).
- **Listas no servidor.** Filtros, ordenação e paginação vão na query string; o servidor responde `{ data, page, limit, total }`. Ver [módulo de HTTP](./modulos/crud-http.md).
- **Permissões por chave.** Cada botão, coluna e rota depende de uma chave do cargo (`clientes.criar`, `os.pagamentos`…). Ver [permissões](./permissoes.md).
- **Erros por campo.** Quando o servidor devolve `fields`, a mensagem aparece no campo certo do formulário e um toast mostra o resumo.
- **`?cadastrar=true`.** Abrir uma lista com esse parâmetro já abre o modal de cadastro; o menu "Cadastrar" usa isso.
- **Tempo real.** A sessão conecta um WebSocket para avisar o superadmin quando alguém cadastra algo.

## Executar

No workspace `cht-main`:

```bash
npx chtmain dev --client:mecarvit
npx chtmain build mecarvit
```

O backend sobe junto (`backend` em `cht.config.ts`). A URL da API pode vir do `.env` do cliente (`CHT_API_DEV`, `CHT_API_WEB`, `CHT_API_ELECTRON`, `CHT_API_MOBILE`); sem ele usa `http://127.0.0.1:3001`.

## Verificações

Há dois checks ao lado do código, em `src/js/`:

- `sortTableRows.check.ts` (tradução da ordenação). Roda direto: `node --import tsx src/js/sortTableRows.check.ts`.
- `exportOsPdf.check.ts` (o PDF da OS é gerado e tem cabeçalho válido). Importa módulos pelo alias `@shared`, então precisa de um runner que resolva os aliases do projeto; com `node --import tsx` puro ele não encontra o pacote.

## Observações

- `src/pages/index.vue` é uma tela do template do base ("Cliente mecarvit carregado pelo cht-base"). Nenhuma rota a usa; a rota `/` redireciona para `/home`.
- `src/components/DevToolsExample.vue` só existe para demonstrar o menu de debug do modo dev.
