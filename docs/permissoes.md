# Permissões na interface

O cargo do funcionário carrega uma lista de chaves (`nivelAcesso`). As regras (quais chaves existem e o que cada uma libera) vivem no `cht-shared` (`@shared/mecarvit/access`) e são **as mesmas que o backend aplica**. A interface as usa para **esconder** o que o usuário não pode fazer; quem decide é sempre a API.

## Funções de consulta (`src/js/mecarvit.ts`)

Todas olham o cargo do usuário logado:

| Função | Verdadeiro quando |
| --- | --- |
| `currentHasPermission(chave)` | O cargo tem a chave (superadmin sempre tem). |
| `currentCanCreate(area)` | Tem `<area>.criar`. |
| `currentCanExport(area)` | Tem `<area>.exportar`. |
| `currentCanDelete(area)` | Tem `<area>.excluir`. |
| `currentCanSeePii("clientes" \| "funcionarios")` | Tem `<area>.pii` (ver CPF/CNPJ e celular completos). |
| `currentIsSuperadmin()` | É o fundador ou tem o cargo superadmin. |
| `currentIsGerente()` | Tem a chave `gerente` ou é superadmin. |
| `currentCanManageProfile()`, `currentCanManageCargos()` | Hoje equivalem a `currentIsGerente()`. |

## O que cada permissão muda na tela

| Permissão | Efeito |
| --- | --- |
| `<área>.editar` | A área aparece no menu. |
| `<área>.criar` | Mostra o botão **Cadastrar** (e o link do menu). |
| `<área>.exportar` | Mostra o botão de exportar a tabela em PDF. |
| `<área>.excluir` | A ação **Excluir** aparece no menu da linha. |
| `clientes.pii`, `funcionarios.pii` | Documento e celular aparecem completos. Sem ela, a coluna de documento (CPF, no caso dos funcionários) some da tabela, e o CPF do funcionário some do formulário de edição. Em PDFs, CPF e documento saem mascarados. |
| `financeiro.editar` / `financeiro.criar` | Na tela de OS, mostra o prazo de pagamento, o modal de pagamentos e a ação **Pagamentos** da linha. |
| `os.pagamentos` | Exigida pelo **backend** para gravar pagamentos pela OS e para devolvê-los na resposta. |
| `gerente` | Dashboard, mudança de status da OS, diagnóstico do cliente, gestão de cargos e edição do próprio perfil. |
| `superadmin` | Logs do sistema, redefinição de senha de funcionários e o aviso de cadastros em tempo real. |

Os detalhes de cada tela estão nas páginas de [funcionários](./paginas/funcionarios.md), [clientes](./paginas/clientes.md), [veículos](./paginas/veiculos.md), [ordens de serviço](./paginas/ordens-de-servico.md) e [entradas e saídas](./paginas/entradas-e-saidas.md).

## Dois filtros extras

- `excludeSuperadminCargos(lista)` tira os cargos de superadmin das listas de escolha (esse cargo não se atribui).
- `excludeCurrentUsuario(lista)` tira o próprio usuário das listas de escolha (por exemplo, de responsáveis da OS).

## Superadmin e fundador

`isUsuarioSuperadmin` considera superadmin quem é **fundador** ou tem a chave `superadmin`. A tela de funcionários não deixa editar nem excluir esses usuários.
