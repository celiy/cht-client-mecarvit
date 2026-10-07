# Listas e HTTP (`crudHttp.ts` e `sortTableRows.ts`)

**Arquivos:** `src/js/crudHttp.ts` e `src/js/sortTableRows.ts`

Helpers de tipos e funções que todas as telas de cadastro usam. Envolvem o `$http` do `cht-base`; não fazem requisições sozinhos.

## Tipos

| Tipo | Uso |
| --- | --- |
| `ListResponse<T>` | Resposta de lista: `{ data, page?, limit?, total? }`. |
| `ItemResponse<T>` | Resposta de um item: `{ data }`. |
| `DialogMode` | `view`, `edit` ou `create`. |
| `HttpFieldErrorsExpose`, `ItemViewEditExpose`, `CrudListPageExpose` | Contratos do que as páginas esperam do [`ItemViewEdit`](../componentes/visualizar-editar-item.md) e da [`CrudListPage`](../componentes/lista-crud.md) quando falam com eles via `ref`. |

## Ações da linha

`CRUD_ROW_ACTIONS` (Visualizar, Editar, separador, Excluir) é o padrão da lista. `CRUD_ROW_ACTIONS_WITH_PAGAMENTO` acrescenta **Pagamentos**. As páginas filtram **Excluir** quando o usuário não tem a permissão.

## Erros

- `fieldErrorsFromHttp(erro)`: extrai os `fields` (mensagem por campo) de um `HttpError`.
- `notifyHttpError(toast, erro, mensagemPadrão, formulário?)`: se o erro é HTTP, mostra no toast a primeira mensagem de campo ou a mensagem da API e, se recebeu o formulário, aplica os erros nos campos; caso contrário, mostra a mensagem padrão.

## Listas

| Função | O que faz |
| --- | --- |
| `listQuery(filtros, página, limite, ordenação?)` | Junta filtros já serializados com `page`, `limit` e `sort`. |
| `fetchAllList(get, caminho, filtros, ordenação?)` | Busca **todas** as linhas que casam com os filtros, ignorando o tamanho de página: primeiro pergunta o `total` e depois pede tudo de uma vez. Usada na exportação para PDF. |
| `pageCountFromTotal(total, limite, padrão)` | Quantidade de páginas. |
| `isCadastrarQuery(valor)` | Reconhece `?cadastrar=true` / `1`. |
| `withSelectedItem(lista, selecionado, chave)` | Garante que o item selecionado aparece na lista de opções mesmo se a busca atual não o retornou. |
| `ATIVO_FILTER_OPTIONS` | Opções "Ativo" (padrão) e "Inativo" do filtro de status. |

## Formatação

`formatMoneyBrl(valor)` formata em reais (traço se inválido) e `documentDigits(valor)` deixa só os dígitos de um documento.

## Ordenação

`toSortQuery({ field, direction })` traduz o clique no cabeçalho da tabela para o `sort` da API:

- A tabela do design system emite `desc` no primeiro clique; a API trata `-campo` como decrescente. Por isso a direção é **invertida**: `desc` vira `campo` e `asc` vira `-campo`.
- Apelidos de coluna: `valorLabel` → `valor` e `idLabel` → `id`. Os demais campos passam como vêm (o backend registra aliases próprios como `clienteNome` e `statusBadge`).
- Sem coluna, devolve texto vazio.

Há um check executável em `sortTableRows.check.ts`.
