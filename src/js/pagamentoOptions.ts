export const PAGAMENTO_SELECT_OPTIONS = [
    { label: "Dinheiro", value: "dinheiro" },
    { label: "PIX", value: "pix" },
    { label: "Crédito", value: "credito" },
    { label: "Débito", value: "debito" },
    { label: "Boleto", value: "boleto" },
    { label: "Transferência", value: "transferencia" },
    { label: "Cheque", value: "cheque" },
    { label: "Outro", value: "outro" }
];

export type PagamentoFormRow = {
    id?: number;
    tipo: string;
    valor: string;
    criadoEm?: string;
    modificadoEm?: string;
};

export function sumPagamentosValor(
    pagamentos: Array<{ valor: number | string }> | undefined
): number {
    return (pagamentos ?? []).reduce((total, row) => {
        const amount = Number(row.valor);

        if (!Number.isFinite(amount)) {
            return total;
        }

        return total + amount;
    }, 0);
}

export function pagamentoLabel(tipo: string): string {
    const normalized = tipo.trim().toLowerCase();
    const found = PAGAMENTO_SELECT_OPTIONS.find((option) => option.value === normalized);

    return found?.label ?? tipo;
}
