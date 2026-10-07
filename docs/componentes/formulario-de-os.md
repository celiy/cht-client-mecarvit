# Formulário da OS (`OrdemServicoForm`)

**Arquivo:** `src/components/OrdemServicoForm.vue`

Formulário da ordem de serviço, usado no modal da [página de OS](../paginas/ordens-de-servico.md), no modal de leitura da OS dentro de [clientes](../paginas/clientes.md) e no de [entradas e saídas](../paginas/entradas-e-saidas.md). Diferente do `ItemViewEdit`, ele **não** usa o `FormRenderer`: monta cada campo à mão, porque cliente, veículo e itens se influenciam.

## Seções do formulário (na ordem em que aparecem)

1. **Cliente**: seleção com busca externa e digitação livre. Se o nome digitado não corresponde a um cliente, aparece **CPF do cliente** (obrigatório) para cadastrar um novo ao salvar. **Celular do cliente** aparece quando há cliente (ou nome digitado) e o usuário vê dados pessoais. Com cliente travado ou edição restrita, vira somente leitura.
2. **Funcionário(s) responsável(is)**: seleção múltipla. Fica oculta em orçamento, em edição restrita e para quem não pode atribuir responsáveis; em visualização aparece como lista.
3. **Veículo**: **Modelo** (seleção por modelo, só com os veículos do cliente; fica desabilitada até haver cliente), **Placa**, **Quilometragem** e **Tipo** (lista de tipos comuns do `cht-shared`, mas o texto é livre). Quem não pode editar veículo vê esses campos somente leitura.
4. **Status**: quem pode mudar escolhe entre os destinos permitidos a partir do status atual (`allowedOsStatusTargets`); os demais veem só o nome. Mostra também a **Data de conclusão** (somente leitura) quando existe.
5. **Diagnóstico do cliente** (editável só por quem tem permissão ou ao cadastrar) e **Diagnóstico do mecânico** (não aparece em orçamento).
6. **Serviços**: a seção de [itens](./itens-da-os.md).
7. **Totais**: **Total geral**; e, fora de orçamento e para quem vê pagamentos, **Total pago até agora**, o botão de **pagamentos** (fora da visualização) e a **Data limite de pagamento** (somente leitura em visualização ou edição restrita). No celular, o Total geral vem antes.
8. **Observações**.
9. Em visualização e em edição restrita, os campos de [criado/modificado](./campos-criado-modificado.md).

## Props que ligam e desligam partes

| Prop | Efeito |
| --- | --- |
| `mode` | `create`, `view` ou `edit`. |
| `orcamento` | Cria um orçamento (sem pagamentos). |
| `restrictedEdit` | Trava cliente e veículo; só diagnóstico do mecânico, observação e itens ficam editáveis. |
| `canChangeStatus`, `canSeeClientePii`, `canSeePagamentos`, `canEditItens`, `canCreateCliente`, `canCreateVeiculo`, `canEditVeiculo`, `canAssignResponsaveis`, `canEditDiagnosticoCliente`, `lockCliente` | Resultado das [permissões](../permissoes.md), calculadas pela página. |
| `values` | Valores do formulário (`OrdemServicoFormValues`). |
| `clienteOptions`, `veiculoOptions`, `funcionarioOptions`, `statusOptions`, `servicoSuggestions` | Listas para as seleções. |
| `*SearchLoading` | Carregamento das buscas externas. |
| `pagamentos`, `pagamentosButtonLabel` | Pagamentos exibidos e rótulo do botão (por exemplo "Ver pagamentos"). |
| `errors` | Erros por campo vindos da API. |
| `formId` | Id do `<form>`, para o botão de salvar do modal. |

## Eventos

`submit(valores)`, `search:external` (cliente, veículo ou funcionário), `search:servico` (nome parcial de serviço), `change:cliente` (trocou o cliente; a página recarrega os veículos dele) e `click:pagamentos` (abrir o modal de pagamentos).

## Métodos expostos

`applyFieldErrors`, `setFieldValue`, `getFieldValue` (usado, por exemplo, para somar os itens e abrir o modal de pagamentos com o total certo).

## Valores

`OrdemServicoFormValues` guarda tudo como texto (valores em "dígitos de dinheiro"). Os helpers `emptyOrdemServicoFormValues` (formulário em branco, com status e data de início opcionais) e `mergeOrdemServicoFormValues` (completa campos faltantes) estão no mesmo arquivo. A conversão de e para a API está em [mapeamento de OS](../modulos/mapeamento-de-os.md).
