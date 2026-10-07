# Veículos

**Arquivo:** `src/pages/cadastros/veiculos.vue` · **Rota:** `/veiculos` · **Componente:** `MecarvitVeiculosPage` · **API:** `/api/veiculo`, `/api/cliente`

Cadastro de veículos, cada um ligado a um cliente. É a versão mais enxuta do padrão de cadastro: [lista CRUD](../componentes/lista-crud.md) mais [modal de ver e editar](../componentes/visualizar-editar-item.md). Aparece no menu para quem tem `veiculos.editar`.

## Tabela

| Coluna | Observação |
| --- | --- |
| Modelo | |
| Placa | |
| Cliente | Nome do cliente (ordena pelo nome). |

**Filtros:** Cliente (seleção com busca externa por nome, padrão), Modelo, Placa e Status (Todos, Ativo, Inativo; o padrão é **Todos**).

**Ações da linha:** Visualizar, Editar e, com `veiculos.excluir`, Excluir. **Cadastrar** exige `veiculos.criar`; exportar PDF, `veiculos.exportar`.

## Formulário

| Campo | Regra |
| --- | --- |
| Cliente | Obrigatório. Seleção com busca por nome; carrega até 100 clientes (ativos e inativos) e busca mais enquanto o usuário digita. |
| Modelo | Obrigatório. |
| Placa | Obrigatório. |
| Tipo | Texto livre. |
| Chassi | Opcional e único. |
| Quilometragem | Número. |
| Data da troca de óleo | Data. |
| Ativo | Só na edição. |

Campos opcionais vazios: na edição viram `null` (limpam o valor); no cadastro são omitidos.

## Fluxo

1. Ao abrir, carrega a lista de clientes (para o filtro e para o formulário) e a primeira página de veículos.
2. **Visualizar** e **Editar** buscam o veículo completo (`GET /api/veiculo/{id}`) e abrem o modal. Alternar de visualização para edição guarda o estado original; voltar descarta o que foi alterado.
3. **Salvar**: `POST /api/veiculo` (cadastro) ou `PUT /api/veiculo/{id}` com `ativo`. Mostra "Veículo criado." ou "Veículo atualizado.".
4. **Excluir**: `DELETE /api/veiculo/{id}`. O backend recusa veículo ligado a uma OS (mensagem no toast); nesse caso, desative.
5. Exportar gera o PDF com **todas** as linhas que casam com os filtros e a ordenação atuais, não só a página aberta (ver [exportação em PDF](../modulos/exportacao-pdf.md)).
