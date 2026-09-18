import { formatDateInputValue } from "@shared/format/dateTime";
import { moneyAmountToInputDigits } from "@shared/format/moneyInput";
import type { OrdemServicoFormValues } from "../components/OrdemServicoForm.vue";
import type { OrdemServicoItemFormRow } from "../components/OrdemServicoItensSection.vue";
import { documentDigits } from "./crudHttp";

export interface OrdemServicoItemApi {
    servicoId: number;
    servicoNome?: string;
    quantidade: number;
    valorObra: number;
    valorPecas?: number | null;
}

export interface OrdemServicoApi {
    id: number;
    criadoEm?: string;
    modificadoEm?: string;
    clienteDocumento: string;
    veiculoId: number;
    diagnosticoCliente?: string | null;
    diagnosticoMecanico?: string | null;
    dataInicio?: string | null;
    dataConclusao?: string | null;
    obs?: string | null;
    statusOsId: number;
    status?: { id: number; nome: string } | null;
    itens?: OrdemServicoItemApi[];
    pagamentos?: Array<{
        id: number;
        tipo: string;
        valor: number;
        criadoEm?: string;
        modificadoEm?: string;
    }>;
    responsaveis?: string[];
    total?: number;
    registroEntradaSaida?: { valor: number } | null;
}

export interface ClienteOsFormLookup {
    nome?: string;
    cel?: string | null;
}

export interface VeiculoOsFormLookup {
    modelo?: string;
    placa?: string;
    kilometragem?: number | null;
    tipo?: string | null;
}

function mapItensFromApi(itens: OrdemServicoItemApi[] | undefined): OrdemServicoItemFormRow[] {
    return (itens ?? []).map((item) => ({
        servicoId: item.servicoId,
        servicoNome: item.servicoNome ?? "",
        quantidade: String(item.quantidade),
        valorObra: moneyAmountToInputDigits(item.valorObra),
        valorPecas:
            item.valorPecas != null && item.valorPecas !== 0
                ? moneyAmountToInputDigits(item.valorPecas)
                : ""
    }));
}

export function toOsForm(
    os: OrdemServicoApi,
    cliente?: ClienteOsFormLookup,
    veiculo?: VeiculoOsFormLookup
): OrdemServicoFormValues {
    return {
        id: os.id,
        clienteDocumento: os.clienteDocumento ?? "",
        clienteNome: cliente?.nome ?? "",
        clienteCpfNovo: "",
        clienteCel: cliente?.cel ?? "",
        veiculoId: os.veiculoId != null ? String(os.veiculoId) : "",
        veiculoModelo: veiculo?.modelo ?? "",
        veiculoPlaca: veiculo?.placa ?? "",
        veiculoKilometragem:
            veiculo?.kilometragem != null && veiculo.kilometragem !== 0
                ? String(veiculo.kilometragem)
                : "",
        veiculoTipo: veiculo?.tipo ?? "",
        statusOsId: os.statusOsId != null ? String(os.statusOsId) : "1",
        dataInicio: formatDateInputValue(os.dataInicio),
        dataConclusao: formatDateInputValue(os.dataConclusao),
        diagnosticoCliente: os.diagnosticoCliente ?? "",
        diagnosticoMecanico: os.diagnosticoMecanico ?? "",
        obs: os.obs ?? "",
        responsaveisCpfs: (os.responsaveis ?? []).map((cpf) => documentDigits(cpf)),
        itens: mapItensFromApi(os.itens),
        criadoEm: os.criadoEm ?? "",
        modificadoEm: os.modificadoEm ?? ""
    };
}
