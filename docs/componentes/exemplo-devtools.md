# Exemplo do menu de debug (`DevToolsExample`)

**Arquivo:** `src/components/DevToolsExample.vue`

Componente de demonstração, montado em `App.vue`. Não faz parte do sistema de oficina.

Ao ser criado, registra no menu de debug do modo dev (`registerDevToolsOptions`, do `cht-base`) a opção **Teste**, com o ícone de frasco. Clicar nela abre um modal "Teste" com um texto de exemplo e um botão **Fechar**, e mostra um toast "Teste". Ao ser destruído, retira a opção do menu.

Serve de referência de como um cliente acrescenta funções ao menu de debug. O menu só existe em desenvolvimento.
