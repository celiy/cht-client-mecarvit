import { buildOsPdfBytes } from "./exportOsPdf.js";

function assert(cond: boolean, label: string) {
    if (!cond) {
        throw new Error(label);
    }
}

const bytes = buildOsPdfBytes({
    values: {
        id: 42,
        clienteDocumento: "52998224725",
        clienteNome: "Maria Silva",
        clienteCpfNovo: "",
        clienteCel: "11999998888",
        veiculoId: "1",
        veiculoModelo: "Gol 1.0",
        veiculoPlaca: "ABC1D23",
        veiculoKilometragem: "45000",
        veiculoTipo: "carro",
        statusOsId: "1",
        dataInicio: "2026-09-28",
        dataConclusao: "",
        dataLimitePagamento: "",
        diagnosticoCliente: "Barulho na suspensão",
        diagnosticoMecanico: "",
        obs: "",
        responsaveisCpfs: [],
        itens: [
            { servicoId: 1, servicoNome: "Alinhamento", quantidade: "1", valor: "15000" },
            { servicoId: 2, servicoNome: "Balanceamento", quantidade: "2", valor: "8000" }
        ],
        criadoEm: "",
        modificadoEm: ""
    },
    statusLabel: "Aberta",
    responsaveisLabels: ["João Mecânico"],
    pagamentos: [],
    includeClientePii: true,
    includePagamentos: true
});

const head = String.fromCharCode(...bytes.slice(0, 8));

assert(head.startsWith("%PDF-1."), "pdf header");
assert(bytes.length > 800, "pdf has content");

console.log("exportOsPdf ok", bytes.length);
