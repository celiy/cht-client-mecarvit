# Modal de pagamentos (`PagamentosModal`)

**Arquivo:** `src/components/PagamentosModal.vue`

Modal pequeno, intitulado "Pagamentos", que embrulha o [editor de pagamentos](./editor-de-pagamentos.md). Usado nas páginas de [OS](../paginas/ordens-de-servico.md), [entradas e saídas](../paginas/entradas-e-saidas.md) e [clientes](../paginas/clientes.md) (neste caso, só leitura).

## Comportamento

- Ao abrir, copia os `rows` recebidos para um rascunho; o que o usuário faz no editor fica no rascunho até **Salvar**.
- **Salvar** emite `save` com a lista pronta para a API (`pagamentosPayload()` do editor). Quem recebe decide para onde enviar.
- **Cancelar** (ou fechar o modal) emite `cancel` e descarta o rascunho.
- Em `readonly` mostra só **Fechar**.

## Props e eventos

| Prop | Função |
| --- | --- |
| `isOpen` | Abre e fecha (`update:isOpen`). |
| `rows` | Pagamentos atuais. |
| `valorTotal` | Valor do lançamento. |
| `saving` | Desabilita os botões durante o salvamento. |
| `readonly` | Somente leitura. |

Eventos: `update:isOpen`, `save(pagamentos)`, `cancel`.
