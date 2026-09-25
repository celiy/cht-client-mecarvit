import { formatDateBr, formatDateTimeBr } from "@shared/format/dateTime";
import { parseMoneyInput } from "@shared/format/moneyInput";
import type { OrdemServicoFormValues } from "../components/OrdemServicoForm.vue";
import type { OrdemServicoItemFormRow } from "../components/OrdemServicoItensSection.vue";
import { formatMoneyBrl } from "./crudHttp";
import { downloadTablesPdf, type PdfTable } from "./exportTablePdf";
import { pagamentoLabel, type PagamentoFormRow } from "./pagamentoOptions";

export type ExportOsPdfInput = {
    values: OrdemServicoFormValues;
    statusLabel: string;
    responsaveisLabels: string[];
    pagamentos: PagamentoFormRow[];
    includeClientePii: boolean;
    includePagamentos: boolean;
};

function moneyFromDigits(value: string): string {
    const amount = parseMoneyInput(value);

    return amount == null ? "—" : formatMoneyBrl(amount);
}

function detailRows(pairs: Array<[string, string]>): Array<Record<string, unknown>> {
    return pairs
        .filter(([, value]) => value.trim() !== "")
        .map(([campo, valor]) => ({ campo, valor }));
}

/**
 * Builds a printable PDF for one OS (header fields + itens + optional pagamentos).
 */
export function downloadOsPdf(input: ExportOsPdfInput): void {
    const { values } = input;
    const idLabel = values.id != null ? `OS #${values.id}` : "Ordem de serviço";
    const clienteNome = values.clienteNome.trim() || "—";
    const documento = values.clienteDocumento.trim();
    const veiculo = [values.veiculoModelo, values.veiculoPlaca].filter(Boolean).join(" · ") || "—";
    const itens = values.itens ?? [];
    const total = itens.reduce((sum, item) => {
        const qty = Number(item.quantidade) || 0;
        const valor = parseMoneyInput(item.valor) ?? 0;

        return sum + qty * valor;
    }, 0);

    const dadosPairs: Array<[string, string]> = [
        ["OS", idLabel],
        ["Status", input.statusLabel || "—"],
        ["Cliente", clienteNome]
    ];

    if (input.includeClientePii && documento) {
        dadosPairs.push(["Documento", documento]);
    }

    if (input.includeClientePii && values.clienteCel.trim()) {
        dadosPairs.push(["Celular", values.clienteCel.trim()]);
    }

    dadosPairs.push(
        ["Veículo", veiculo],
        ["Km", values.veiculoKilometragem.trim() || "—"],
        ["Data início", values.dataInicio ? formatDateBr(values.dataInicio) : "—"],
        ["Data conclusão", values.dataConclusao ? formatDateBr(values.dataConclusao) : "—"]
    );

    if (input.includePagamentos) {
        dadosPairs.push([
            "Limite pagamento",
            values.dataLimitePagamento ? formatDateBr(values.dataLimitePagamento) : "—"
        ]);
    }

    if (input.responsaveisLabels.length > 0) {
        dadosPairs.push(["Responsáveis", input.responsaveisLabels.join(", ")]);
    }

    if (values.diagnosticoCliente.trim()) {
        dadosPairs.push(["Diagnóstico cliente", values.diagnosticoCliente.trim()]);
    }

    if (values.diagnosticoMecanico.trim()) {
        dadosPairs.push(["Diagnóstico mecânico", values.diagnosticoMecanico.trim()]);
    }

    if (values.obs.trim()) {
        dadosPairs.push(["Observações", values.obs.trim()]);
    }

    if (values.criadoEm) {
        dadosPairs.push(["Criado em", formatDateTimeBr(values.criadoEm)]);
    }

    if (values.modificadoEm) {
        dadosPairs.push(["Modificado em", formatDateTimeBr(values.modificadoEm)]);
    }

    dadosPairs.push(["Total itens", formatMoneyBrl(total)]);

    const tables: PdfTable[] = [
        {
            title: "Dados",
            headers: [
                { label: "Campo", field: "campo" },
                { label: "Valor", field: "valor" }
            ],
            rows: detailRows(dadosPairs)
        },
        {
            title: "Itens",
            headers: [
                { label: "Serviço", field: "servico" },
                { label: "Qtd", field: "quantidade" },
                { label: "Valor", field: "valor" },
                { label: "Subtotal", field: "subtotal" }
            ],
            rows: itens.map((item: OrdemServicoItemFormRow) => {
                const qty = Number(item.quantidade) || 0;
                const valor = parseMoneyInput(item.valor) ?? 0;

                return {
                    servico: item.servicoNome?.trim() || "—",
                    quantidade: String(item.quantidade || "—"),
                    valor: moneyFromDigits(item.valor),
                    subtotal: formatMoneyBrl(qty * valor)
                };
            })
        }
    ];

    if (input.includePagamentos) {
        tables.push({
            title: "Pagamentos",
            headers: [
                { label: "Tipo", field: "tipo" },
                { label: "Valor", field: "valor" }
            ],
            rows: (input.pagamentos ?? []).map((row) => ({
                tipo: pagamentoLabel(row.tipo),
                valor: moneyFromDigits(row.valor)
            }))
        });
    }

    downloadTablesPdf(idLabel, tables);
}
