# Lista CRUD (`CrudListPage`)

**Arquivo:** `src/components/CrudListPage.vue`

Estrutura de tela usada por todas as listas: título, botões de topo, filtros, tabela, paginação e confirmação de exclusão. As páginas de [funcionários](../paginas/funcionarios.md), [clientes](../paginas/clientes.md), [veículos](../paginas/veiculos.md), [OS](../paginas/ordens-de-servico.md), [entradas e saídas](../paginas/entradas-e-saidas.md) e [logs](../paginas/logs-do-sistema.md) a usam; cada uma só fornece os dados e reage aos eventos.

## O que renderiza

1. **Cabeçalho**: título, botão de exportar PDF (se `showExport`) e a área de ações (slot `headerActions`; por padrão o botão **Cadastrar**, se `showCreate`).
2. **Filtros**: o componente [`FilterInputs`](./filtros.md), se `showFilters`.
3. **Corpo**: o slot `body`, ou a tabela (`Table` do design system) com a paginação (`Pagination`). Sem linhas, mostra a [mensagem de tabela vazia](./mensagem-de-tabela-vazia.md).
4. Slot padrão: onde as páginas colocam seus modais.
5. **Confirmação de exclusão**: modal "Excluir" com o nome do item.

## Props

| Prop | Padrão | Função |
| --- | --- | --- |
| `title` | — (obrigatória) | Título da página. |
| `showCreate`, `showExport`, `showFilters` | `true`, `false`, `true` | Liga ou desliga o botão de cadastro, o de exportar e a barra de filtros. |
| `exporting` | `false` | Desabilita o botão de exportar durante a exportação. |
| `filters`, `filterSelectOptions`, `filterSelectSearchLoading` | vazios | Repassados ao `FilterInputs`. |
| `loading` | `false` | Estado de carregamento da tabela e dos filtros. |
| `headers` | `[]` | Colunas: `label`, `field`, `position`, `format` (máscara), `badgeProps`, `canSort`. |
| `rows` | `[]` | Linhas. |
| `actions` | `CRUD_ROW_ACTIONS` | Ações do menu da linha: lista fixa ou função da linha (usada na OS, onde as ações dependem do status). |
| `pageCount`, `paginationId`, `paginationKey` | `0`, `"pagination"`, `"all"` | Paginação. A `paginationKey` reinicia a paginação quando os filtros mudam. |
| `deleteNameField` | `"nome"` | Campo mostrado na pergunta "Excluir "X"? Esta ação não pode ser desfeita.". |
| `emptyTitle`, `emptyDescription` | Textos padrão | Mensagem quando não há registros. |

## Eventos

`create`, `close-create`, `filters`, `reload`, `page`, `action(valor, linha)`, `delete(linha)`, `search:external`, `export`, `sort`.

A ação `delete` não é repassada de imediato: abre a confirmação e só emite `delete` depois do "Excluir". Qualquer outra ação sai como `action`.

## `?cadastrar=true`

Quando a URL traz `cadastrar=true` (ou `1`) e `showCreate` está ativo, o componente remove o parâmetro e emite `create`. É o que faz o link **Cadastrar** do menu lateral abrir o modal de cadastro. `clearCadastrarQuery()` e `requestDelete(linha)` ficam disponíveis para a página pai (via `ref`).
