# Logs do sistema

**Arquivo:** `src/pages/logs.vue` · **Rota:** `/logs` (só superadmin; carregada sob demanda) · **Componente:** `AuditLogsPage`

Consulta o histórico de quem criou, alterou e excluiu registros. Aberta pelo menu do usuário (opção **Logs do sistema**, visível só ao superadmin). Os dados vêm de `GET /api/audit-logs` ([documentação no backend](https://github.com/celiy/cht-backend-mecarvit/blob/main/docs/entidades/logs-de-auditoria.md)).

Usa a [`CrudListPage`](../componentes/lista-crud.md) sem botão de cadastro e sem exportação.

## Tabela

| Coluna | Conteúdo |
| --- | --- |
| Data | Momento da ação, em `pt-BR`. |
| Autor | Nome, e-mail ou id do autor; `Sistema` quando não há usuário. |
| Ação | Criar, Editar ou Excluir. |
| Entidade | Cliente, Funcionário, Cargo, Veículo, Serviço ou Ordem de serviço. |
| ID | Identificador do registro afetado. |
| Resultado | Sucesso ou Falha. |

Todas as colunas ordenam (traduzidas por [`toSortQuery`](../modulos/crud-http.md#ordenação)).

## Filtros

Ação, entidade, autor, período (**De** e **Até**) e **Conteúdo do log** (busca de texto em toda a entrada). Todos aparecem de início. Sem datas, a API usa os últimos 30 dias.

## Detalhe

A ação **Visualizar** abre um modal com uma alternância **Simples** / **Avançado**:

- **Simples**: o resumo da entrada (autor, ação, entidade, id e resultado), o IP e a requisição (método e caminho) quando existem, e a lista de **Alterações** campo a campo.
- **Avançado**: os estados completos **Antes** e **Depois**, formatados como JSON.

Valores sensíveis (senhas, tokens) já chegam como `[redacted]`.
