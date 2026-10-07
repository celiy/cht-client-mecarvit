# Clientes

**Arquivo:** `src/pages/cadastros/clientes.vue` · **Rota:** `/clientes` · **Componente:** `MecarvitClientesPage` · **API:** `/api/cliente`, `/api/endereco`, `/api/veiculo`, `/api/ordem-servico`

Cadastro de clientes. É a página mais completa do cadastro porque, dentro do cliente, também se cadastram **endereços** e **veículos** e se consultam as **ordens de serviço**. Aparece no menu para quem tem `clientes.editar`.

## Tabela

| Coluna | Observação |
| --- | --- |
| Nome | |
| Documento | CPF ou CNPJ, mascarado com botão para revelar. Só para quem tem `clientes.pii`. |
| Celular | |

**Filtros:** Nome (padrão), Status (ativo ou inativo), Documento e Celular.

**Ações da linha:** Visualizar, Editar e, com `clientes.excluir`, Excluir. **Cadastrar** exige `clientes.criar`; exportar PDF, `clientes.exportar`.

## Formulário do cliente

| Campo | Regra |
| --- | --- |
| Documento | CPF ou CNPJ. Obrigatório ao cadastrar; depois somente leitura. O tipo (CPF ou CNPJ) é reconhecido pelo tamanho. |
| Nome | Obrigatório. |
| Nome social | Só aparece (e só é enviado) quando o documento é um CNPJ. |
| Email, Celular, Observação | Opcionais. |
| Endereços | Seleção múltipla com busca por rua. O ícone **+** cadastra um endereço novo ali mesmo. |
| Veículos | Seleção múltipla. O ícone **+** cadastra um veículo novo. |
| Ativo | Só na edição (exclusão lógica). |

Campos opcionais vazios são enviados como `null` na edição (limpam) e omitidos no cadastro (ver [`entityFields`](../modulos/campos-de-formulario.md)).

## Endereços e veículos dentro do cliente

- **Endereço novo**: abre um segundo modal com CEP, estado, cidade, bairro, rua, número e complemento (o campo de CEP consulta o ViaCEP para completar o resto). Salvar cria o endereço **na hora** (`POST /api/endereco`) e o adiciona à seleção do cliente; se o endereço já existe, a tela avisa "Este endereço já estava cadastrado e foi selecionado." e seleciona o existente. Clicar em um endereço já escolhido o abre para ver ou editar (`PUT /api/endereco/{id}`). Remover o endereço da seleção só o desliga do cliente; a mudança vale ao salvar o cliente.
- **Veículo novo**: abre um modal de veículo. **Ao cadastrar um cliente** ainda não há `documento`, então o veículo fica **pendente** na tela e é enviado junto, dentro do `POST /api/cliente`, na lista `veiculos`. **Com o cliente já existente**, o veículo é criado na hora com `POST /api/veiculo`, e clicar nele permite editá-lo.
- **Atenção ao remover veículos**: tirar um veículo **já cadastrado** da seleção, com o cliente em edição, **exclui o veículo na hora** (`DELETE /api/veiculo/{id}`). Se o backend recusar (veículo com OS), o veículo volta para a seleção e a tela mostra o motivo. Veículos pendentes são só descartados da tela.
- Quando a seleção está vazia, o painel da lista oferece os botões **Cadastrar endereço** e **Cadastrar veículo**.

## Ordens de serviço do cliente

Em modo de visualização, o modal lista as OS do cliente (`GET /api/ordem-servico?cliente=…&sort=-id`, até 50), cada uma como `OS #id · status · veículo`. Clicar abre a OS num modal de leitura com o [formulário de OS](../componentes/formulario-de-os.md) e o botão **Ver pagamentos** (sem edição).

## Salvar

- **Cadastro**: `POST /api/cliente` com documento, nome, nome social (se CNPJ), e-mail, celular, observação, `enderecoIds` e os veículos pendentes escolhidos.
- **Edição**: `PUT /api/cliente/{documento}` com os campos e `enderecoIds` (a lista de endereços **substitui** a anterior). Os veículos já cadastrados são mantidos pelas próprias chamadas de veículo.

O backend recusa excluir cliente com histórico (ver [clientes no backend](https://github.com/celiy/cht-backend-mecarvit/blob/main/docs/entidades/clientes.md)); nesse caso a tela mostra a mensagem do servidor e a saída é desativar.
