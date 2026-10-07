# Formulário de troca de senha (`ChangePasswordForm`)

**Arquivo:** `src/components/ChangePasswordForm.vue`

Formulário com **Senha atual**, **Nova senha** e **Confirmar nova senha**. Usado na [página de trocar senha](../paginas/trocar-senha.md) (obrigatória no primeiro acesso) e no [perfil](../paginas/perfil.md).

## Fluxo

1. Ao montar, garante que o CPF do usuário está na sessão; se não está e não dá para carregar, encerra a sessão e leva ao login.
2. Ao enviar, valida com `validateChangeSenha` (do `cht-shared`) e confere se a confirmação é igual à nova senha ("As senhas não coincidem."). Se algo falha, mostra os erros e "Verifique os campos e tente novamente."
3. Envia `POST /api/usuario/{cpf}/senha` com `senhaAtual` e `senhaNova`.
4. Em caso de sucesso emite `success`. Erros da API aparecem no formulário ou nos campos `senhaAtual` e `senhaNova`.

## Props e eventos

| Prop | Função |
| --- | --- |
| `showCancelButton` | Mostra o botão **Cancelar** (usado no perfil, não na troca obrigatória). |

Eventos: `success` e `cancel`.
