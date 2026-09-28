import { formatDateBr } from "@shared/format/dateTime";
import { parseMoneyInput } from "@shared/format/moneyInput";
import type { OrdemServicoFormValues } from "../components/OrdemServicoForm.vue";
import type { OrdemServicoItemFormRow } from "../components/OrdemServicoItensSection.vue";
import { formatMoneyBrl } from "./crudHttp";
import {
    A4_PORTRAIT,
    beginPdfPage,
    buildPdf,
    downloadPdfBytes,
    pdfLine,
    pdfRect,
    pdfText,
    type PdfPageBuffer
} from "./exportTablePdf";
import { mecarvit } from "./mecarvit";
import { pagamentoLabel, type PagamentoFormRow } from "./pagamentoOptions";

export type ExportOsPdfInput = {
    values: OrdemServicoFormValues;
    statusLabel: string;
    responsaveisLabels: string[];
    pagamentos: PagamentoFormRow[];
    includeClientePii: boolean;
    includePagamentos: boolean;
};

const MARGIN = 28;
const PAGE = A4_PORTRAIT;
const INNER_PAD = 14;
const MIN_SERVICE_ROWS = 14;
const STATUS_ORCAMENTO = 6;

function moneyFromDigits(value: string): string {
    const amount = parseMoneyInput(value);

    return amount == null ? "" : formatMoneyBrl(amount);
}

function truncate(text: string, max: number): string {
    const trimmed = text.trim();

    if (trimmed.length <= max) {
        return trimmed;
    }

    return `${trimmed.slice(0, Math.max(0, max - 1))}…`;
}

function checkbox(
    page: PdfPageBuffer,
    x: number,
    y: number,
    label: string,
    checked: boolean
) {
    const size = 9;

    pdfRect(page, x, y - 1, size, size, false);

    if (checked) {
        pdfText(page, x + 1.5, y + 1, 9, "X", "F2");
    }

    pdfText(page, x + size + 6, y + 1, 10, label, "F2");
}

function fieldLine(
    page: PdfPageBuffer,
    x: number,
    y: number,
    label: string,
    value: string,
    width: number,
    labelWidth: number
) {
    pdfText(page, x, y, 9, label, "F2");
    const valueX = x + labelWidth;
    const lineY = y - 2;
    pdfLine(page, valueX, lineY, x + width, lineY, 0.35);

    if (value.trim()) {
        pdfText(page, valueX + 3, y, 9, truncate(value, Math.floor((width - labelWidth) / 4.6)));
    }
}

function totalRow(
    page: PdfPageBuffer,
    x: number,
    y: number,
    label: string,
    value: string,
    labelW: number,
    valueW: number,
    bold = false
) {
    const h = 16;

    pdfRect(page, x, y - 4, labelW, h, false);
    pdfRect(page, x + labelW, y - 4, valueW, h, false);
    pdfText(page, x + 6, y + 1, bold ? 9 : 8, label, bold ? "F2" : "F1");

    if (value) {
        pdfText(page, x + labelW + 6, y + 1, bold ? 9 : 8, value, bold ? "F2" : "F1");
    }
}

/** Builds portrait OS form PDF bytes (no download). */
export function buildOsPdfBytes(input: ExportOsPdfInput): Uint8Array {
    const { values } = input;
    const isOrcamento = Number(values.statusOsId) === STATUS_ORCAMENTO;
    const companyName = mecarvit.company?.nome?.trim() || "Oficina";
    const companyLine = [
        values.id != null ? `Nº ${values.id}` : null,
        input.statusLabel ? `Status: ${input.statusLabel}` : null
    ]
        .filter(Boolean)
        .join("  ·  ");

    const itens = values.itens ?? [];
    const total = itens.reduce((sum, item) => {
        const qty = Number(item.quantidade) || 0;
        const valor = parseMoneyInput(item.valor) ?? 0;

        return sum + qty * valor;
    }, 0);

    const pagoTotal = input.includePagamentos
        ? (input.pagamentos ?? []).reduce((sum, row) => sum + (parseMoneyInput(row.valor) ?? 0), 0)
        : 0;

    const page = beginPdfPage();
    const left = MARGIN;
    const right = PAGE.width - MARGIN;
    const width = right - left;
    let y = PAGE.height - MARGIN;

    // Outer frame
    pdfRect(page, left, MARGIN, width, PAGE.height - MARGIN * 2, false);

    const contentLeft = left + INNER_PAD;
    const contentRight = right - INNER_PAD;
    const contentWidth = contentRight - contentLeft;

    y -= INNER_PAD + 8;

    pdfText(page, contentLeft, y, 16, truncate(companyName.toUpperCase(), 42), "F2");
    y -= 16;
    pdfText(page, contentLeft, y, 9, companyLine || "Ordem de serviço");
    y -= 12;
    pdfLine(page, contentLeft, y, contentRight, y, 0);
    y -= 18;

    // Type checkboxes
    const checkY = y;
    checkbox(page, contentLeft + 40, checkY, "AVALIAÇÃO", isOrcamento);
    checkbox(page, contentLeft + 200, checkY, "ORDEM DE SERVIÇO", !isOrcamento);
    y -= 22;

    // Client / vehicle fields
    const nome = values.clienteNome.trim();
    const fone = input.includeClientePii ? values.clienteCel.trim() : "";
    const row1Label = 32;
    const nomeW = contentWidth * 0.62;
    const foneW = contentWidth - nomeW - 8;

    fieldLine(page, contentLeft, y, "Nome:", nome, nomeW, row1Label);
    fieldLine(page, contentLeft + nomeW + 8, y, "Fone:", fone, foneW, 30);
    y -= 18;

    const quarter = contentWidth / 4;
    fieldLine(page, contentLeft, y, "Modelo:", values.veiculoModelo.trim(), quarter - 4, 42);
    fieldLine(page, contentLeft + quarter, y, "Placa:", values.veiculoPlaca.trim(), quarter - 4, 34);
    fieldLine(
        page,
        contentLeft + quarter * 2,
        y,
        "Tipo:",
        values.veiculoTipo.trim(),
        quarter - 4,
        28
    );
    fieldLine(
        page,
        contentLeft + quarter * 3,
        y,
        "Km:",
        values.veiculoKilometragem.trim(),
        quarter,
        22
    );
    y -= 18;

    fieldLine(
        page,
        contentLeft,
        y,
        "Entrada em:",
        values.dataInicio ? formatDateBr(values.dataInicio) : "",
        contentWidth * 0.48,
        58
    );
    fieldLine(
        page,
        contentLeft + contentWidth * 0.52,
        y,
        "Entrega em:",
        values.dataConclusao ? formatDateBr(values.dataConclusao) : "",
        contentWidth * 0.48,
        58
    );
    y -= 16;

    fieldLine(
        page,
        contentLeft,
        y,
        "Diagnóstico cliente:",
        values.diagnosticoCliente.trim(),
        contentWidth,
        98
    );
    y -= 18;

    fieldLine(
        page,
        contentLeft,
        y,
        "Diagnóstico mecânico:",
        values.diagnosticoMecanico.trim(),
        contentWidth,
        108
    );
    y -= 16;

    if (input.responsaveisLabels.length > 0) {
        fieldLine(
            page,
            contentLeft,
            y,
            "Responsáveis:",
            input.responsaveisLabels.join(", "),
            contentWidth,
            72
        );
        y -= 16;
    }

    y -= 6;

    // Services table
    const priceColW = 90;
    const serviceColW = contentWidth - priceColW;
    const rowH = 16;
    const headerH = 18;
    const serviceRows = Math.max(MIN_SERVICE_ROWS, itens.length);
    const tableH = headerH + serviceRows * rowH;
    const tableBottom = y - tableH;

    pdfRect(page, contentLeft, tableBottom, contentWidth, tableH, false);
    pdfLine(
        page,
        contentLeft + serviceColW,
        tableBottom,
        contentLeft + serviceColW,
        y,
        0
    );
    pdfLine(page, contentLeft, y - headerH, contentRight, y - headerH, 0);

    pdfText(page, contentLeft + 8, y - 12, 9, "SERVIÇO A EXECUTAR", "F2");
    pdfText(page, contentLeft + serviceColW + 18, y - 12, 9, "PREÇO", "F2");

    for (let i = 1; i <= serviceRows; i += 1) {
        const lineY = y - headerH - i * rowH;
        pdfLine(page, contentLeft, lineY, contentRight, lineY, 0.55);

        const item: OrdemServicoItemFormRow | undefined = itens[i - 1];

        if (!item) {
            continue;
        }

        const qty = Number(item.quantidade) || 0;
        const unit = parseMoneyInput(item.valor) ?? 0;
        const name = item.servicoNome?.trim() || "Serviço";
        const label = qty > 1 ? `${name} (x${qty})` : name;
        const textY = lineY + 5;

        pdfText(page, contentLeft + 6, textY, 8, truncate(label, 62));
        pdfText(
            page,
            contentLeft + serviceColW + 8,
            textY,
            8,
            formatMoneyBrl(qty * unit)
        );
    }

    y = tableBottom - 20;

    // Footer: signature + totals
    const totalsW = 210;
    const totalsX = contentRight - totalsW;
    const sigW = totalsX - contentLeft - 16;

    pdfText(page, contentLeft, y, 9, "Autorizo a execução dos serviços acima");
    y -= 28;
    pdfLine(page, contentLeft, y, contentLeft + sigW, y, 0.2);
    pdfText(page, contentLeft + sigW / 2 - 55, y - 12, 8, "PROPRIETÁRIO DO VEÍCULO", "F2");

    let totalsY = tableBottom - 18;
    const labelW = 120;
    const valueW = totalsW - labelW;

    totalRow(page, totalsX, totalsY, "Mão de Obra", formatMoneyBrl(total), labelW, valueW);
    totalsY -= 18;
    totalRow(page, totalsX, totalsY, "TOTAL R$", formatMoneyBrl(total), labelW, valueW, true);

    if (input.includePagamentos && (input.pagamentos?.length ?? 0) > 0) {
        totalsY -= 22;
        pdfText(page, totalsX, totalsY, 8, "Pagamentos", "F2");
        totalsY -= 12;

        for (const row of input.pagamentos.slice(0, 4)) {
            pdfText(
                page,
                totalsX,
                totalsY,
                7,
                `${pagamentoLabel(row.tipo)}: ${moneyFromDigits(row.valor)}`
            );
            totalsY -= 10;
        }

        if (pagoTotal > 0) {
            pdfText(page, totalsX, totalsY, 7, `Pago: ${formatMoneyBrl(pagoTotal)}`, "F2");
        }
    }

    return buildPdf([page], A4_PORTRAIT);
}

/**
 * Printable OS PDF styled like a workshop paper form (portrait A4).
 */
export function downloadOsPdf(input: ExportOsPdfInput): void {
    const idLabel = input.values.id != null ? `OS #${input.values.id}` : "Ordem de serviço";

    downloadPdfBytes(buildOsPdfBytes(input), idLabel);
}
