# Funcionários

**Arquivo:** `src/pages/cadastros/funcionarios.vue` · **Rota:** `/funcionarios` · **Componente:** `MecarvitFuncionariosPage` · **API:** `/api/usuario` e `/api/cargo`

Cadastro dos funcionários da oficina e dos cargos que definem o que cada um pode fazer. Usa a [lista CRUD](../componentes/lista-crud.md) e o [modal de ver e editar](../componentes/visualizar-editar-item.md). Aparece no menu para quem tem `funcionarios.editar`.

## Tabela

| Coluna | Observação |
| --- | --- |
| Nome | |
| Cargo | Ordena pelo nome do cargo. |
| CPF | Só para quem tem `funcionarios.pii`. Aparece mascarado, com um botão para revelar. |

**Filtros:** Nome (padrão), Status (ativo ou inativo; por padrão só ativos) e CPF.

**Ações da linha:** Visualizar, Editar e, para quem tem `funcionarios.excluir`, Excluir. O botão **Cadastrar** exige `funcionarios.criar`; o de exportar PDF, `funcionarios.exportar`.

## Formulário do funcionário

| Campo | Regra |
| --- | --- |
| Nome | Obrigatório. |
| Email | Obrigatório. |
| CPF | Obrigatório ao cadastrar; depois fica somente leitura. Só aparece na edição para quem vê dados pessoais. |
| Senha | Só no cadastro (mínimo de 8 caracteres). O funcionário será obrigado a trocá-la no primeiro acesso. |
| Cargo | Lista de cargos (sem o de superadmin), com busca. O ícone ao lado cadastra um cargo novo ou, se um cargo já está escolhido, edita-o (só quem gerencia cargos). |
| Ativo | Só na edição. Desativar é a "exclusão" lógica. |

Para o superadmin e o fundador, o cargo aparece como texto e **não se pode editar nem excluir**: a tela avisa "Não é permitido editar este usuário".

### Excluir

Não apaga: a ação envia `ativo: false` e mostra "Funcionário desativado.".

### Resetar senha

Na edição, **somente o superadmin** vê o botão **Resetar senha**. Ele pede confirmação, troca o campo para **Nova senha** e, ao salvar, envia `senha` junto com `senhaInicial: true`. O funcionário terá de trocar a senha no próximo acesso.

## Cargos

O botão **Gerenciar cargos** (só para gerentes) abre uma lista de cargos com a ação **Editar** e um botão **Cadastrar**. O formulário do cargo tem:

| Campo | Efeito |
| --- | --- |
| Nome | Obrigatório. |
| Áreas do sistema | Para cada área (Funcionários, Clientes, Veículos, Ordens de serviço, Registros financeiros), um nível: Nenhum, Visualização, Edição/cadastro, Exportação ou Remoção. Cada nível inclui os anteriores. |
| Cargo de gerente | Marca o cargo como gerente: libera tudo, inclusive dados pessoais e gestão do sistema, e trava o campo de áreas. |

Regras que a tela aplica ao escolher os níveis:

- Em Funcionários, um cargo que não é gerente só pode ter **Nenhum** ou **Visualização** (quem edita funcionários precisa ser gerente).
- Um cargo com acesso a **Ordens de serviço** precisa continuar enxergando funcionários, clientes, veículos e financeiro. Ao dar esse acesso, a tela liga **Visualização** nessas áreas e **desabilita** a opção "Nenhum" (e a de reduzir abaixo de Visualização) nelas, porque a OS exibe dados dessas áreas.

O corpo enviado é `nome` e `nivelAcesso` (lista de chaves), convertido por funções do `cht-shared`. Os detalhes de quem pode criar cargos estão em [cargos no backend](https://github.com/celiy/cht-backend-mecarvit/blob/main/docs/entidades/cargos.md).
