# Exportação em PDF (`exportTablePdf.ts` e `exportOsPdf.ts`)

**Arquivos:** `src/js/exportTablePdf.ts` e `src/js/exportOsPdf.ts`

O cliente gera PDFs **sem biblioteca externa**: monta o conteúdo do arquivo diretamente (fontes padrão, texto em codificação WinAnsi) e o oferece para download.

## Tabelas (`exportTablePdf.ts`)

Usado pelo botão de exportar das listas de funcionários, clientes, veículos, OS e entradas/saídas.

- `downloadTablePdf(título, colunas, linhas)` gera um PDF com uma tabela; `downloadTablesPdf(título, tabelas)` gera um PDF com várias, cada uma com seu título (é como as entradas e saídas saem juntas).
- Página A4 **na horizontal**, margens de 36 pt. Abaixo do título vem uma linha com o nome da oficina e a data e hora da exportação. As colunas dividem a largura por igual, e o cabeçalho se repete em cada página nova. Textos longos quebram em até seis linhas por célula. Tabela sem linhas mostra "Nenhum registro encontrado.".
- No máximo **3000 linhas** por exportação.
- O nome do arquivo vem do título, sem acentos, em minúsculas e com hífens ("Entradas e saídas" vira `entradas-e-saidas.pdf`).
- As páginas exportam **todas** as linhas que casam com os filtros e a ordenação atuais, não só a página aberta ([`fetchAllList`](./crud-http.md#listas)).
- `tableCellPlainText(valor, campo)` converte uma célula em texto: selos viram o rótulo, booleanos viram "Sim" e "Não", e **CPF e documento saem mascarados**. As células com botão de revelar exportam o valor mascarado.
- Caracteres fora do WinAnsi viram `?`.

As funções de baixo nível (`beginPdfPage`, `pdfText`, `pdfRect`, `pdfLine`, `buildPdf`, `downloadPdfBytes`) são exportadas para outros PDFs; o da OS as reaproveita.

## Ordem de serviço (`exportOsPdf.ts`)

`downloadOsPdf(entrada)` imprime uma OS no estilo de um **formulário de oficina em papel**, A4 **na vertical**. `buildOsPdfBytes(entrada)` só monta os bytes, sem baixar. O arquivo sai como `os-{id}.pdf` (ou `ordem-de-servico.pdf` quando a OS ainda não tem id).

A entrada (`ExportOsPdfInput`) traz os valores do formulário, o rótulo do status, os nomes dos responsáveis, os pagamentos e duas chaves: `includeClientePii` (inclui nome do cliente e telefone completos) e `includePagamentos` (inclui a lista de pagamentos).

O que o formulário contém:

- Cabeçalho com o nome da oficina (da sessão) e o número da OS.
- Duas caixas de marcação: **AVALIAÇÃO** (orçamento) ou **ORDEM DE SERVIÇO**.
- Cliente (**Nome**, **Fone**), veículo (**Modelo**, **Placa**, **Tipo**, **Km**), **Entrada em** e **Entrega em**.
- **Diagnóstico cliente**, **Diagnóstico mecânico** e **Responsáveis**.
- A tabela **SERVIÇO A EXECUTAR** × **PREÇO**.
- O texto "Autorizo a execução dos serviços acima" e o campo de assinatura do **PROPRIETÁRIO DO VEÍCULO**.
- Os totais (**Mão de Obra**) e, se pedido, os **Pagamentos**.

O check `exportOsPdf.check.ts` gera um PDF de exemplo e confere que o arquivo começa com `%PDF-1.` e tem conteúdo. Ele importa módulos pelo alias `@shared` e, por isso, não roda com `tsx` puro.
