<template>
    <CrudListPage
        ref="listPage"

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
        :filter-select-search-loading="filterSelectSearchLoading"
        :show-export="canExport"
        :exporting="exporting"
        empty-title="Nenhuma ordem de serviço encontrada."
        empty-description="Ajuste os filtros ou cadastre uma nova ordem de serviço."

        @create="onCreate"
        @close-create="closeDialog"
        @filters="onFilters"
        @search:external="onFilterSearch"
        @reload="getOrdens"
        @page="onPage"
        @action="onRowAction"
        @delete="onDelete"
        @export="onExport"
        @sort="onSort"
    >
        <template
            v-if="canCreate"
            #headerActions
        >
            <div class="flex flex-wrap gap-2">
                <Button
                    label="Cadastrar"
                    left-icon="fa-plus"

                    @click="onCreate"
                />

                <Button
                    label="Fazer orçamento"
                    variant="secondary"
                    left-icon="fa-file-invoice"

                    @click="onCreateOrcamento"
                />
            </div>
        </template>
        <Modal
            ref="osModal"

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
                    :funcionario-options="funcionarioSelectOptions"
                    :status-options="statusSelectOptions"
                    :servico-suggestions="servicoSuggestions"
                    :pagamentos-button-label="dialogPagamentosButtonLabel"
                    :pagamentos="dialogPagamentos"
                    :orcamento="dialogOrcamento"
                    :restricted-edit="restrictedOsEdit"
                    :can-see-cliente-pii="canSeeClientePii"
                    :can-see-pagamentos="canSeePagamentos"
                    :can-edit-itens="canEditOsItens"
                    :can-create-cliente="canCreateCliente"
                    :can-create-veiculo="canCreateVeiculo"
                    :can-edit-veiculo="canEditVeiculo"
                    :lock-cliente="dialogMode !== 'create' && !canEditCliente"
                    :can-assign-responsaveis="canAssignResponsaveis"
                    :can-edit-diagnostico-cliente="canEditDiagnosticoCliente"
                    :can-change-status="canChangeOsStatus"
                    :cliente-search-loading="clienteSearchLoading"
                    :veiculo-search-loading="veiculoSearchLoading"
                    :funcionario-search-loading="funcionarioSearchLoading"
                    :servico-search-loading="servicoSearchLoading"

                    @submit="onSave"
                    @search:external="onSearchExternal"
                    @search:servico="onSearchServicos"
                    @change:cliente="onClienteChange"
                    @click:pagamentos="openDialogOsPagamentos"
                />
            </template>

            <template #footer>
                <div class="flex flex-wrap justify-end gap-2">
                    <Button
                        v-if="canExportDialogOs"

                        v-tooltip="'Exportar esta OS para PDF'"
                        variant="secondary"
                        type="button"
                        class="mr-auto"
                        aria-label="Exportar esta OS para PDF"
                        :disabled="exportingOs || dialogSaving || paymentModalOpen"

                        @click="onExportDialogOs"
                    >
                        <span class="fa-solid fa-file-pdf text-xs" />
                        <span class="ml-2">Exportar PDF</span>
                    </Button>

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
import { formatDateBr } from "@shared/format/dateTime";
import Button from "@design/components/Button.vue";
import type { FilterDef, FilterValues } from "../../components/FilterInputs.vue";
import PagamentosModal from "../../components/PagamentosModal.vue";
import type { PagamentoFormRow } from "../../js/pagamentoOptions";
import CrudListPage, { type TableHeader } from "../../components/CrudListPage.vue";
import OrdemServicoForm, {
    emptyOrdemServicoFormValues,
    mergeOrdemServicoFormValues,
    type OrdemServicoFormValues,
    type VeiculoSelectOption
} from "../../components/OrdemServicoForm.vue";
import { clienteNomeSocialForSave, optionalTextForSave } from "../../js/entityFields";
import { digitsOnly } from "@shared/validators/mecarvit";
import { parseMoneyInput } from "@shared/format/moneyInput";
import type { OrdemServicoItemFormRow } from "../../components/OrdemServicoItensSection.vue";
import {
    toOsForm,
    osDataLimitePagamento,
    type OrdemServicoApi
} from "../../js/ordemServicoFormMap";
import {
    documentDigits,
    fetchAllList,
    fieldErrorsFromHttp,
    listQuery,
    notifyHttpError,
    pageCountFromTotal,
    withSelectedItem,
    type CrudListPageExpose,
    type DialogMode,
    type ItemResponse,
    type ListResponse
} from "../../js/crudHttp";
import { toSortQuery, type SortFieldPayload } from "../../js/sortTableRows";
import type { OptionItem } from "@design/components/internal/OptionsList.vue";
import { formatTableLabel } from "../../js/formatTableLabel";
import { osPagamentoBadge, osStatusBadge, osStatusIndicator } from "../../js/osStatusBadge";
import {
    currentCanCreate,
    currentCanDelete,
    currentCanExport,
    currentCanSeePii,
    currentHasPermission,
    currentUsuarioCpfDigits,
    currentCanManageProfile,
    excludeCurrentUsuario
} from "../../js/mecarvit";
import { PERMISSIONS } from "@shared/mecarvit/access";
import { downloadTablePdf } from "../../js/exportTablePdf";
import { downloadOsPdf } from "../../js/exportOsPdf";

const OS_STATUS_ACTION_PREFIX = "status:";

function buildOsRowActions(
    statusList: StatusOsApi[],
    options: {
        canCreate: boolean;
        canDelete: boolean;
        canSeePagamentos: boolean;
        canChangeStatus: boolean;
    }
): OptionItem[] {
    const statusOptions: OptionItem[] = statusList
        .filter((status) => status.id !== 6)
        .map((status) => ({
            label: formatTableLabel(status.nome),
            value: `${OS_STATUS_ACTION_PREFIX}${status.id}`,
            indicator: osStatusIndicator(status.id)
        }));

    const actions: OptionItem[] = [
        { label: "Visualizar", value: "inspect", icon: "fa-eye" },
        { label: "Editar", value: "edit", icon: "fa-pen" }
    ];

    if (options.canSeePagamentos) {
        actions.push({
            label: "Pagamentos",
            value: "pagamentos",
            icon: "fa-money-bill",
            tooltip: "Adicione, edite, remova pagamentos"
        });
    }

    if (options.canChangeStatus && statusOptions.length > 0) {
        actions.push({
            label: "Alterar status",
            value: "status-menu",
            icon: "fa-flag",
            options: statusOptions
        });
    }

    if (options.canDelete) {
        actions.push(
            { separator: true },
            { label: "Excluir", value: "delete", icon: "fa-trash", variant: "destructive" }
        );
    }

    return actions;
}

interface ClienteApi {
    documento: string;
    nome: string;
    cel?: string | null;
}

interface UsuarioApi {
    cpf: string;
    nome: string;
    ativo?: boolean;
}

interface VeiculoApi {
    id: number;
    modelo: string;
    placa: string;
    tipo?: string | null;
    kilometragem?: number | null;
    clienteDocumento: string;
}

interface StatusOsApi {
    id: number;
    nome: string;
}

interface ServicoApi {
    id: number;
    nome: string;
}

function emptyOsForm(defaultStatusId = "1"): OrdemServicoFormValues {
    return emptyOrdemServicoFormValues({
        defaultStatusId,
        dataInicioToday: true
    });
}

type OsFormExpose = {
    applyFieldErrors: (errors: Record<string, string>) => void;
    setFieldValue: (fieldId: string, value: unknown) => void;
    getFieldValue: (fieldId: string) => unknown;
};

type OsModalExpose = {
    scrollBodyToTop: () => void;
};

export default defineComponent({
    name: "MecarvitOrdemServicoPage",

    components: {
        Button,
        CrudListPage,
        PagamentosModal,
        OrdemServicoForm
    },

    data() {
        return {
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
                { label: "OS", field: "idLabel", position: "start", canSort: true },
                { label: "Cliente", field: "clienteNome", position: "start", canSort: true },
                { label: "Veículo", field: "veiculoLabel", position: "start", canSort: true },
                {
                    label: "Status",
                    field: "statusBadge",
                    position: "center",
                    badgeProps: { variantStyle: "bordered" },
                    canSort: true
                },
                {
                    label: "Pagamento",
                    field: "pagamentoBadge",
                    position: "center",
                    badgeProps: { variantStyle: "bordered" },
                    canSort: true
                }
            ] as TableHeader[],
            ordens: [] as OrdemServicoApi[],
            clientes: [] as ClienteApi[],
            veiculos: [] as VeiculoApi[],
            formClientes: [] as ClienteApi[],
            formVeiculos: [] as VeiculoApi[],
            formFuncionarios: [] as UsuarioApi[],
            statusOs: [] as StatusOsApi[],
            loadingOs: false,
            dialogOpen: false,
            dialogSaving: false,
            dialogMode: "view" as DialogMode,
            dialogOrcamento: false,
            dialogItem: emptyOsForm("1") as OrdemServicoFormValues,
            dialogKey: 0,
            clienteSearchSeq: 0,
            veiculoSearchSeq: 0,
            funcionarioSearchSeq: 0,
            servicoSearchSeq: 0,
            clienteSearchLoading: false,
            veiculoSearchLoading: false,
            funcionarioSearchLoading: false,
            servicoSearchLoading: false,
            filterClienteSearchLoading: false,
            filterVeiculoSearchLoading: false,
            servicoSuggestions: [] as ServicoApi[],
            filterClienteOptions: [] as Array<{ label: string; value: string }>,
            filterVeiculoOptions: [] as Array<{ label: string; value: string }>,
            filterClienteSearchSeq: 0,
            filterVeiculoSearchSeq: 0,
            page: 1,
            sort: "",
            pageLimit: 10,
            pageCount: 0,
            exporting: false,
            exportingOs: false
        };
    },

    computed: {
        canCreate(): boolean {
            return currentCanCreate("os");
        },

        canExport(): boolean {
            return currentCanExport("os");
        },

        canExportDialogOs(): boolean {
            return this.canExport && this.dialogOpen && this.dialogItem.id != null;
        },

        canSeeClientePii(): boolean {
            return currentCanSeePii("clientes");
        },

        canSeePagamentos(): boolean {
            return (
                currentHasPermission(PERMISSIONS.financeiro.editar) ||
                currentCanCreate("financeiro")
            );
        },

        filterSelectSearchLoading(): Record<string, boolean> {
            return {
                cliente: this.filterClienteSearchLoading,
                veiculo: this.filterVeiculoSearchLoading
            };
        },

        canEditOsItens(): boolean {
            return this.canCreate || currentHasPermission(PERMISSIONS.os.editar);
        },

        canCreateCliente(): boolean {
            return currentCanCreate("clientes");
        },

        canEditCliente(): boolean {
            return currentHasPermission(PERMISSIONS.clientes.editar);
        },

        canCreateVeiculo(): boolean {
            return currentCanCreate("veiculos");
        },

        canEditVeiculo(): boolean {
            return currentHasPermission(PERMISSIONS.veiculos.editar);
        },

        canAssignResponsaveis(): boolean {
            return currentHasPermission(PERMISSIONS.funcionarios.editar);
        },

        canEditDiagnosticoCliente(): boolean {
            return currentCanManageProfile() || this.dialogMode === "create";
        },

        canChangeOsStatus(): boolean {
            return currentCanManageProfile();
        },

        restrictedOsEdit(): boolean {
            return currentHasPermission(PERMISSIONS.os.editar) && !this.canCreate;
        },

        rowActions(): OptionItem[] {
            return buildOsRowActions(this.statusOs, {
                canCreate: this.canCreate,
                canDelete: currentCanDelete("os"),
                canSeePagamentos:
                    currentHasPermission(PERMISSIONS.financeiro.editar) ||
                    currentCanCreate("financeiro"),
                canChangeStatus: this.canChangeOsStatus
            });
        },

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
                    value: "pagamentoSituacao",
                    label: "Status pagamento",
                    options: [
                        { label: "Todos", value: "todos", default: true },
                        { label: "Pago", value: "pago" },
                        { label: "Não pago", value: "nao_pago" },
                        { label: "A vencer", value: "a_vencer" },
                        { label: "Atrasado", value: "atrasado" }
                    ]
                },
                ...(this.canSeePagamentos
                    ? [
                          {
                              type: "input" as const,
                              value: "dataLimitePagamento",
                              label: "Data pagamento",
                              inputType: "date" as const,
                              helperText: "Filtrar pela data de pagamento"
                          }
                      ]
                    : [])
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
            return this.ordens.map((os) => this.mapOsTableRow(os));
        },

        clienteOptions() {
            return this.formClientes.map((cliente) => ({
                label: cliente.nome,
                value: cliente.documento,
                cel: cliente.cel ?? ""
            }));
        },

        veiculoSelectOptions(): VeiculoSelectOption[] {
            return this.formVeiculos.map((veiculo) => ({
                label: `${veiculo.modelo} · ${veiculo.placa}`,
                value: String(veiculo.id),
                clienteDocumento: veiculo.clienteDocumento,
                modelo: veiculo.modelo,
                placa: veiculo.placa,
                kilometragem:
                    veiculo.kilometragem != null && veiculo.kilometragem !== 0
                        ? String(veiculo.kilometragem)
                        : "",
                tipo: veiculo.tipo ?? ""
            }));
        },

        statusSelectOptions() {
            return this.statusOs
                .filter((status) => {
                    if (status.id !== 6) {
                        return true;
                    }

                    return this.dialogOrcamento || this.dialogItem.statusOsId === "6";
                })
                .map((status) => ({
                    label: formatTableLabel(status.nome),
                    value: String(status.id),
                    indicator: osStatusIndicator(status.id)
                }));
        },

        funcionarioSelectOptions() {
            return excludeCurrentUsuario(this.formFuncionarios).map((usuario) => ({
                label: usuario.nome,
                value: documentDigits(usuario.cpf)
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
                return this.dialogOrcamento ? "Novo orçamento" : "Nova ordem de serviço";
            }

            if (this.dialogItem.id) {
                return `OS #${this.dialogItem.id}`;
            }

            return "Ordem de serviço";
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

        osModalRef(): OsModalExpose | undefined {
            return this.$refs.osModal as OsModalExpose | undefined;
        },

        scrollOsDialogToTop() {
            void this.$nextTick(() => {
                this.osModalRef()?.scrollBodyToTop();
            });
        },

        listPage(): CrudListPageExpose | undefined {
            return this.$refs.listPage as CrudListPageExpose | undefined;
        },

        closeDialog() {
            this.dialogOpen = false;
            this.dialogSaving = false;
            this.dialogPagamentos = [];
            this.dialogOrcamento = false;
            void this.listPage()?.clearCadastrarQuery?.();
        },

        onDialogOpenChange(open: boolean) {
            this.dialogOpen = open;

            if (!open) {
                void this.listPage()?.clearCadastrarQuery?.();
            }
        },

        onSort(payload: SortFieldPayload) {
            this.page = 1;
            this.sort = toSortQuery(payload);
            void this.getOrdens();
        },

        onFilters(values: FilterValues) {
            this.page = 1;

            const queryValues = { ...values };

            if (queryValues.statusOsId === "todos") {
                delete queryValues.statusOsId;
            }

            if (queryValues.pagamentoSituacao === "todos") {
                delete queryValues.pagamentoSituacao;
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
                const status = await this.$http.get<ListResponse<StatusOsApi>>(
                    "/api/status-os?limit=100"
                );
                this.statusOs = status.data.data ?? [];
            } catch (error) {
                notifyHttpError(this.$toast, error, "Não foi possível carregar os status da OS.");
            }

            const optionalGets: Array<Promise<void>> = [
                this.$http
                    .get<ListResponse<ClienteApi>>("/api/cliente?limit=100&ativo=ativo,inativo")
                    .then((response) => {
                        this.clientes = response.data.data ?? [];
                        this.formClientes = [...this.clientes];
                    })
                    .catch(() => {
                        this.clientes = [];
                    }),
                this.$http
                    .get<ListResponse<VeiculoApi>>("/api/veiculo?limit=100")
                    .then((response) => {
                        this.veiculos = response.data.data ?? [];
                        this.formVeiculos = [...this.veiculos];
                    })
                    .catch(() => {
                        this.veiculos = [];
                    }),
                this.$http
                    .get<ListResponse<UsuarioApi>>("/api/usuario?limit=100&ativo=ativo")
                    .then((response) => {
                        this.formFuncionarios = excludeCurrentUsuario(response.data.data ?? []);
                    })
                    .catch(() => {
                        this.formFuncionarios = [];
                    })
            ];

            await Promise.all(optionalGets);
            this.syncFilterSelectOptionsFromLookups();
        },

        syncFilterSelectOptionsFromLookups() {
            this.filterClienteOptions = this.clientes.map((cliente) => ({
                label: cliente.nome,
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
            this.filterClienteSearchLoading = true;

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
                    label: cliente.nome,
                    value: cliente.documento
                }));
            } catch {
                if (seq !== this.filterClienteSearchSeq) {
                    return;
                }

                this.filterClienteOptions = [];
            } finally {
                if (seq === this.filterClienteSearchSeq) {
                    this.filterClienteSearchLoading = false;
                }
            }
        },

        async searchFilterVeiculos(query: string, field: string) {
            this.filterVeiculoSearchSeq += 1;
            const seq = this.filterVeiculoSearchSeq;
            this.filterVeiculoSearchLoading = true;

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
            } finally {
                if (seq === this.filterVeiculoSearchSeq) {
                    this.filterVeiculoSearchLoading = false;
                }
            }
        },

        async getOrdens() {
            try {
                this.loadingOs = true;

                const query = listQuery(this.filters, this.page, this.pageLimit, this.sort);
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

        mapOsTableRow(os: OrdemServicoApi) {
            const veiculo = this.veiculoById[os.veiculoId] ?? os.veiculo;

            return {
                ...os,
                idLabel: `#${os.id}`,
                clienteNome:
                    this.clienteNameByDocumento[os.clienteDocumento] ||
                    os.clienteNome ||
                    os.cliente?.nome ||
                    os.clienteDocumento,
                veiculoLabel: veiculo
                    ? `${veiculo.modelo} · ${veiculo.placa}`
                    : String(os.veiculoId),
                statusBadge: osStatusBadge(
                    os.statusOsId,
                    os.status?.nome || this.statusNameById[os.statusOsId] || "—"
                ),
                pagamentoBadge:
                    os.statusOsId === 6
                        ? { badge: { label: "—", color: "slate-500" } }
                        : osPagamentoBadge(
                              os.pagamentoSituacao ?? undefined,
                              this.canSeePagamentos ? formatDateBr(osDataLimitePagamento(os)) : ""
                          )
            };
        },

        async onExport() {
            this.exporting = true;

            try {
                const rows = await fetchAllList<OrdemServicoApi>(
                    this.$http.get.bind(this.$http),
                    "/api/ordem-servico",
                    this.filters,
                    this.sort
                );
                downloadTablePdf(
                    "Ordens de serviço",
                    this.tableHeaders,
                    rows.map((os) => this.mapOsTableRow(os))
                );
            } catch (error) {
                notifyHttpError(this.$toast, error, "Não foi possível exportar a tabela.");
            } finally {
                this.exporting = false;
            }
        },

        dialogValuesForExport(): OrdemServicoFormValues {
            const form = this.osFormRef();

            if (!form) {
                return this.dialogItem;
            }

            const keys: Array<keyof OrdemServicoFormValues> = [
                "id",
                "clienteDocumento",
                "clienteNome",
                "clienteCel",
                "veiculoId",
                "veiculoModelo",
                "veiculoPlaca",
                "veiculoKilometragem",
                "veiculoTipo",
                "statusOsId",
                "dataInicio",
                "dataConclusao",
                "dataLimitePagamento",
                "diagnosticoCliente",
                "diagnosticoMecanico",
                "obs",
                "responsaveisCpfs",
                "itens",
                "criadoEm",
                "modificadoEm"
            ];
            const patch: Partial<OrdemServicoFormValues> = { ...this.dialogItem };

            for (const key of keys) {
                const value = form.getFieldValue(key);

                if (value !== undefined) {
                    (patch as Record<string, unknown>)[key] = value;
                }
            }

            return mergeOrdemServicoFormValues(patch);
        },

        onExportDialogOs() {
            if (!this.canExportDialogOs || this.exportingOs) {
                return;
            }

            this.exportingOs = true;

            try {
                const values = this.dialogValuesForExport();
                const statusId = Number(values.statusOsId);
                const statusLabel =
                    this.statusNameById[statusId] ||
                    this.statusOs.find((entry) => entry.id === statusId)?.nome ||
                    String(values.statusOsId || "—");
                const responsaveisLabels = (values.responsaveisCpfs ?? [])
                    .map((cpf) => {
                        const digits = documentDigits(cpf);
                        const found = this.formFuncionarios.find(
                            (usuario) => documentDigits(usuario.cpf) === digits
                        );

                        return found?.nome || digits;
                    })
                    .filter(Boolean);

                downloadOsPdf({
                    values,
                    statusLabel,
                    responsaveisLabels,
                    pagamentos: this.dialogPagamentos,
                    includeClientePii: this.canSeeClientePii,
                    includePagamentos: this.canSeePagamentos && statusId !== 6
                });
            } catch (error) {
                notifyHttpError(this.$toast, error, "Não foi possível exportar a OS.");
            } finally {
                this.exportingOs = false;
            }
        },

        async openDialog(
            mode: DialogMode,
            item: OrdemServicoFormValues,
            pagamentos: PagamentoFormRow[] = []
        ) {
            await this.ensureFormFuncionariosForCpfs(
                this.restrictedOsEdit ? [] : (item.responsaveisCpfs ?? [])
            );

            this.dialogKey += 1;
            this.dialogMode = mode;
            this.dialogItem = item;
            this.dialogPagamentos = pagamentos;
            this.dialogOrcamento = mode === "create" && item.statusOsId === "6";
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

            this.scrollOsDialogToTop();
        },

        onCreate() {
            const defaultStatus = this.statusOs[0]?.id;

            this.openDialog(
                "create",
                emptyOsForm(defaultStatus != null ? String(defaultStatus) : "1")
            );
        },

        onCreateOrcamento() {
            this.openDialog("create", emptyOsForm("6"));
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
                const cliente =
                    this.clientes.find((entry) => entry.documento === os.clienteDocumento) ??
                    this.formClientes.find((entry) => entry.documento === os.clienteDocumento);
                const veiculo =
                    this.veiculos.find((entry) => entry.id === os.veiculoId) ??
                    this.formVeiculos.find((entry) => entry.id === os.veiculoId);

                await this.openDialog(
                    mode,
                    toOsForm(os, cliente, veiculo),
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
            if (value.startsWith(OS_STATUS_ACTION_PREFIX)) {
                const statusOsId = Number(value.slice(OS_STATUS_ACTION_PREFIX.length));
                const osId = Number(item.id);
                const currentStatusId = Number(item.statusOsId);

                if (
                    !Number.isInteger(osId) ||
                    osId <= 0 ||
                    !Number.isInteger(statusOsId) ||
                    statusOsId <= 0
                ) {
                    return;
                }

                void this.quickChangeOsStatus(osId, statusOsId, currentStatusId);

                return;
            }

            if (value === "inspect") {
                void this.openOsDialog("view", item);
            } else if (value === "edit") {
                void this.openOsDialog("edit", item);
            } else if (value === "pagamentos") {
                if (!this.canSeePagamentos) {
                    return;
                }

                const id = Number(item.id);

                if (!Number.isInteger(id) || id <= 0) {
                    return;
                }

                void this.openOsPagamentos(id);
            }
        },

        async quickChangeOsStatus(osId: number, statusOsId: number, currentStatusId: number) {
            if (!this.canChangeOsStatus || statusOsId === currentStatusId) {
                return;
            }

            const statusName = formatTableLabel(this.statusNameById[statusOsId] ?? "Status");

            try {
                await this.$http.patch<ItemResponse<OrdemServicoApi>>(
                    `/api/ordem-servico/${osId}`,
                    {
                        statusOsId
                    }
                );
                this.$toast.success(`Status alterado para ${statusName}.`);
                await this.getOrdens();

                if (this.dialogOpen && Number(this.dialogItem.id) === osId) {
                    const response = await this.$http.get<ItemResponse<OrdemServicoApi>>(
                        `/api/ordem-servico/${osId}`
                    );
                    const os = response.data.data;
                    const cliente = this.clientes.find(
                        (entry) => entry.documento === os.clienteDocumento
                    );
                    const veiculo = this.veiculos.find((entry) => entry.id === os.veiculoId);

                    this.dialogItem = toOsForm(os, cliente, veiculo);
                }
            } catch (error) {
                notifyHttpError(this.$toast, error, "Não foi possível alterar o status da OS.");
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
                const valor = parseMoneyInput(item.valor) ?? 0;
                const quantidade = Number.isFinite(qty) && qty > 0 ? qty : 0;

                return sum + quantidade * valor;
            }, 0);
        },

        mapPagamentosToFormRows(
            pagamentos: Array<{
                id?: number;
                tipo: string;
                valor: number;
                criadoEm?: string;
                modificadoEm?: string;
            }>
        ): PagamentoFormRow[] {
            return pagamentos.map((row) => ({
                id: row.id,
                tipo: row.tipo,
                valor: String(row.valor),
                criadoEm: row.criadoEm,
                modificadoEm: row.modificadoEm
            }));
        },

        pagamentosPayload(
            rows: PagamentoFormRow[]
        ): Array<{ id?: number; tipo: string; valor: number }> {
            return rows.map((row) => ({
                ...(row.id != null ? { id: row.id } : {}),
                tipo: row.tipo,
                valor: Number(row.valor)
            }));
        },

        openDialogOsPagamentos() {
            this.paymentReadonly = this.dialogMode === "view" || this.dialogItem.statusOsId === "5";
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

        async onSearchServicos(query: string) {
            this.servicoSearchSeq += 1;
            const seq = this.servicoSearchSeq;
            const trimmed = query.trim();
            this.servicoSearchLoading = true;

            if (!trimmed) {
                this.servicoSuggestions = [];
                this.servicoSearchLoading = false;
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
            } finally {
                if (seq === this.servicoSearchSeq) {
                    this.servicoSearchLoading = false;
                }
            }
        },

        itensPayload(itens: OrdemServicoItemFormRow[]) {
            return itens.map((item) => {
                return {
                    servicoId: item.servicoId,
                    servicoNome: item.servicoId ? undefined : item.servicoNome.trim(),
                    quantidade: Number(item.quantidade),
                    valor: parseMoneyInput(item.valor) ?? 0
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
                return;
            }

            if (payload.id === "responsaveisCpfs") {
                void this.searchFormFuncionarios(payload.value, payload.field || "nome");
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

        async ensureFormFuncionariosForCpfs(cpfs: string[]) {
            for (const rawCpf of cpfs) {
                const cpf = documentDigits(rawCpf);

                if (!cpf) {
                    continue;
                }

                const exists = this.formFuncionarios.some(
                    (usuario) => documentDigits(usuario.cpf) === cpf
                );

                if (exists) {
                    continue;
                }

                try {
                    const response = await this.$http.get<ItemResponse<UsuarioApi>>(
                        `/api/usuario/${cpf}`
                    );
                    const usuario = response.data.data;

                    if (!usuario?.cpf) {
                        continue;
                    }

                    this.formFuncionarios = withSelectedItem(
                        this.formFuncionarios,
                        usuario,
                        (entry) => documentDigits(entry.cpf)
                    );
                } catch {
                    // Responsável pode ter sido desativado; mantém só o CPF no formulário.
                }
            }
        },

        async searchFormFuncionarios(query: string, field: string) {
            this.funcionarioSearchSeq += 1;
            const seq = this.funcionarioSearchSeq;
            this.funcionarioSearchLoading = true;

            const selectedCpfs =
                (this.osFormRef()?.getFieldValue("responsaveisCpfs") as string[] | undefined) ??
                this.dialogItem.responsaveisCpfs ??
                [];

            await this.ensureFormFuncionariosForCpfs(selectedCpfs);

            try {
                const trimmed = query.trim();
                const searchQuery = toQueryString({
                    limit: 100,
                    ativo: "ativo,inativo",
                    ...(trimmed && field ? { [field]: trimmed } : {})
                });
                const response = await this.$http.get<ListResponse<UsuarioApi>>(
                    `/api/usuario?${searchQuery}`
                );

                if (seq !== this.funcionarioSearchSeq) {
                    return;
                }

                let next = excludeCurrentUsuario(response.data.data ?? []);

                for (const cpf of selectedCpfs) {
                    const digits = documentDigits(cpf);
                    const selected = this.formFuncionarios.find(
                        (usuario) => documentDigits(usuario.cpf) === digits
                    );

                    if (selected) {
                        next = withSelectedItem(next, selected, (entry) =>
                            documentDigits(entry.cpf)
                        );
                    }
                }

                this.formFuncionarios = next;
            } catch (error) {
                notifyHttpError(this.$toast, error, "Não foi possível carregar os funcionários.");
            } finally {
                if (seq === this.funcionarioSearchSeq) {
                    this.funcionarioSearchLoading = false;
                }
            }
        },

        async searchFormClientes(query: string, field: string) {
            this.clienteSearchSeq += 1;
            const seq = this.clienteSearchSeq;
            this.clienteSearchLoading = true;

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
            } finally {
                if (seq === this.clienteSearchSeq) {
                    this.clienteSearchLoading = false;
                }
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
            this.veiculoSearchLoading = true;

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
            } finally {
                if (seq === this.veiculoSearchSeq) {
                    this.veiculoSearchLoading = false;
                }
            }
        },

        async resolveClienteDocumento(payload: OrdemServicoFormValues): Promise<string> {
            const existing = documentDigits(payload.clienteDocumento);

            if (existing) {
                return existing;
            }

            const nomeBusca = payload.clienteNome.trim().toLowerCase();
            const namedMatches = this.formClientes.filter(
                (cliente) => cliente.nome.trim().toLowerCase() === nomeBusca && cliente.documento
            );

            if (namedMatches.length === 1 && namedMatches[0]) {
                return documentDigits(namedMatches[0].documento);
            }

            if (!this.canCreateCliente) {
                throw new Error("Selecione um cliente existente.");
            }

            const nome = payload.clienteNome.trim();
            const documento = documentDigits(payload.clienteCpfNovo);

            const cel = String(payload.clienteCel ?? "").trim();

            const response = await this.$http.post<ItemResponse<ClienteApi>>("/api/cliente", {
                documento,
                nome,
                nomeSocial: clienteNomeSocialForSave(documento, "", true),
                cel: cel || undefined
            });
            const created = response.data.data;

            if (!created?.documento) {
                throw new Error("Cliente não criado");
            }

            this.clientes = [...this.clientes, created];
            this.formClientes = withSelectedItem(
                this.formClientes,
                created,
                (cliente) => cliente.documento
            );

            return documentDigits(created.documento);
        },

        async syncClienteCelIfNeeded(documento: string, cel: string): Promise<void> {
            const doc = documentDigits(documento);
            const nextDigits = digitsOnly(String(cel ?? ""));

            let prevDigits = "";

            try {
                const response = await this.$http.get<ItemResponse<ClienteApi>>(
                    `/api/cliente/${doc}`
                );
                prevDigits = digitsOnly(String(response.data.data?.cel ?? ""));
            } catch {
                const cliente =
                    this.formClientes.find((item) => item.documento === doc) ||
                    this.clientes.find((item) => item.documento === doc);

                prevDigits = digitsOnly(String(cliente?.cel ?? ""));
            }

            if (nextDigits === prevDigits) {
                return;
            }

            const response = await this.$http.patch<ItemResponse<ClienteApi>>(
                `/api/cliente/${doc}`,
                {
                    cel: nextDigits ? nextDigits : null
                }
            );
            const updated = response.data.data;

            if (!updated) {
                return;
            }

            const mergeCel = (list: ClienteApi[]): ClienteApi[] =>
                list.map((item) =>
                    item.documento === doc ? { ...item, cel: updated.cel ?? null } : item
                );

            this.clientes = mergeCel(this.clientes);
            this.formClientes = mergeCel(this.formClientes);
        },

        async resolveVeiculoId(
            payload: OrdemServicoFormValues,
            clienteDocumento: string
        ): Promise<number> {
            const existingId = Number(payload.veiculoId);

            if (Number.isInteger(existingId) && existingId > 0) {
                return existingId;
            }

            if (!this.canCreateVeiculo) {
                throw new Error("Selecione um veículo existente.");
            }

            const kilometragemRaw = payload.veiculoKilometragem.trim();
            const response = await this.$http.post<ItemResponse<VeiculoApi>>("/api/veiculo", {
                clienteDocumento,
                modelo: payload.veiculoModelo.trim(),
                placa: payload.veiculoPlaca.trim(),
                tipo: payload.veiculoTipo.trim() || undefined,
                kilometragem: kilometragemRaw === "" ? undefined : Number(kilometragemRaw)
            });
            const created = response.data.data;

            if (!created?.id) {
                throw new Error("Veículo não criado");
            }

            this.veiculos = [...this.veiculos, created];
            this.formVeiculos = withSelectedItem(this.formVeiculos, created, (veiculo) =>
                String(veiculo.id)
            );

            return created.id;
        },

        async syncVeiculoFieldsIfNeeded(
            veiculoId: number,
            payload: OrdemServicoFormValues
        ): Promise<void> {
            const id = Number(veiculoId);

            if (!Number.isInteger(id) || id <= 0) {
                return;
            }

            const veiculo =
                this.formVeiculos.find((item) => item.id === id) ||
                this.veiculos.find((item) => item.id === id);

            const nextTipo = String(payload.veiculoTipo ?? "").trim();
            const prevTipo = String(veiculo?.tipo ?? "").trim();

            const kmRaw = payload.veiculoKilometragem.trim();
            let nextKm: number | null = null;

            if (kmRaw !== "") {
                const parsed = Number(kmRaw);

                if (Number.isFinite(parsed)) {
                    nextKm = parsed;
                }
            }

            const prevKm = veiculo?.kilometragem ?? null;

            const patch: Record<string, string | number | null> = {};

            if (nextTipo !== prevTipo) {
                patch.tipo = nextTipo ? nextTipo : null;
            }

            if (nextKm !== prevKm) {
                patch.kilometragem = nextKm;
            }

            if (Object.keys(patch).length === 0) {
                return;
            }

            const response = await this.$http.patch<ItemResponse<VeiculoApi>>(
                `/api/veiculo/${id}`,
                patch
            );
            const updated = response.data.data;

            if (!updated) {
                return;
            }

            const merge = (list: VeiculoApi[]): VeiculoApi[] =>
                list.map((item) => (item.id === id ? { ...item, ...updated } : item));

            this.veiculos = merge(this.veiculos);
            this.formVeiculos = merge(this.formVeiculos);
        },

        async onSave(payload: OrdemServicoFormValues) {
            this.dialogSaving = true;

            try {
                if (this.restrictedOsEdit && this.dialogMode !== "create") {
                    const id = Number(this.dialogItem.id);

                    await this.$http.patch(`/api/ordem-servico/${id}`, {
                        diagnosticoMecanico: optionalTextForSave(
                            payload.diagnosticoMecanico,
                            false
                        ),
                        obs: optionalTextForSave(payload.obs, false),
                        itens: this.itensPayload(payload.itens)
                    });
                    this.$toast.success("Ordem de serviço atualizada.");
                    this.closeDialog();
                    await this.getOrdens();
                    return;
                }

                const clienteDocumento = await this.resolveClienteDocumento(payload);

                if (this.canCreateCliente) {
                    await this.syncClienteCelIfNeeded(clienteDocumento, payload.clienteCel);
                }

                const veiculoId = await this.resolveVeiculoId(payload, clienteDocumento);

                if (this.dialogMode !== "create" && this.canEditVeiculo) {
                    await this.syncVeiculoFieldsIfNeeded(veiculoId, payload);
                }

                const isCreate = this.dialogMode === "create";

                const body: Record<string, unknown> = {
                    clienteDocumento,
                    veiculoId,
                    statusOsId:
                        isCreate || this.canChangeOsStatus ? Number(payload.statusOsId) : undefined,
                    diagnosticoCliente: this.canEditDiagnosticoCliente
                        ? optionalTextForSave(payload.diagnosticoCliente, isCreate)
                        : undefined,
                    diagnosticoMecanico: optionalTextForSave(payload.diagnosticoMecanico, isCreate),
                    obs: optionalTextForSave(payload.obs, isCreate),
                    dataLimitePagamento: this.canSeePagamentos
                        ? optionalTextForSave(payload.dataLimitePagamento, isCreate)
                        : undefined,
                    itens: this.itensPayload(payload.itens)
                };

                if (this.canAssignResponsaveis) {
                    body.responsaveis = payload.responsaveisCpfs
                        .map((cpf) => documentDigits(cpf))
                        .filter((cpf) => Boolean(cpf) && cpf !== currentUsuarioCpfDigits());
                }

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
