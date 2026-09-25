<template>
    <CrudListPage
        ref="listPage"
        title="Veículos"
        :filters="veiculoFilters"
        :loading="loadingVeiculos"
        :headers="tableHeaders"
        :rows="tableRows"
        :actions="rowActions"
        :page-count="pageCount"
        pagination-id="pagination-veiculos"
        :pagination-key="filters || 'all'"
        delete-name-field="modelo"
        :filter-select-options="filterSelectOptions"
        :filter-select-search-loading="filterSelectSearchLoading"
        :show-create="canCreate"
        :show-export="canExport"
        :exporting="exporting"
        empty-title="Nenhum veículo encontrado."
        empty-description="Ajuste os filtros ou cadastre um novo veículo."

        @create="onCreate"
        @close-create="closeDialog"
        @filters="onFilters"
        @reload="getVeiculos"
        @page="onPage"
        @action="onRowAction"
        @delete="onDelete"
        @search:external="onFilterSearch"
        @export="onExport"
        @sort="onSort"
    >
        <ItemViewEdit
            ref="itemDialog"
            v-model:is-open="dialogOpen"
            :header="dialogHeader"
            :mode="dialogMode"
            :item="dialogItem"
            :fields="dialogFields"
            :saving="dialogSaving"
            :form-key="dialogKey"

            @save="onSave"
            @cancel="closeDialog"
            @update:mode="onDialogModeChange"
            @search:external="onSearchExternal"
        />
    </CrudListPage>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { toQueryString } from "@shared/frontend/queryString";
import type { FilterDef, FilterValues } from "../../components/FilterInputs.vue";
import ItemViewEdit from "../../components/ItemViewEdit.vue";
import CrudListPage, { type TableHeader } from "../../components/CrudListPage.vue";
import {
    veiculoFormFields,
    emptyVeiculoFormExtras,
    veiculoExtrasFromApi,
    veiculoOptionalFields
} from "../../js/entityFields";
import {
    CRUD_ROW_ACTIONS,
    documentDigits,
    fetchAllList,
    listQuery,
    notifyHttpError,
    pageCountFromTotal,
    withSelectedItem,
    type DialogMode,
    type ItemResponse,
    type CrudListPageExpose,
    type ItemViewEditExpose,
    type ListResponse
} from "../../js/crudHttp";
import { toSortQuery, type SortFieldPayload } from "../../js/sortTableRows";
import { currentCanCreate, currentCanDelete, currentCanExport } from "../../js/mecarvit";
import { downloadTablePdf } from "../../js/exportTablePdf";

interface ClienteApi {
    documento: string;
    nome: string;
}

interface VeiculoApi {
    id: number;
    criadoEm?: string;
    modificadoEm?: string;
    modelo: string;
    placa: string;
    tipo?: string | null;
    chassi?: string | null;
    kilometragem?: number | null;
    dataTrocaOleo?: string | number | null;
    ativo?: boolean;
    clienteDocumento: string;
    cliente?: ClienteApi | null;
}

interface VeiculoFormValues {
    id?: number;
    criadoEm?: string;
    modificadoEm?: string;
    modelo: string;
    placa: string;
    tipo: string;
    chassi: string;
    kilometragem: string;
    dataTrocaOleo: string;
    clienteDocumento: string;
    ativo: boolean;
}

function emptyVeiculoForm(): VeiculoFormValues {
    return {
        modelo: "",
        placa: "",
        tipo: "",
        ...emptyVeiculoFormExtras(),
        clienteDocumento: "",
        ativo: true
    };
}

function toVeiculoForm(veiculo: VeiculoApi): VeiculoFormValues {
    return {
        id: veiculo.id,
        criadoEm: veiculo.criadoEm ?? "",
        modificadoEm: veiculo.modificadoEm ?? "",
        modelo: veiculo.modelo ?? "",
        placa: veiculo.placa ?? "",
        tipo: veiculo.tipo ?? "",
        ...veiculoExtrasFromApi(veiculo),
        clienteDocumento: veiculo.clienteDocumento ?? "",
        ativo: veiculo.ativo !== false
    };
}

export default defineComponent({
    name: "MecarvitVeiculosPage",

    components: {
        CrudListPage,
        ItemViewEdit
    },

    data() {
        return {
            filters: "",
            tableHeaders: [
                { label: "Modelo", field: "modelo", position: "start", canSort: true },
                { label: "Placa", field: "placa", position: "start", canSort: true },
                { label: "Cliente", field: "clienteNome", position: "start", canSort: true }
            ] as TableHeader[],
            veiculos: [] as VeiculoApi[],
            clientes: [] as ClienteApi[],
            formClientes: [] as ClienteApi[],
            filterClienteOptions: [] as Array<{ label: string; value: string }>,
            filterClienteSearchSeq: 0,
            filterClienteSearchLoading: false,
            clienteSearchLoading: false,
            loadingVeiculos: false,
            dialogOpen: false,
            dialogSaving: false,
            dialogMode: "view" as DialogMode,
            dialogItem: emptyVeiculoForm() as VeiculoFormValues,
            dialogOriginalItem: emptyVeiculoForm() as VeiculoFormValues,
            dialogKey: 0,
            clienteSearchSeq: 0,
            page: 1,
            sort: "",
            pageLimit: 10,
            pageCount: 0,
            exporting: false
        };
    },

    computed: {
        canCreate(): boolean {
            return currentCanCreate("veiculos");
        },

        canExport(): boolean {
            return currentCanExport("veiculos");
        },

        rowActions() {
            if (currentCanDelete("veiculos")) {
                return CRUD_ROW_ACTIONS;
            }

            return CRUD_ROW_ACTIONS.filter((action) => action.value !== "delete" && !action.separator);
        },
        veiculoFilters(): FilterDef[] {
            return [
                {
                    type: "select",
                    value: "clienteDocumento",
                    label: "Cliente",
                    default: true,
                    search: { external: true, field: "nome" }
                },
                { type: "input", value: "modelo", label: "Modelo" },
                { type: "input", value: "placa", label: "Placa" },
                {
                    type: "option",
                    value: "ativo",
                    label: "Status",
                    options: [
                        { label: "Todos", value: "ativo,inativo", default: true },
                        { label: "Ativo", value: "ativo" },
                        { label: "Inativo", value: "inativo" }
                    ]
                }
            ];
        },

        filterSelectOptions(): Record<string, Array<{ label: string; value: string }>> {
            return {
                clienteDocumento: this.filterClienteOptions
            };
        },

        filterSelectSearchLoading(): Record<string, boolean> {
            return {
                clienteDocumento: this.filterClienteSearchLoading
            };
        },

        clienteNameByDocumento(): Record<string, string> {
            const map: Record<string, string> = {};

            for (const cliente of this.clientes) {
                map[cliente.documento] = cliente.nome;
            }

            return map;
        },

        tableRows() {
            return this.veiculos.map((veiculo) => ({
                ...veiculo,
                clienteNome:
                    veiculo.cliente?.nome
                    || this.clienteNameByDocumento[veiculo.clienteDocumento]
                    || veiculo.clienteDocumento
            }));
        },

        clienteOptions() {
            return this.formClientes.map((cliente) => ({
                label: cliente.nome,
                value: cliente.documento
            }));
        },

        dialogHeader(): string {
            if (this.dialogMode === "create") {
                return "Novo veículo";
            }

            return this.dialogItem.modelo || "Veículo";
        },

        dialogFields() {
            const fields = veiculoFormFields({
                isCreate: this.dialogMode === "create",
                clienteOptions: this.clienteOptions,
                showCliente: true
            });

            return fields.map((field) => {
                if (field.id !== "clienteDocumento") {
                    return field;
                }

                return {
                    ...field,
                    selectSearchLoading: this.clienteSearchLoading
                };
            });
        }
    },

    mounted() {
        void this.getClientes();
    },

    methods: {
        itemDialog(): ItemViewEditExpose | undefined {
            return this.$refs.itemDialog as ItemViewEditExpose | undefined;
        },

        listPage(): CrudListPageExpose | undefined {
            return this.$refs.listPage as CrudListPageExpose | undefined;
        },

        closeDialog() {
            this.dialogOpen = false;
            this.dialogSaving = false;
            void this.listPage()?.clearCadastrarQuery?.();
        },

        onDialogModeChange(mode: DialogMode) {
            if (this.dialogMode === "view" && mode === "edit") {
                this.dialogOriginalItem = JSON.parse(JSON.stringify(this.dialogItem));
            }

            if (this.dialogMode === "edit" && mode === "view") {
                this.dialogItem = JSON.parse(JSON.stringify(this.dialogOriginalItem));
                this.dialogKey += 1;
            }

            this.dialogMode = mode;
        },

        
        onSort(payload: SortFieldPayload) {
            this.page = 1;
            this.sort = toSortQuery(payload);
            void this.getVeiculos();
        },

        onFilters(values: FilterValues) {
            this.page = 1;
            this.filters = toQueryString(values);
            void this.getVeiculos();
        },

        onFilterSearch(payload: { filterKey: string; field: string; value: string }) {
            if (payload.filterKey === "clienteDocumento") {
                void this.searchFilterClientes(payload.value, payload.field || "nome");
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

        syncFilterClienteOptionsFromList(clientes: ClienteApi[]) {
            this.filterClienteOptions = clientes.map((cliente) => ({
                label: cliente.nome,
                value: cliente.documento
            }));
        },

        onPage(page: number) {
            if (page === this.page) {
                return;
            }

            this.page = page;
            void this.getVeiculos();
        },

        async getClientes(query = "", field = "nome") {
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

                const results = response.data.data ?? [];
                const selectedDocumento = documentDigits(
                    this.itemDialog()?.getFieldValue("clienteDocumento")
                    ?? this.dialogItem.clienteDocumento
                );
                const selected = this.formClientes.find(
                    (cliente) => cliente.documento === selectedDocumento
                ) || this.clientes.find(
                    (cliente) => cliente.documento === selectedDocumento
                );

                this.formClientes = withSelectedItem(
                    results,
                    selected,
                    (cliente) => cliente.documento
                );

                if (!trimmed) {
                    this.clientes = results;
                    this.syncFilterClienteOptionsFromList(results);
                }
            } catch (error) {
                notifyHttpError(this.$toast, error, "Não foi possível carregar os clientes.");
            } finally {
                if (seq === this.clienteSearchSeq) {
                    this.clienteSearchLoading = false;
                }
            }
        },

        async getVeiculos() {
            try {
                this.loadingVeiculos = true;

                const query = listQuery(this.filters, this.page, this.pageLimit, this.sort);
                const response = await this.$http.get<ListResponse<VeiculoApi>>(
                    `/api/veiculo?${query}`
                );

                this.pageCount = pageCountFromTotal(
                    response.data.total,
                    response.data.limit,
                    this.pageLimit
                );
                this.veiculos = response.data.data ?? [];
            } catch (error) {
                notifyHttpError(this.$toast, error, "Não foi possível carregar os veículos.");
                this.veiculos = [];
                this.pageCount = 0;
            } finally {
                this.loadingVeiculos = false;
            }
        },

        async onExport() {
            this.exporting = true;

            try {
                const rows = await fetchAllList<VeiculoApi>(
                    this.$http.get.bind(this.$http),
                    "/api/veiculo",
                    this.filters,
                    this.sort
                );
                const mapped = rows.map((veiculo) => ({
                    ...veiculo,
                    clienteNome:
                        veiculo.cliente?.nome
                        || this.clienteNameByDocumento[veiculo.clienteDocumento]
                        || veiculo.clienteDocumento
                }));
                downloadTablePdf("Veículos", this.tableHeaders, mapped);
            } catch (error) {
                notifyHttpError(this.$toast, error, "Não foi possível exportar a tabela.");
            } finally {
                this.exporting = false;
            }
        },

        openDialog(mode: DialogMode, item: VeiculoFormValues, cliente?: ClienteApi) {
            this.dialogKey += 1;
            this.dialogMode = mode;
            this.dialogItem = item;
            this.dialogOriginalItem = JSON.parse(JSON.stringify(item));
            this.dialogSaving = false;
            this.dialogOpen = true;

            if (cliente) {
                this.formClientes = withSelectedItem(
                    this.formClientes,
                    cliente,
                    (entry) => entry.documento
                );
            }
        },

        onCreate() {
            this.openDialog("create", emptyVeiculoForm());
        },

        async openVeiculoDialog(mode: "view" | "edit", row: Record<string, unknown>) {
            const id = Number(row.id);

            if (!Number.isInteger(id) || id <= 0) {
                this.$toast.error("Veículo inválido.");
                return;
            }

            try {
                const response = await this.$http.get<ItemResponse<VeiculoApi>>(`/api/veiculo/${id}`);

                const veiculo = response.data.data;
                const cliente = veiculo.cliente ?? this.formClientes.find(
                    (entry) => entry.documento === veiculo.clienteDocumento
                ) ?? this.clientes.find(
                    (entry) => entry.documento === veiculo.clienteDocumento
                );

                this.openDialog(
                    mode,
                    toVeiculoForm(veiculo),
                    cliente ?? (veiculo.clienteDocumento
                        ? {
                            documento: veiculo.clienteDocumento,
                            nome: veiculo.clienteDocumento
                        }
                        : undefined)
                );
            } catch (error) {
                notifyHttpError(this.$toast, error, "Não foi possível carregar o veículo.");
            }
        },

        onRowAction(value: string, item: Record<string, unknown>) {
            if (value === "inspect") {
                void this.openVeiculoDialog("view", item);
            } else if (value === "edit") {
                void this.openVeiculoDialog("edit", item);
            }
        },

        onSearchExternal(payload: { id: string; field: string; value: string }) {
            if (payload.id !== "clienteDocumento") {
                return;
            }

            void this.getClientes(payload.value, payload.field || "nome");
        },

        async onDelete(item: Record<string, unknown>) {
            const id = Number(item.id);

            if (!Number.isInteger(id) || id <= 0) {
                this.$toast.error("Veículo inválido.");
                return;
            }

            try {
                await this.$http.delete(`/api/veiculo/${id}`);
                this.$toast.success("Veículo excluído.");
                await this.getVeiculos();
            } catch (error) {
                notifyHttpError(this.$toast, error, "Não foi possível excluir o veículo.");
            }
        },

        async onSave(payload: Record<string, unknown>) {
            this.dialogSaving = true;

            try {
                const body = {
                    modelo: payload.modelo,
                    placa: payload.placa,
                    clienteDocumento: documentDigits(payload.clienteDocumento),
                    ...veiculoOptionalFields(payload, {
                        clearEmpty: this.dialogMode !== "create"
                    })
                };

                if (this.dialogMode === "create") {
                    await this.$http.post("/api/veiculo", body);
                    this.$toast.success("Veículo criado.");
                } else {
                    const id = Number(this.dialogItem.id);

                    await this.$http.put(`/api/veiculo/${id}`, {
                        ...body,
                        ativo: Boolean(payload.ativo)
                    });
                    this.$toast.success("Veículo atualizado.");
                }

                this.closeDialog();
                await this.getVeiculos();
            } catch (error) {
                notifyHttpError(
                    this.$toast,
                    error,
                    "Não foi possível salvar o veículo.",
                    this.itemDialog()
                );
            } finally {
                this.dialogSaving = false;
            }
        }
    }
});
</script>
