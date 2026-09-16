<template>
    <CrudListPage
        title="Ordens de serviço"
        :filters="osFilters"
        :loading="loadingOs"
        :headers="tableHeaders"
        :rows="tableRows"
        :page-count="pageCount"
        pagination-id="pagination-os"
        :pagination-key="filters || 'all'"
        delete-name-field="idLabel"
        :actions="rowActions"
        :filter-select-options="filterSelectOptions"

        @create="onCreate"
        @filters="onFilters"
        @search:external="onFilterSearch"
        @reload="getOrdens"
        @page="onPage"
        @action="onRowAction"
        @delete="onDelete"
    >
        <Modal
            :is-open="dialogOpen"
            size="extra-large"

            @update:value="onDialogOpenChange"
        >
            <template #header>
                {{ dialogHeader }}
            </template>

            <template #body>
                <OrdemServicoForm
                    :key="dialogKey"
                    ref="osForm"

                    :form-id="osFormId"
                    :mode="dialogMode"
                    :values="dialogItem"
                    :cliente-options="clienteOptions"
                    :veiculo-options="veiculoSelectOptions"
                    :status-options="statusSelectOptions"
                    :servico-suggestions="servicoSuggestions"

                    @submit="onSave"
                    @click:cliente-action="onClienteAction"
                    @click:veiculo-action="onVeiculoAction"
                    @search:external="onSearchExternal"
                    @search:servico="onSearchServicos"
                    @change:cliente="onClienteChange"
                />

                <div class="mt-4">
                    <Button
                        type="button"
                        variant="outline"
                        size="small"
                        left-icon="fa-money-bill"
                        :label="dialogPagamentosButtonLabel"

                        @click="openDialogOsPagamentos"
                    />
                </div>
            </template>

            <template #footer>
                <div class="flex flex-wrap justify-end gap-2">
                    <template v-if="dialogMode === 'view'">
                        <Button
                            variant="primary"
                            type="button"

                            @click="closeDialog"
                        >
                            Fechar
                        </Button>
                    </template>

                    <template v-else>
                        <Button
                            variant="primary"
                            type="submit"
                            :form="osFormId"
                            :disabled="dialogSaving || paymentModalOpen"
                        >
                            Salvar
                        </Button>

                        <Button
                            variant="secondary"
                            type="button"
                            :disabled="dialogSaving || paymentModalOpen"

                            @click="closeDialog"
                        >
                            Cancelar
                        </Button>
                    </template>
                </div>
            </template>
        </Modal>

        <ItemViewEdit
            ref="clienteDialog"

            v-model:is-open="clienteDialogOpen"
            header="Novo cliente"
            mode="create"
            size="small"
            :item="clienteItem"
            :fields="nestedClienteFields"
            :saving="clienteSaving"
            :form-key="clienteDialogKey"

            @save="onSaveCliente"
            @cancel="closeClienteDialog"
        />

        <ItemViewEdit
            ref="veiculoDialog"

            v-model:is-open="veiculoDialogOpen"
            header="Novo veículo"
            mode="create"
            size="small"
            :item="veiculoItem"
            :fields="nestedVeiculoFields"
            :saving="veiculoSaving"
            :form-key="veiculoDialogKey"

            @save="onSaveVeiculo"
            @cancel="closeVeiculoDialog"
        />

        <PagamentosModal
            v-model:is-open="paymentModalOpen"
            :saving="paymentSaving"
            :valor-total="paymentValorTotal"
            :rows="paymentModalRows"
            :readonly="paymentReadonly"

            @save="onSaveOsPagamentos"
            @cancel="onPaymentModalCancel"
        />
    </CrudListPage>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { HttpError } from "@base/http";
import { toQueryString } from "@shared/frontend/queryString";
import Button from "@design/components/Button.vue";
import type { FilterDef, FilterValues } from "../../components/FilterInputs.vue";
import PagamentosModal from "../../components/PagamentosModal.vue";
import type { PagamentoFormRow } from "../../js/pagamentoOptions";
import ItemViewEdit from "../../components/ItemViewEdit.vue";
import CrudListPage, { type TableHeader } from "../../components/CrudListPage.vue";
import OrdemServicoForm, {
    type OrdemServicoFormValues,
    type VeiculoSelectOption
} from "../../components/OrdemServicoForm.vue";
import {
    clienteFormFields,
    clienteNomeSocialForSave,
    veiculoFormFields
} from "../../js/entityFields";
import { formatDateInputValue } from "@shared/format/dateTime";
import { moneyAmountToInputDigits, parseMoneyInput } from "@shared/format/moneyInput";
import type { OrdemServicoItemFormRow } from "../../components/OrdemServicoItensSection.vue";
import {
    CRUD_ROW_ACTIONS_WITH_PAGAMENTO,
    documentDigits,
    fieldErrorsFromHttp,
    listQuery,
    notifyHttpError,
    pageCountFromTotal,
    withSelectedItem,
    type DialogMode,
    type ItemResponse,
    type ItemViewEditExpose,
    type ListResponse
} from "../../js/crudHttp";
import { formatTableLabel } from "../../js/formatTableLabel";
import { osStatusBadge } from "../../js/osStatusBadge";

interface ClienteApi {
    documento: string;
    nome: string;
}

interface VeiculoApi {
    id: number;
    modelo: string;
    placa: string;
    clienteDocumento: string;
}

interface StatusOsApi {
    id: number;
    nome: string;
}

interface PagamentoApi {
    id: number;
    tipo: string;
    valor: number;
    criadoEm?: string;
    modificadoEm?: string;
}

interface OrdemServicoItemApi {
    servicoId: number;
    servicoNome?: string;
    quantidade: number;
    valorObra: number;
    valorPecas?: number | null;
}

interface OrdemServicoApi {
    id: number;
    clienteDocumento: string;
    veiculoId: number;
    diagnosticoCliente?: string | null;
    diagnosticoMecanico?: string | null;
    dataInicio?: string | null;
    dataConclusao?: string | null;
    obs?: string | null;
    statusOsId: number;
    status?: StatusOsApi | null;
    itens?: OrdemServicoItemApi[];
    pagamentos?: PagamentoApi[];
    total?: number;
    registroEntradaSaida?: { valor: number } | null;
}

interface ServicoApi {
    id: number;
    nome: string;
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

function emptyOsForm(defaultStatusId = "1"): OrdemServicoFormValues {
    return {
        clienteDocumento: "",
        veiculoId: "",
        statusOsId: defaultStatusId,
        dataInicio: formatDateInputValue(new Date()),
        dataConclusao: "",
        diagnosticoCliente: "",
        diagnosticoMecanico: "",
        obs: "",
        itens: []
    };
}

function toOsForm(os: OrdemServicoApi): OrdemServicoFormValues {
    return {
        id: os.id,
        clienteDocumento: os.clienteDocumento ?? "",
        veiculoId: os.veiculoId != null ? String(os.veiculoId) : "",
        statusOsId: os.statusOsId != null ? String(os.statusOsId) : "1",
        dataInicio: formatDateInputValue(os.dataInicio),
        dataConclusao: formatDateInputValue(os.dataConclusao),
        diagnosticoCliente: os.diagnosticoCliente ?? "",
        diagnosticoMecanico: os.diagnosticoMecanico ?? "",
        obs: os.obs ?? "",
        itens: mapItensFromApi(os.itens)
    };
}

function emptyVeiculoForm(clienteDocumento = "") {
    return {
        clienteDocumento,
        modelo: "",
        placa: "",
        tipo: "",
        chassi: "",
        kilometragem: "",
        dataTrocaOleo: ""
    };
}

function emptyClienteForm() {
    return {
        documento: "",
        nome: "",
        nomeSocial: "",
        email: "",
        cel: "",
        obs: "",
        ativo: true,
        veiculoId: ""
    };
}

type OsFormExpose = {
    applyFieldErrors: (errors: Record<string, string>) => void;
    setFieldValue: (fieldId: string, value: unknown) => void;
    getFieldValue: (fieldId: string) => unknown;
};

export default defineComponent({
    name: "MecarvitOrdemServicoPage",

    components: {
        Button,
        CrudListPage,
        ItemViewEdit,
        PagamentosModal,
        OrdemServicoForm
    },

    data() {
        return {
            rowActions: CRUD_ROW_ACTIONS_WITH_PAGAMENTO,
            paymentModalOpen: false,
            paymentSaving: false,
            paymentOsId: null as number | null,
            paymentModalRows: [] as PagamentoFormRow[],
            paymentValorTotal: 0,
            paymentReadonly: false,
            paymentFromDialog: false,
            dialogPagamentos: [] as PagamentoFormRow[],
            osFormId: "ordem-servico-form",
            filters: "",
            tableHeaders: [
                { label: "OS", field: "idLabel", position: "start" },
                { label: "Cliente", field: "clienteNome", position: "start" },
                { label: "Veículo", field: "veiculoLabel", position: "start" },
                { label: "Status", field: "statusBadge", position: "center" }
            ] as TableHeader[],
            ordens: [] as OrdemServicoApi[],
            clientes: [] as ClienteApi[],
            veiculos: [] as VeiculoApi[],
            formClientes: [] as ClienteApi[],
            formVeiculos: [] as VeiculoApi[],
            statusOs: [] as StatusOsApi[],
            loadingOs: false,
            dialogOpen: false,
            dialogSaving: false,
            dialogMode: "view" as DialogMode,
            dialogItem: emptyOsForm("1") as OrdemServicoFormValues,
            dialogKey: 0,
            clienteDialogOpen: false,
            clienteSaving: false,
            clienteItem: emptyClienteForm(),
            clienteDialogKey: 0,
            veiculoDialogOpen: false,
            veiculoSaving: false,
            veiculoItem: emptyVeiculoForm(),
            veiculoDialogKey: 0,
            clienteSearchSeq: 0,
            veiculoSearchSeq: 0,
            servicoSearchSeq: 0,
            servicoSuggestions: [] as ServicoApi[],
            filterClienteOptions: [] as Array<{ label: string; value: string }>,
            filterVeiculoOptions: [] as Array<{ label: string; value: string }>,
            filterClienteSearchSeq: 0,
            filterVeiculoSearchSeq: 0,
            page: 1,
            pageLimit: 10,
            pageCount: 0
        };
    },

    computed: {
        osFilters(): FilterDef[] {
            const statusOptions = [
                { label: "Todos", value: "todos", default: true },
                ...this.statusOs.map((status) => ({
                    label: formatTableLabel(status.nome),
                    value: String(status.id)
                }))
            ];

            return [
                {
                    type: "select",
                    value: "cliente",
                    label: "Cliente",
                    default: true,
                    search: { external: true, field: "nome" }
                },
                {
                    type: "select",
                    value: "veiculo",
                    label: "Veículo",
                    search: { external: true, field: "modelo" }
                },
                {
                    type: "option",
                    value: "statusOsId",
                    label: "Status",
                    options: statusOptions
                },
                {
                    type: "option",
                    value: "paga",
                    label: "Paga",
                    options: [
                        { label: "Todas", value: "todas", default: true },
                        { label: "Sim", value: "sim" },
                        { label: "Não", value: "nao" }
                    ]
                }
            ];
        },

        clienteNameByDocumento(): Record<string, string> {
            const map: Record<string, string> = {};

            for (const cliente of this.clientes) {
                map[cliente.documento] = cliente.nome;
            }

            return map;
        },

        veiculoById(): Record<number, VeiculoApi> {
            const map: Record<number, VeiculoApi> = {};

            for (const veiculo of this.veiculos) {
                map[veiculo.id] = veiculo;
            }

            return map;
        },

        statusNameById(): Record<number, string> {
            const map: Record<number, string> = {};

            for (const status of this.statusOs) {
                map[status.id] = status.nome;
            }

            return map;
        },

        tableRows() {
            return this.ordens.map((os) => {
                const veiculo = this.veiculoById[os.veiculoId];

                return {
                    ...os,
                    idLabel: `#${os.id}`,
                    clienteNome:
                        this.clienteNameByDocumento[os.clienteDocumento] || os.clienteDocumento,
                    veiculoLabel: veiculo
                        ? `${veiculo.modelo} · ${veiculo.placa}`
                        : String(os.veiculoId),
                    statusBadge: osStatusBadge(
                        os.statusOsId,
                        os.status?.nome || this.statusNameById[os.statusOsId] || "—"
                    )
                };
            });
        },

        clienteOptions() {
            return this.formClientes.map((cliente) => ({
                label: `${cliente.nome} · ${cliente.documento}`,
                value: cliente.documento
            }));
        },

        veiculoSelectOptions(): VeiculoSelectOption[] {
            return this.formVeiculos.map((veiculo) => ({
                label: `${veiculo.modelo} · ${veiculo.placa}`,
                value: String(veiculo.id),
                clienteDocumento: veiculo.clienteDocumento
            }));
        },

        statusSelectOptions() {
            return this.statusOs.map((status) => ({
                label: formatTableLabel(status.nome),
                value: String(status.id)
            }));
        },

        dialogPagamentosButtonLabel(): string {
            if (this.dialogMode === "view") {
                return "Ver pagamentos";
            }

            if (this.dialogMode === "create") {
                return "Registrar pagamentos";
            }

            return "Gerenciar pagamentos";
        },

        dialogHeader(): string {
            if (this.dialogMode === "create") {
                return "Nova ordem de serviço";
            }

            if (this.dialogItem.id) {
                return `OS #${this.dialogItem.id}`;
            }

            return "Ordem de serviço";
        },

        nestedClienteFields() {
            return clienteFormFields({
                isCreate: true,
                isView: false,
                veiculoOptions: [],
                includeVehicles: false
            });
        },

        nestedVeiculoFields() {
            return veiculoFormFields({
                isCreate: true,
                clienteOptions: this.clienteOptions,
                showCliente: false
            });
        },

        filterSelectOptions(): Record<string, Array<{ label: string; value: string }>> {
            return {
                cliente: this.filterClienteOptions,
                veiculo: this.filterVeiculoOptions
            };
        }
    },

    mounted() {
        void this.getLookups();
    },

    methods: {
        osFormRef(): OsFormExpose | undefined {
            return this.$refs.osForm as OsFormExpose | undefined;
        },

        clienteDialogRef(): ItemViewEditExpose | undefined {
            return this.$refs.clienteDialog as ItemViewEditExpose | undefined;
        },

        veiculoDialogRef(): ItemViewEditExpose | undefined {
            return this.$refs.veiculoDialog as ItemViewEditExpose | undefined;
        },

        closeDialog() {
            this.dialogOpen = false;
            this.dialogSaving = false;
            this.dialogPagamentos = [];
            this.closeClienteDialog();
            this.closeVeiculoDialog();
        },

        closeClienteDialog() {
            this.clienteDialogOpen = false;
            this.clienteSaving = false;
        },

        onDialogOpenChange(open: boolean) {
            this.dialogOpen = open;

            if (!open) {
                this.closeClienteDialog();
                this.closeVeiculoDialog();
            }
        },

        onFilters(values: FilterValues) {
            this.page = 1;

            const queryValues = { ...values };

            if (queryValues.statusOsId === "todos") {
                delete queryValues.statusOsId;
            }

            if (queryValues.paga === "todas") {
                delete queryValues.paga;
            }

            this.filters = toQueryString(queryValues);
            void this.getOrdens();
        },

        onPage(page: number) {
            if (page === this.page) {
                return;
            }

            this.page = page;
            void this.getOrdens();
        },

        async getLookups() {
            try {
                const [clientes, veiculos, status] = await Promise.all([
                    this.$http.get<ListResponse<ClienteApi>>(
                        "/api/cliente?limit=100&ativo=ativo,inativo"
                    ),
                    this.$http.get<ListResponse<VeiculoApi>>("/api/veiculo?limit=100"),
                    this.$http.get<ListResponse<StatusOsApi>>("/api/status-os?limit=100")
                ]);

                this.clientes = clientes.data.data ?? [];
                this.veiculos = veiculos.data.data ?? [];
                this.formClientes = [...this.clientes];
                this.formVeiculos = [...this.veiculos];
                this.statusOs = status.data.data ?? [];
                this.syncFilterSelectOptionsFromLookups();
            } catch (error) {
                notifyHttpError(this.$toast, error, "Não foi possível carregar os dados da OS.");
            }
        },

        syncFilterSelectOptionsFromLookups() {
            this.filterClienteOptions = this.clientes.map((cliente) => ({
                label: `${cliente.nome} · ${cliente.documento}`,
                value: cliente.documento
            }));
            this.filterVeiculoOptions = this.veiculos.map((veiculo) => ({
                label: `${veiculo.modelo} · ${veiculo.placa}`,
                value: String(veiculo.id)
            }));
        },

        onFilterSearch(payload: { filterKey: string; field: string; value: string }) {
            if (payload.filterKey === "cliente") {
                void this.searchFilterClientes(payload.value, payload.field || "nome");
                return;
            }

            if (payload.filterKey === "veiculo") {
                void this.searchFilterVeiculos(payload.value, payload.field || "modelo");
            }
        },

        async searchFilterClientes(query: string, field: string) {
            this.filterClienteSearchSeq += 1;
            const seq = this.filterClienteSearchSeq;

            try {
                const trimmed = query.trim();
                const searchQuery = toQueryString({
                    limit: 100,
                    ativo: "ativo,inativo",
                    ...(trimmed && field ? { [field]: trimmed } : {})
                });
                const response = await this.$http.get<ListResponse<ClienteApi>>(
                    `/api/cliente?${searchQuery}`
                );

                if (seq !== this.filterClienteSearchSeq) {
                    return;
                }

                this.filterClienteOptions = (response.data.data ?? []).map((cliente) => ({
                    label: `${cliente.nome} · ${cliente.documento}`,
                    value: cliente.documento
                }));
            } catch {
                if (seq !== this.filterClienteSearchSeq) {
                    return;
                }

                this.filterClienteOptions = [];
            }
        },

        async searchFilterVeiculos(query: string, field: string) {
            this.filterVeiculoSearchSeq += 1;
            const seq = this.filterVeiculoSearchSeq;

            try {
                const trimmed = query.trim();
                const searchQuery = toQueryString({
                    limit: 100,
                    ...(trimmed && field ? { [field]: trimmed } : {})
                });
                const response = await this.$http.get<ListResponse<VeiculoApi>>(
                    `/api/veiculo?${searchQuery}`
                );

                if (seq !== this.filterVeiculoSearchSeq) {
                    return;
                }

                this.filterVeiculoOptions = (response.data.data ?? []).map((veiculo) => ({
                    label: `${veiculo.modelo} · ${veiculo.placa}`,
                    value: String(veiculo.id)
                }));
            } catch {
                if (seq !== this.filterVeiculoSearchSeq) {
                    return;
                }

                this.filterVeiculoOptions = [];
            }
        },

        async getOrdens() {
            try {
                this.loadingOs = true;

                const query = listQuery(this.filters, this.page, this.pageLimit);
                const response = await this.$http.get<ListResponse<OrdemServicoApi>>(
                    `/api/ordem-servico?${query}`
                );

                this.pageCount = pageCountFromTotal(
                    response.data.total,
                    response.data.limit,
                    this.pageLimit
                );
                this.ordens = response.data.data ?? [];
            } catch (error) {
                notifyHttpError(
                    this.$toast,
                    error,
                    "Não foi possível carregar as ordens de serviço."
                );
                this.ordens = [];
                this.pageCount = 0;
            } finally {
                this.loadingOs = false;
            }
        },

        openDialog(
            mode: DialogMode,
            item: OrdemServicoFormValues,
            pagamentos: PagamentoFormRow[] = []
        ) {
            this.dialogKey += 1;
            this.dialogMode = mode;
            this.dialogItem = item;
            this.dialogPagamentos = pagamentos;
            this.dialogSaving = false;
            this.dialogOpen = true;

            const cliente =
                this.formClientes.find((entry) => entry.documento === item.clienteDocumento) ??
                this.clientes.find((entry) => entry.documento === item.clienteDocumento);

            if (cliente) {
                this.formClientes = withSelectedItem(
                    this.formClientes,
                    cliente,
                    (entry) => entry.documento
                );
            }

            const veiculoId = Number(item.veiculoId);
            const veiculo =
                this.formVeiculos.find((entry) => entry.id === veiculoId) ??
                this.veiculos.find((entry) => entry.id === veiculoId);

            if (veiculo) {
                this.formVeiculos = withSelectedItem(this.formVeiculos, veiculo, (entry) =>
                    String(entry.id)
                );
            }
        },

        onCreate() {
            const defaultStatus = this.statusOs[0]?.id;

            this.openDialog(
                "create",
                emptyOsForm(defaultStatus != null ? String(defaultStatus) : "1")
            );
        },

        async openOsDialog(mode: "view" | "edit", row: Record<string, unknown>) {
            const id = Number(row.id);

            if (!Number.isInteger(id) || id <= 0) {
                this.$toast.error("Ordem de serviço inválida.");
                return;
            }

            try {
                const response = await this.$http.get<ItemResponse<OrdemServicoApi>>(
                    `/api/ordem-servico/${id}`
                );

                const os = response.data.data;

                this.openDialog(
                    mode,
                    toOsForm(os),
                    (os.pagamentos ?? []).map((row) => ({
                        id: row.id,
                        tipo: row.tipo,
                        valor: String(row.valor),
                        criadoEm: row.criadoEm,
                        modificadoEm: row.modificadoEm
                    }))
                );
            } catch (error) {
                notifyHttpError(
                    this.$toast,
                    error,
                    "Não foi possível carregar a ordem de serviço."
                );
            }
        },

        onRowAction(value: string, item: Record<string, unknown>) {
            if (value === "inspect") {
                void this.openOsDialog("view", item);
            } else if (value === "edit") {
                void this.openOsDialog("edit", item);
            } else if (value === "pagamentos") {
                const id = Number(item.id);

                if (!Number.isInteger(id) || id <= 0) {
                    return;
                }

                void this.openOsPagamentos(id);
            }
        },

        onPaymentModalCancel() {
            this.paymentModalOpen = false;
            this.paymentOsId = null;
            this.paymentModalRows = [];
            this.paymentValorTotal = 0;
            this.paymentReadonly = false;
            this.paymentFromDialog = false;
        },

        osValorTotalFromForm(): number {
            const itens =
                (this.osFormRef()?.getFieldValue("itens") as
                    OrdemServicoItemFormRow[] | undefined) ??
                this.dialogItem.itens ??
                [];

            return itens.reduce((sum, item) => {
                const qty = Number(item.quantidade);
                const obra = parseMoneyInput(item.valorObra) ?? 0;
                const pecas = parseMoneyInput(item.valorPecas) ?? 0;
                const quantidade = Number.isFinite(qty) && qty > 0 ? qty : 0;

                return sum + quantidade * (obra + pecas);
            }, 0);
        },

        mapPagamentosToFormRows(
            pagamentos: Array<{ id?: number; tipo: string; valor: number; criadoEm?: string; modificadoEm?: string }>
        ): PagamentoFormRow[] {
            return pagamentos.map((row) => ({
                id: row.id,
                tipo: row.tipo,
                valor: String(row.valor),
                criadoEm: row.criadoEm,
                modificadoEm: row.modificadoEm
            }));
        },

        pagamentosPayload(rows: PagamentoFormRow[]): Array<{ id?: number; tipo: string; valor: number }> {
            return rows.map((row) => ({
                ...(row.id != null ? { id: row.id } : {}),
                tipo: row.tipo,
                valor: Number(row.valor)
            }));
        },

        openDialogOsPagamentos() {
            this.paymentReadonly = this.dialogMode === "view";
            this.paymentFromDialog = true;
            this.paymentModalRows = [...this.dialogPagamentos];
            this.paymentValorTotal = this.osValorTotalFromForm();
            this.paymentOsId = this.dialogItem.id ?? null;
            this.paymentModalOpen = true;
        },

        async openOsPagamentos(id: number) {
            try {
                const response = await this.$http.get<ItemResponse<OrdemServicoApi>>(
                    `/api/ordem-servico/${id}`
                );
                const os = response.data.data;
                const valorRegistro = os.registroEntradaSaida?.valor;
                const valorTotal = Number.isFinite(Number(valorRegistro))
                    ? Number(valorRegistro)
                    : Number(os.total ?? 0);

                this.paymentFromDialog = false;
                this.paymentReadonly = false;
                this.paymentOsId = id;
                this.paymentValorTotal = Number.isFinite(valorTotal) ? valorTotal : 0;
                this.paymentModalRows = (os.pagamentos ?? []).map((row) => ({
                    id: row.id,
                    tipo: row.tipo,
                    valor: String(row.valor),
                    criadoEm: row.criadoEm,
                    modificadoEm: row.modificadoEm
                }));
                this.paymentModalOpen = true;
            } catch (error) {
                notifyHttpError(this.$toast, error, "Não foi possível carregar os pagamentos.");
            }
        },

        async onSaveOsPagamentos(pagamentos: Array<{ id?: number; tipo: string; valor: number }>) {
            if (this.paymentFromDialog && !this.paymentOsId) {
                this.dialogPagamentos = this.mapPagamentosToFormRows(pagamentos);
                this.onPaymentModalCancel();
                this.$toast.success("Pagamentos atualizados na ordem de serviço.");

                return;
            }

            const id = this.paymentOsId;

            if (!id) {
                return;
            }

            this.paymentSaving = true;

            try {
                await this.$http.put(`/api/ordem-servico/${id}`, {
                    pagamentos
                });
                this.$toast.success("Pagamentos salvos.");

                if (this.paymentFromDialog && this.dialogOpen && this.dialogItem.id === id) {
                    this.dialogPagamentos = this.mapPagamentosToFormRows(pagamentos);
                }

                this.onPaymentModalCancel();
                await this.getOrdens();
            } catch (error) {
                notifyHttpError(this.$toast, error, "Não foi possível salvar os pagamentos.");
            } finally {
                this.paymentSaving = false;
            }
        },

        async onDelete(item: Record<string, unknown>) {
            const id = Number(item.id);

            if (!Number.isInteger(id) || id <= 0) {
                this.$toast.error("Ordem de serviço inválida.");
                return;
            }

            try {
                await this.$http.delete(`/api/ordem-servico/${id}`);
                this.$toast.success("Ordem de serviço excluída.");
                await this.getOrdens();
            } catch (error) {
                notifyHttpError(this.$toast, error, "Não foi possível excluir a ordem de serviço.");
            }
        },

        onClienteAction() {
            if (this.dialogMode === "view") {
                return;
            }

            this.clienteDialogKey += 1;
            this.clienteItem = emptyClienteForm();
            this.clienteSaving = false;
            this.clienteDialogOpen = true;
        },

        closeVeiculoDialog() {
            this.veiculoDialogOpen = false;
            this.veiculoSaving = false;
        },

        onVeiculoAction() {
            if (this.dialogMode === "view") {
                return;
            }

            const documento = this.currentClienteDocumento();

            if (!documento) {
                this.$toast.error("Selecione um cliente antes de cadastrar o veículo.");
                return;
            }

            this.veiculoDialogKey += 1;
            this.veiculoItem = emptyVeiculoForm(documento);
            this.veiculoSaving = false;
            this.veiculoDialogOpen = true;
        },

        async onSearchServicos(query: string) {
            this.servicoSearchSeq += 1;
            const seq = this.servicoSearchSeq;
            const trimmed = query.trim();

            if (!trimmed) {
                this.servicoSuggestions = [];
                return;
            }

            try {
                const searchQuery = toQueryString({
                    limit: 15,
                    nome: trimmed
                });
                const response = await this.$http.get<ListResponse<ServicoApi>>(
                    `/api/servico?${searchQuery}`
                );

                if (seq !== this.servicoSearchSeq) {
                    return;
                }

                this.servicoSuggestions = response.data.data ?? [];
            } catch {
                if (seq !== this.servicoSearchSeq) {
                    return;
                }

                this.servicoSuggestions = [];
            }
        },

        async onSaveVeiculo(payload: Record<string, unknown>) {
            this.veiculoSaving = true;

            try {
                const documento = documentDigits(
                    payload.clienteDocumento ?? this.currentClienteDocumento()
                );
                const response = await this.$http.post<ItemResponse<VeiculoApi>>("/api/veiculo", {
                    clienteDocumento: documento,
                    modelo: payload.modelo,
                    placa: payload.placa,
                    tipo: payload.tipo || undefined,
                    chassi: payload.chassi || undefined,
                    kilometragem:
                        payload.kilometragem === "" || payload.kilometragem == null
                            ? undefined
                            : Number(payload.kilometragem),
                    dataTrocaOleo: payload.dataTrocaOleo || undefined
                });
                const created = response.data.data;

                if (!created) {
                    this.$toast.error("Não foi possível criar o veículo.");
                    return;
                }

                this.veiculos = [...this.veiculos, created];
                this.formVeiculos = withSelectedItem(this.formVeiculos, created, (veiculo) =>
                    String(veiculo.id)
                );
                await this.$nextTick();
                this.osFormRef()?.setFieldValue("veiculoId", String(created.id));
                this.closeVeiculoDialog();
                this.$toast.success("Veículo criado.");
            } catch (error) {
                notifyHttpError(
                    this.$toast,
                    error,
                    "Não foi possível criar o veículo.",
                    this.veiculoDialogRef()
                );
            } finally {
                this.veiculoSaving = false;
            }
        },

        itensPayload(itens: OrdemServicoItemFormRow[]) {
            return itens.map((item) => {
                const obra = parseMoneyInput(item.valorObra) ?? 0;
                const pecas = parseMoneyInput(item.valorPecas);

                return {
                    servicoId: item.servicoId,
                    servicoNome: item.servicoId ? undefined : item.servicoNome.trim(),
                    quantidade: Number(item.quantidade),
                    valorObra: obra,
                    valorPecas: pecas == null || pecas === 0 ? null : pecas
                };
            });
        },

        onSearchExternal(payload: { id: string; field: string; value: string }) {
            if (payload.id === "clienteDocumento") {
                void this.searchFormClientes(payload.value, payload.field || "nome");
                return;
            }

            if (payload.id === "veiculoId") {
                void this.searchFormVeiculos(payload.value, payload.field || "modelo");
            }
        },

        onClienteChange(documento: string) {
            void this.searchFormVeiculos("", "modelo", documento);
        },

        currentClienteDocumento(): string {
            return documentDigits(
                this.osFormRef()?.getFieldValue("clienteDocumento") ??
                    this.dialogItem.clienteDocumento
            );
        },

        async searchFormClientes(query: string, field: string) {
            this.clienteSearchSeq += 1;
            const seq = this.clienteSearchSeq;

            try {
                const trimmed = query.trim();
                const searchQuery = toQueryString({
                    limit: 100,
                    ativo: "ativo,inativo",
                    ...(trimmed && field ? { [field]: trimmed } : {})
                });
                const response = await this.$http.get<ListResponse<ClienteApi>>(
                    `/api/cliente?${searchQuery}`
                );

                if (seq !== this.clienteSearchSeq) {
                    return;
                }

                const selectedDocumento = this.currentClienteDocumento();
                const selected =
                    this.formClientes.find((cliente) => cliente.documento === selectedDocumento) ||
                    this.clientes.find((cliente) => cliente.documento === selectedDocumento);

                this.formClientes = withSelectedItem(
                    response.data.data ?? [],
                    selected,
                    (cliente) => cliente.documento
                );
            } catch (error) {
                notifyHttpError(this.$toast, error, "Não foi possível carregar os clientes.");
            }
        },

        async searchFormVeiculos(query: string, field: string, clienteDocumento?: string) {
            const documento = documentDigits(clienteDocumento ?? this.currentClienteDocumento());

            if (!documento) {
                this.formVeiculos = [];
                return;
            }

            this.veiculoSearchSeq += 1;
            const seq = this.veiculoSearchSeq;

            try {
                const trimmed = query.trim();
                const searchQuery = toQueryString({
                    limit: 100,
                    clienteDocumento: documento,
                    ...(trimmed && field ? { [field]: trimmed } : {})
                });
                const response = await this.$http.get<ListResponse<VeiculoApi>>(
                    `/api/veiculo?${searchQuery}`
                );

                if (seq !== this.veiculoSearchSeq) {
                    return;
                }

                const selectedId = String(
                    this.osFormRef()?.getFieldValue("veiculoId") ?? this.dialogItem.veiculoId ?? ""
                );
                const selected =
                    this.formVeiculos.find((veiculo) => String(veiculo.id) === selectedId) ||
                    this.veiculos.find((veiculo) => String(veiculo.id) === selectedId);
                const selectedForClient =
                    selected && selected.clienteDocumento === documento ? selected : undefined;

                this.formVeiculos = withSelectedItem(
                    response.data.data ?? [],
                    selectedForClient,
                    (veiculo) => String(veiculo.id)
                );
            } catch (error) {
                notifyHttpError(this.$toast, error, "Não foi possível carregar os veículos.");
            }
        },

        async onSaveCliente(payload: Record<string, unknown>) {
            this.clienteSaving = true;

            try {
                const response = await this.$http.post<ItemResponse<ClienteApi>>("/api/cliente", {
                    documento: payload.documento,
                    nome: payload.nome,
                    nomeSocial: clienteNomeSocialForSave(
                        payload.documento,
                        payload.nomeSocial,
                        true
                    ),
                    email: payload.email || undefined,
                    cel: payload.cel || undefined,
                    obs: payload.obs || undefined
                });
                const created = response.data.data;

                if (!created) {
                    this.$toast.error("Não foi possível criar o cliente.");
                    return;
                }

                this.clientes = [...this.clientes, created];
                this.formClientes = withSelectedItem(
                    this.formClientes,
                    created,
                    (cliente) => cliente.documento
                );
                await this.$nextTick();
                this.osFormRef()?.setFieldValue("clienteDocumento", created.documento);
                this.closeClienteDialog();
                this.$toast.success("Cliente criado.");
                void this.searchFormVeiculos("", "modelo", created.documento);
            } catch (error) {
                notifyHttpError(
                    this.$toast,
                    error,
                    "Não foi possível criar o cliente.",
                    this.clienteDialogRef()
                );
            } finally {
                this.clienteSaving = false;
            }
        },

        async onSave(payload: OrdemServicoFormValues) {
            this.dialogSaving = true;

            try {
                const body: Record<string, unknown> = {
                    clienteDocumento: documentDigits(payload.clienteDocumento),
                    veiculoId: Number(payload.veiculoId),
                    statusOsId: Number(payload.statusOsId),
                    diagnosticoCliente: payload.diagnosticoCliente || undefined,
                    diagnosticoMecanico: payload.diagnosticoMecanico || undefined,
                    obs: payload.obs || undefined,
                    dataInicio: payload.dataInicio || undefined,
                    dataConclusao: payload.dataConclusao || undefined,
                    itens: this.itensPayload(payload.itens)
                };

                if (this.dialogMode === "create" && this.dialogPagamentos.length > 0) {
                    body.pagamentos = this.pagamentosPayload(this.dialogPagamentos);
                }

                if (this.dialogMode === "create") {
                    await this.$http.post("/api/ordem-servico", body);
                    this.$toast.success("Ordem de serviço criada.");
                } else {
                    const id = Number(this.dialogItem.id);

                    await this.$http.put(`/api/ordem-servico/${id}`, body);
                    this.$toast.success("Ordem de serviço atualizada.");
                }

                this.closeDialog();
                await this.getOrdens();
            } catch (error) {
                notifyHttpError(this.$toast, error, "Não foi possível salvar a ordem de serviço.");

                if (error instanceof HttpError) {
                    this.osFormRef()?.applyFieldErrors(fieldErrorsFromHttp(error));
                }
            } finally {
                this.dialogSaving = false;
            }
        }
    }
});
</script>
