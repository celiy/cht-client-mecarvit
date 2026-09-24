import {
    formatTableCellMask,
    tableCellMaskForField
} from "@shared/format/displayMasks";
import { formatDateTimeBr } from "@shared/format/dateTime";
import { mecarvit } from "./mecarvit";

export type PdfTableColumn = {
    label: string;
    field?: string;
};

export type PdfTable = {
    title?: string;
    headers: PdfTableColumn[];
    rows: Array<Record<string, unknown>>;
};

const PAGE_WIDTH = 841.89;
const PAGE_HEIGHT = 595.28;
const MARGIN = 36;
const FONT_SIZE = 9;
const TITLE_SIZE = 14;
const LINE_HEIGHT = 12;
const MAX_ROWS = 3000;

function toWinAnsi(text: string): string {
    const replacements: Record<string, string> = {
        "\u00a0": " ",
        "–": "-",
        "—": "-",
        "“": '"',
        "”": '"',
        "‘": "'",
        "’": "'",
        "…": "..."
    };

    let out = "";

    for (const ch of text.normalize("NFC")) {
        const mapped = replacements[ch];

        if (mapped != null) {
            out += mapped;
            continue;
        }

        const code = ch.charCodeAt(0);

        if (code < 128 || (code >= 0xa0 && code <= 0xff)) {
            out += ch;
            continue;
        }

        out += "?";
    }

    return out;
}

function pdfLiteral(text: string): string {
    const ansi = toWinAnsi(text);
    let out = "(";

    for (const ch of ansi) {
        const code = ch.charCodeAt(0);

        if (code === 0x28 || code === 0x29 || code === 0x5c) {
            out += `\\${ch}`;
            continue;
        }

        if (code < 32 || code > 126) {
            out += `\\${code.toString(8).padStart(3, "0")}`;
            continue;
        }

        out += ch;
    }

    return `${out})`;
}

function badgeLabel(value: unknown): string | null {
    if (typeof value !== "object" || value === null) {
        return null;
    }

    const rec = value as Record<string, unknown>;

    if (rec.badge && typeof rec.badge === "object" && rec.badge !== null) {
        return String((rec.badge as { label?: unknown }).label ?? "");
    }

    if (typeof rec.label === "string") {
        return rec.label;
    }

    return null;
}

export function tableCellPlainText(value: unknown, field?: string): string {
    if (value == null || value === "") {
        return "";
    }

    const fromBadge = badgeLabel(value);

    if (fromBadge != null) {
        return fromBadge;
    }

    if (typeof value === "boolean") {
        return value ? "Sim" : "Não";
    }

    const text = String(value);
    const format = tableCellMaskForField(field);

    return format ? formatTableCellMask(text, format) : text;
}

function wrapText(text: string, maxChars: number): string[] {
    const trimmed = text.trim() || "—";

    if (maxChars < 4) {
        return [trimmed.slice(0, 3)];
    }

    const words = trimmed.split(/\s+/);
    const lines: string[] = [];
    let current = "";

    for (const word of words) {
        const next = current ? `${current} ${word}` : word;

        if (next.length <= maxChars) {
            current = next;
            continue;
        }

        if (current) {
            lines.push(current);
        }

        if (word.length <= maxChars) {
            current = word;
            continue;
        }

        for (let i = 0; i < word.length; i += maxChars) {
            const chunk = word.slice(i, i + maxChars);

            if (i + maxChars >= word.length) {
                current = chunk;
            } else {
                lines.push(chunk);
            }
        }
    }

    if (current) {
        lines.push(current);
    }

    return lines.slice(0, 6);
}

function slugify(value: string): string {
    return (
        value
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "")
            .slice(0, 60) || "tabela"
    );
}

type PageBuffer = string[];

function beginPage(): PageBuffer {
    return [];
}

function pushText(page: PageBuffer, x: number, y: number, size: number, text: string) {
    page.push(
        "BT",
        `/F1 ${size} Tf`,
        `1 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)} Tm`,
        `${pdfLiteral(text)} Tj`,
        "ET"
    );
}

function pushRect(page: PageBuffer, x: number, y: number, w: number, h: number, fill: boolean) {
    page.push(`${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re`);
    page.push(fill ? "f" : "S");
}

function buildPdf(pages: PageBuffer[]): Uint8Array {
    const raw: string[] = [];

    const add = (body: string): number => {
        const id = raw.length + 1;
        raw.push(`${id} 0 obj ${body} endobj\n`);
        return id;
    };

    add("<< /Type /Catalog /Pages 2 0 R >>");
    add("<< /Type /Pages /Kids [] /Count 0 >>");
    const fontId = add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>");

    const pageIds: number[] = [];

    for (const page of pages) {
        const body = `${page.join("\n")}\n`;
        const contentId = add(`<< /Length ${body.length} >> stream\n${body}endstream`);
        pageIds.push(
            add(
                `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 ${fontId} 0 R >> >> /Contents ${contentId} 0 R >>`
            )
        );
    }

    const pagesIndex = 1;
    const pagesEntry = raw[pagesIndex];

    if (pagesEntry) {
        raw[pagesIndex] =
            `2 0 obj << /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >> endobj\n`;
    }

    let pdf = "%PDF-1.4\n";
    const offsets = [0];

    for (const part of raw) {
        offsets.push(pdf.length);
        pdf += part;
    }

    const xrefStart = pdf.length;
    pdf += `xref\n0 ${raw.length + 1}\n`;
    pdf += "0000000000 65535 f \n";

    for (let i = 1; i < offsets.length; i++) {
        pdf += `${String(offsets[i] ?? 0).padStart(10, "0")} 00000 n \n`;
    }

    pdf += `trailer << /Size ${raw.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;

    const bytes = new Uint8Array(pdf.length);

    for (let i = 0; i < pdf.length; i++) {
        bytes[i] = pdf.charCodeAt(i) & 0xff;
    }

    return bytes;
}

function layoutAndBuild(fileTitle: string, tables: PdfTable[]): Uint8Array {
    const pages: PageBuffer[] = [];
    let page = beginPage();
    let y = PAGE_HEIGHT - MARGIN;

    const usableWidth = PAGE_WIDTH - MARGIN * 2;

    const newPage = () => {
        pages.push(page);
        page = beginPage();
        y = PAGE_HEIGHT - MARGIN;
    };

    const ensureSpace = (needed: number) => {
        if (y - needed < MARGIN) {
            newPage();
        }
    };

    pushText(page, MARGIN, y, TITLE_SIZE, fileTitle);
    y -= TITLE_SIZE + 6;

    const companyName = mecarvit.company?.nome?.trim();
    const exportedAt = formatDateTimeBr(new Date());
    const headerLine = [companyName, exportedAt].filter(Boolean).join("  ·  ");

    if (headerLine) {
        pushText(page, MARGIN, y, FONT_SIZE, headerLine);
        y -= LINE_HEIGHT + 8;
    } else {
        y -= 4;
    }

    for (const table of tables) {
        const headers = table.headers.filter((header) => header.field);
        const colCount = Math.max(headers.length, 1);
        const colWidth = usableWidth / colCount;
        const maxChars = Math.max(6, Math.floor(colWidth / (FONT_SIZE * 0.5)));
        const rows = table.rows.slice(0, MAX_ROWS);

        if (table.title) {
            ensureSpace(LINE_HEIGHT + 8);
            pushText(page, MARGIN, y, 11, table.title);
            y -= LINE_HEIGHT + 4;
        }

        const drawHeader = () => {
            ensureSpace(LINE_HEIGHT + 6);
            page.push("0.92 g");
            pushRect(page, MARGIN, y - 3, usableWidth, LINE_HEIGHT + 4, true);
            page.push("0 g");

            headers.forEach((header, index) => {
                const x = MARGIN + 4 + index * colWidth;
                pushText(page, x, y, FONT_SIZE, header.label);
            });

            y -= LINE_HEIGHT + 6;
            page.push("0.7 G");
            page.push(`${MARGIN} ${y + LINE_HEIGHT + 2} m ${MARGIN + usableWidth} ${y + LINE_HEIGHT + 2} l S`);
            page.push("0 G");
        };

        drawHeader();

        if (rows.length === 0) {
            ensureSpace(LINE_HEIGHT);
            pushText(page, MARGIN + 4, y, FONT_SIZE, "Nenhum registro encontrado.");
            y -= LINE_HEIGHT + 12;
            continue;
        }

        for (const row of rows) {
            const cellLines = headers.map((header) =>
                wrapText(tableCellPlainText(row[header.field ?? ""], header.field), maxChars)
            );
            const rowLines = Math.max(1, ...cellLines.map((lines) => lines.length));
            const rowHeight = rowLines * LINE_HEIGHT + 4;

            if (y - rowHeight < MARGIN) {
                newPage();
                drawHeader();
            }

            headers.forEach((_, index) => {
                const lines = cellLines[index] ?? ["—"];
                const x = MARGIN + 4 + index * colWidth;

                lines.forEach((line, lineIndex) => {
                    pushText(page, x, y - lineIndex * LINE_HEIGHT, FONT_SIZE, line);
                });
            });

            y -= rowHeight;
        }

        y -= 16;
    }

    pages.push(page);

    return buildPdf(pages);
}

export function downloadTablesPdf(fileTitle: string, tables: PdfTable[]): void {
    const bytes = layoutAndBuild(fileTitle, tables);
    const blob = new Blob([bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer], {
        type: "application/pdf"
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `${slugify(fileTitle)}.pdf`;
    link.rel = "noopener";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadTablePdf(
    fileTitle: string,
    headers: PdfTableColumn[],
    rows: Array<Record<string, unknown>>
): void {
    downloadTablesPdf(fileTitle, [{ headers, rows }]);
}
