# Perfil

**Arquivo:** `src/pages/usuario.vue` · **Rota:** `/usuario` · **Componente:** `MecarvitUsuarioPage`

"Meu perfil": mostra os dados do funcionário logado. Aberto pelo menu do usuário na [barra lateral](../layout-principal.md#menu-do-usuário).

## Campos

| Campo | Editável |
| --- | --- |
| Nome | Sim, para gerentes |
| Email | Sim, para gerentes |
| CPF | Não |
| Cargo | Não |
| Oficina | Não |

Quem não é gerente (`currentCanManageProfile`) só consulta: os botões **Salvar** e **Trocar senha** não aparecem. Isso espelha o backend, que recusa a mudança de nome, e-mail e senha para esses usuários.

## Ações

- **Salvar**: `PUT /api/usuario/{cpf}` com `nome` e `email`; depois recarrega o usuário da sessão e avisa "Perfil atualizado.". Erros por campo vão para o formulário.
- **Trocar senha**: troca o cartão pelo [formulário de troca de senha](../componentes/formulario-trocar-senha.md); ao concluir volta ao perfil e avisa "Senha alterada.".
- **Sair**: encerra a sessão e volta ao login.

Se não há usuário carregado, mostra um cartão vazio no lugar.
