import { formatDateInputValue } from "@shared/format/dateTime";
import { moneyAmountToInputDigits } from "@shared/format/moneyInput";
import type { OrdemServicoFormValues } from "../components/OrdemServicoForm.vue";
import type { OrdemServicoItemFormRow } from "../components/OrdemServicoItensSection.vue";
import { documentDigits } from "./crudHttp";
import { dateToInputValue } from "./entityFields";

export interface OrdemServicoItemApi {
    servicoId: number;
    servicoNome?: string;
    quantidade: number;
    valor: number;
}

export interface OrdemServicoApi {
    id: number;
    criadoEm?: string;
    modificadoEm?: string;
    clienteDocumento: string;
    clienteNome?: string | null;
    veiculoId: number;
    veiculo?: VeiculoOsFormLookup | null;
    cliente?: ClienteOsFormLookup | null;
    diagnosticoCliente?: string | null;
    diagnosticoMecanico?: string | null;
    dataInicio?: string | null;
    dataConclusao?: string | null;
    dataLimitePagamento?: string | null;
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
    pagamentoSituacao?: string;
    registroEntradaSaida?: {
        valor: number;
        dataLimitePagamento?: string | null;
    } | null;
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

/**
 * Deadline visible for an OS.
 *
 * The OS column only holds the value while the record it generates does not
 * exist yet. Once it exists, that record owns the deadline — including when it
 * is explicitly null — so an edit in the financeiro is never shadowed by a
 * stale copy on the OS.
 */
export function osDataLimitePagamento(os: OrdemServicoApi): unknown {
    if (os.registroEntradaSaida) {
        return os.registroEntradaSaida.dataLimitePagamento ?? null;
    }

    return os.dataLimitePagamento ?? null;
}

function mapItensFromApi(itens: OrdemServicoItemApi[] | undefined): OrdemServicoItemFormRow[] {
    return (itens ?? []).map((item) => ({
        servicoId: item.servicoId,
        servicoNome: item.servicoNome ?? "",
        quantidade: String(item.quantidade),
        valor: moneyAmountToInputDigits(item.valor)
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
        clienteNome: cliente?.nome ?? os.cliente?.nome ?? os.clienteNome ?? "",
        clienteCpfNovo: "",
        clienteCel: cliente?.cel ?? os.cliente?.cel ?? "",
        veiculoId: os.veiculoId != null ? String(os.veiculoId) : "",
        veiculoModelo: veiculo?.modelo ?? os.veiculo?.modelo ?? "",
        veiculoPlaca: veiculo?.placa ?? os.veiculo?.placa ?? "",
        veiculoKilometragem:
            (veiculo?.kilometragem ?? os.veiculo?.kilometragem) != null &&
            (veiculo?.kilometragem ?? os.veiculo?.kilometragem) !== 0
                ? String(veiculo?.kilometragem ?? os.veiculo?.kilometragem)
                : "",
        veiculoTipo: veiculo?.tipo ?? os.veiculo?.tipo ?? "",
        statusOsId: os.statusOsId != null ? String(os.statusOsId) : "1",
        dataInicio: formatDateInputValue(os.dataInicio),
        dataConclusao: formatDateInputValue(os.dataConclusao),
        dataLimitePagamento: dateToInputValue(osDataLimitePagamento(os)),
        diagnosticoCliente: os.diagnosticoCliente ?? "",
        diagnosticoMecanico: os.diagnosticoMecanico ?? "",
        obs: os.obs ?? "",
        responsaveisCpfs: (os.responsaveis ?? []).map((cpf) => documentDigits(cpf)),
        itens: mapItensFromApi(os.itens),
        criadoEm: os.criadoEm ?? "",
        modificadoEm: os.modificadoEm ?? ""
    };
}
