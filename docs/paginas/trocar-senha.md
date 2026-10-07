# Trocar senha

**Arquivo:** `src/pages/changePassword.vue` · **Rota:** `/trocar-senha` (exige login) · **Componente:** `MecarvitChangePasswordPage`

Tela de passagem obrigatória: um funcionário criado por um gerente entra com uma senha inicial e é levado aqui (pelo [`completeAuth`](../modulos/sessao.md#completeauth)) antes de usar o sistema. Enquanto a senha não é trocada, o backend recusa qualquer escrita.

A página é só um cartão com o título "Trocar senha", o texto "Defina uma senha própria antes de continuar" e o [formulário de troca de senha](../componentes/formulario-trocar-senha.md). Ao concluir, vai para `/home`.
