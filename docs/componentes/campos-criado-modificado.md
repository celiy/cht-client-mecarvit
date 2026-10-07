# Criado e modificado (`CriadoModificadoFields`)

**Arquivo:** `src/components/CriadoModificadoFields.vue`

Dois campos de leitura, **Criado em** e **Modificado em**, dentro de um `Item` secundário do design system. Mostram as datas do registro formatadas em português (`formatDateTimeBr`, do `cht-shared`).

| Prop | Padrão | Função |
| --- | --- | --- |
| `criadoEm`, `modificadoEm` | vazio | Data (texto, número ou `Date`). |
| `idPrefix` | `audit` | Prefixo dos ids dos campos, para não repetir ids quando há mais de um na página. |

Aparece no [modal de ver e editar](./visualizar-editar-item.md) em visualização e no [formulário da OS](./formulario-de-os.md) em visualização e edição restrita.
