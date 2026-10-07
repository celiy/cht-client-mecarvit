# Documentação do cliente Mecarvit

Tudo aqui descreve **este repositório**: o frontend do Mecarvit. O que pertence ao `cht-base`, ao `cht-design-system` ou ao `cht-shared` é só mencionado. Comece pela [visão geral](./visao-geral.md).

## Fundamentos

| Página | Assunto |
| --- | --- |
| [Visão geral](./visao-geral.md) | O que é o cliente, como o código se organiza e os padrões que se repetem. |
| [Bootstrap e sessão](./bootstrap-e-sessao.md) | `cht.config.ts`, `App.vue`, guarda de rotas e ciclo da sessão. |
| [Rotas e navegação](./rotas-e-navegacao.md) | Mapa de rotas e menu lateral. |
| [Layout principal](./layout-principal.md) | Moldura das telas logadas e menu do usuário. |
| [Permissões](./permissoes.md) | Como o cargo muda a interface. |
| [Estilo e tema](./estilo-e-tema.md) | Tailwind, tema padrão e cores de status. |

## Páginas

| Página | Rota |
| --- | --- |
| [Login](./paginas/login.md) | `/login` |
| [Cadastro da oficina](./paginas/cadastro-da-oficina.md) | `/register` |
| [Trocar senha](./paginas/trocar-senha.md) | `/trocar-senha` |
| [Painel inicial](./paginas/painel-inicial.md) | `/home` |
| [Perfil](./paginas/perfil.md) | `/usuario` |
| [Logs do sistema](./paginas/logs-do-sistema.md) | `/logs` |
| [Funcionários](./paginas/funcionarios.md) | `/funcionarios` |
| [Clientes](./paginas/clientes.md) | `/clientes` |
| [Veículos](./paginas/veiculos.md) | `/veiculos` |
| [Ordens de serviço](./paginas/ordens-de-servico.md) | `/ordem-servico` |
| [Entradas e saídas](./paginas/entradas-e-saidas.md) | `/registro-entrada-saida` |

## Componentes

| Componente | Função |
| --- | --- |
| [Lista CRUD](./componentes/lista-crud.md) (`CrudListPage`) | Estrutura das telas de lista. |
| [Filtros](./componentes/filtros.md) (`FilterInputs`) | Barra de filtros. |
| [Ver, editar e criar](./componentes/visualizar-editar-item.md) (`ItemViewEdit`) | Modal de registro. |
| [Formulário da OS](./componentes/formulario-de-os.md) (`OrdemServicoForm`) | Formulário da ordem de serviço. |
| [Itens da OS](./componentes/itens-da-os.md) (`OrdemServicoItensSection`) | Tabela de serviços da OS. |
| [Editor de pagamentos](./componentes/editor-de-pagamentos.md) (`PagamentosEditor`) | Lista e formulário de pagamentos. |
| [Modal de pagamentos](./componentes/modal-de-pagamentos.md) (`PagamentosModal`) | Modal que embrulha o editor. |
| [Formulário de troca de senha](./componentes/formulario-trocar-senha.md) (`ChangePasswordForm`) | Troca de senha. |
| [Criado e modificado](./componentes/campos-criado-modificado.md) (`CriadoModificadoFields`) | Datas do registro. |
| [Mensagem de tabela vazia](./componentes/mensagem-de-tabela-vazia.md) (`EmptyTableMessage`) | Estado sem resultados. |
| [Exemplo do menu de debug](./componentes/exemplo-devtools.md) (`DevToolsExample`) | Demonstração do modo dev. |

## Módulos

| Módulo | Arquivos em `src/js/` |
| --- | --- |
| [Sessão](./modulos/sessao.md) | `mecarvit.ts`, `auth.ts` |
| [Listas e HTTP](./modulos/crud-http.md) | `crudHttp.ts`, `sortTableRows.ts` |
| [Campos de formulário](./modulos/campos-de-formulario.md) | `entityFields.ts` |
| [Mapeamento da OS](./modulos/mapeamento-de-os.md) | `ordemServicoFormMap.ts` |
| [Status e pagamentos](./modulos/status-e-pagamentos.md) | `osStatusBadge.ts`, `pagamentoOptions.ts` |
| [Apoio às tabelas](./modulos/tabelas.md) | `formatTableLabel.ts`, `sensitiveTableCell.ts`, `enderecoLabel.ts` |
| [Apoio ao painel](./modulos/painel.md) | `dashboard.ts` |
| [Exportação em PDF](./modulos/exportacao-pdf.md) | `exportTablePdf.ts`, `exportOsPdf.ts` |

A navegação lateral (`sidebarNav.ts`) está em [rotas e navegação](./rotas-e-navegacao.md#menu-lateral-srcjssidebarnavts).
