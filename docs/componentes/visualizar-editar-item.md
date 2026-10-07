# Ver, editar e criar (`ItemViewEdit`)

**Arquivo:** `src/components/ItemViewEdit.vue`

Modal que mostra um registro e permite editá-lo ou criá-lo. Envolve o `FormRenderer` do design system, que monta o formulário a partir da lista de campos (`FormField`, do `cht-shared`), e acrescenta o cabeçalho, os botões e os campos "Criado em / Modificado em".

## Modos

| Modo | Efeito |
| --- | --- |
| `view` | Campos somente leitura. Mostra um botão **Editar**. |
| `edit` | Campos editáveis. Mostra **Visualizar** (para voltar) e **Salvar**. |
| `create` | Formulário em branco, sem botão de alternar. |

O botão de alternar emite `update:mode`; quem decide é a página (ela guarda uma cópia do original ao entrar em edição e a restaura ao voltar para visualização). `hideModeToggle` esconde o botão.

## Props

| Prop | Função |
| --- | --- |
| `isOpen` | Controla a abertura (`update:isOpen`). |
| `header` | Título do modal. |
| `mode` | `view`, `edit` ou `create`. |
| `item` | Valores iniciais do formulário. |
| `fields` | Lista de campos. |
| `sections` | Alternativa a `fields`: grupos `{ title, fields }`, com `sectionColumns` para as colunas. |
| `saving`, `submitDisabled` | Desabilitam o botão e bloqueiam o envio. |
| `size` | `small`, `medium` ou `large`. |
| `formKey` | Mudar o valor recria o formulário (usado ao trocar de registro). |
| `hideModeToggle` | Esconde o botão de alternar. |

## Eventos

`save(valores)`, `cancel`, `update:isOpen`, `update:mode`, `update:field`, `search:external`, `click:select-action`, `click:select-option`, `click:select-remove`. Os quatro últimos repassam o que acontece nos campos de seleção (ícone de ação, clique em uma opção, remoção de uma opção, busca externa).

## Métodos expostos

A página fala com o formulário por `ref`: `applyFieldErrors(erros)` mostra erros do servidor nos campos, `setFieldValue(campo, valor)`, `getFieldValue(campo)` e `closeSelect(campo)`.

## Slots

| Slot | Uso |
| --- | --- |
| `select-inside-empty-panel` | Conteúdo dentro do painel de um campo de seleção que está sem opções (por exemplo, botões de "Cadastrar endereço"). |
| `formActions` | Substitui as ações do próprio formulário. |
| `aboveCriadoModificado`, `belowForm` | Conteúdo extra abaixo do formulário (a [página de clientes](../paginas/clientes.md) usa para listar as OS do cliente). |
| `actions` | Substitui o rodapé inteiro. Recebe `save`, `cancel`, `isView`, `toggleMode`, `showModeToggle` e `modeToggleLabel`. |

## Rodapé padrão

Em visualização: o botão de alternar (**Editar**) e **Fechar**. Em edição ou cadastro: **Salvar** (envia o formulário) e **Cancelar**.

## Auditoria visual

Em visualização, mostra [`CriadoModificadoFields`](./campos-criado-modificado.md) com as datas do registro.
