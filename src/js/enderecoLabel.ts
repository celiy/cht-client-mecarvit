export type EnderecoLike = {
    rua: string;
    numero: number | string;
    bairro?: string;
};

export function enderecoOptionLabel(endereco: EnderecoLike): string {
    const rua = endereco.rua?.trim() || "—";
    const numero = String(endereco.numero ?? "").trim() || "s/n";
    const bairro = endereco.bairro?.trim() || "";

    return bairro ? `${rua}, ${numero} · ${bairro}` : `${rua}, ${numero}`;
}

export function uniqueEnderecoIds(ids: string[]): number[] {
    const numeric = ids
        .map((id) => Number(id))
        .filter((id) => Number.isInteger(id) && id > 0);

    return [...new Set(numeric)];
}
