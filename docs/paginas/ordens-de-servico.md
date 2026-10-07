# Ordens de serviço

**Arquivo:** `src/pages/ordem-servico/ordem-servico.vue` · **Rota:** `/ordem-servico` · **Componente:** a página da OS · **API:** `/api/ordem-servico`, `/api/status-os`, `/api/cliente`, `/api/veiculo`, `/api/usuario`, `/api/servico`

Centro do sistema. Lista, cria, edita e acompanha as ordens de serviço (OS) e os orçamentos. Aparece no menu para quem tem `os.editar`. O formulário em si é o [`OrdemServicoForm`](../componentes/formulario-de-os.md), dentro de um modal.

## Tabela

| Coluna | Observação |
| --- | --- |
| OS | Número (`#id`). |
| Cliente | Nome. |
| Veículo | Modelo e placa. |
| Status | Selo colorido, na cor do status ([`osStatusBadge`](../modulos/status-e-pagamentos.md)). |
| Pagamento | Selo: Pago, A vencer, Não pago ou Atrasado. Orçamentos mostram um traço. O selo traz como dica a data de pagamento. |

Todas as colunas ordenam.

**Filtros:** Cliente (busca externa, padrão), Veículo (busca externa), Status, Status de pagamento (Todos, Pago, Não pago, A vencer, Atrasado) e, para quem vê pagamentos, **Data pagamento**.

## Ações da linha

| Ação | Quem vê |
| --- | --- |
| Visualizar | Todos |
| Editar | Todos |
| Pagamentos | Quem tem `financeiro.editar` ou `financeiro.criar` |
| Alterar status (submenu) | Gerentes. Só aparecem os status **permitidos** a partir do atual (ver abaixo). |
| Excluir | Quem tem `os.excluir` |

Botões do topo: **Cadastrar** e **Fazer orçamento** (só com `os.criar`), e exportar PDF (`os.exportar`).

## Status e transições

A tela usa `osStatus` do `cht-shared` para decidir o que a OS pode virar. Em resumo: um orçamento vira aberta, pendente, em andamento ou cancelada; aberta e pendente avançam ou cancelam; em andamento pode voltar a pendente, concluir ou cancelar; concluída só pode ser **reaberta**; reaberta só volta a concluída; cancelada não muda mais. A volta para **orçamento** só é possível sem pagamentos lançados.

- **Alterar status pela linha** manda `PATCH /api/ordem-servico/{id}` com `statusOsId` e recarrega a lista. Transição proibida mostra o motivo em toast, sem chamar a API.
- **Pelo formulário**, o gerente também escolhe o status.
- O backend só confere que o status existe; quem aplica as transições é esta tela.

## Modal da OS

Abre em três modos: **cadastro**, **visualização** e **edição**. Um botão alterna entre ver e editar (para quem pode editar). O rodapé tem:

- **Exportar esta OS para PDF** (`os.exportar`): gera o formulário impresso ([exportação em PDF](../modulos/exportacao-pdf.md)).
- Alternância ver/editar e os botões Salvar e Cancelar.
- No formulário, o botão de **pagamentos** abre o [modal de pagamentos](../componentes/modal-de-pagamentos.md). Em visualização ou em OS **cancelada**, ele abre somente leitura.

### Cadastro e orçamento

**Cadastrar** abre o modal com o status inicial padrão; **Fazer orçamento** abre com o status **orçamento** (e a data de início do dia). Um orçamento não recebe pagamentos. No cadastro, os pagamentos lançados no modal vão junto no `POST`.

### O que muda conforme as permissões

| Situação | Efeito no formulário |
| --- | --- |
| Tem `os.editar` mas não `os.criar` (caso do mecânico) | **Edição restrita**: o cliente e o veículo ficam travados; só o diagnóstico do mecânico, a observação e os itens são editáveis. Envia um `PATCH` só com esses campos. |
| Não é gerente | Não edita o diagnóstico do cliente (só na criação) nem o status. |
| Sem `clientes.pii` | CPF e celular do cliente não aparecem. |
| Sem permissão de financeiro | Sem prazo de pagamento nem pagamentos. |
| `funcionarios.editar` | Pode atribuir **responsáveis** (o próprio usuário é omitido da lista). |
| `clientes.criar` / `veiculos.criar` | Pode cadastrar o cliente ou o veículo direto no formulário da OS. |
| `clientes.editar` / `veiculos.editar` | Pode ajustar o celular do cliente e os dados do veículo (modelo, quilometragem, tipo) pela OS. |

### Salvar

1. Resolve o **cliente**: o selecionado, ou cria um novo se foi informado um documento (CPF) novo com o nome. Sincroniza o celular se mudou.
2. Resolve o **veículo**: o selecionado, ou cria um novo a partir de modelo e placa. Em edição, atualiza os dados que mudaram.
3. Monta o corpo (`clienteDocumento`, `veiculoId`, `statusOsId`, diagnósticos, observação, prazo de pagamento, `itens`, `responsaveis`) e envia `POST` (cadastro) ou `PUT` (edição).
4. Erros por campo voltam ao formulário.

## Abrir uma OS por link

`/ordem-servico?os={id}` abre a OS **em visualização** assim que a página carrega e remove o parâmetro da URL. É o que o painel e a tela de entradas e saídas usam para levar até uma OS.

## Pagamentos

A ação **Pagamentos** da linha abre o modal com os pagamentos da OS, já com o valor total (soma dos itens). Ao salvar, envia `PUT /api/ordem-servico/{id}` só com `pagamentos` e recarrega a lista. O servidor mantém o lançamento financeiro da OS sincronizado ([como no backend](https://github.com/celiy/cht-backend-mecarvit/blob/main/docs/entidades/ordens-de-servico.md#registro-financeiro-gerado-syncfinanceiro)).
