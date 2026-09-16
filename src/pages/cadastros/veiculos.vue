<template>
    <CrudListPage
        title="Veículos"
        :filters="veiculoFilters"
        :loading="loadingVeiculos"
        :headers="tableHeaders"
        :rows="tableRows"
        :page-count="pageCount"
        pagination-id="pagination-veiculos"
        :pagination-key="filters || 'all'"
        delete-name-field="modelo"

        @create="onCreate"
        @filters="onFilters"
        @reload="getVeiculos"
        @page="onPage"
        @action="onRowAction"
        @delete="onDelete"
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
    documentDigits,
    listQuery,
    notifyHttpError,
    pageCountFromTotal,
    withSelectedItem,
    type DialogMode,
    type ItemResponse,
    type ItemViewEditExpose,
    type ListResponse
} from "../../js/crudHttp";

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
            veiculoFilters: [
                { type: "input", value: "modelo", label: "Modelo", default: true },
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
            ] as FilterDef[],
            tableHeaders: [
                { label: "Modelo", field: "modelo", position: "start" },
                { label: "Placa", field: "placa", position: "start" },
                { label: "Cliente", field: "clienteNome", position: "start" }
            ] as TableHeader[],
            veiculos: [] as VeiculoApi[],
            clientes: [] as ClienteApi[],
            formClientes: [] as ClienteApi[],
            loadingVeiculos: false,
            dialogOpen: false,
            dialogSaving: false,
            dialogMode: "view" as DialogMode,
            dialogItem: emptyVeiculoForm() as VeiculoFormValues,
            dialogKey: 0,
            clienteSearchSeq: 0,
            page: 1,
            pageLimit: 10,
            pageCount: 0
        };
    },

    computed: {
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
                label: `${cliente.nome} · ${cliente.documento}`,
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
            return veiculoFormFields({
                isCreate: this.dialogMode === "create",
                clienteOptions: this.clienteOptions,
                showCliente: true
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

        closeDialog() {
            this.dialogOpen = false;
            this.dialogSaving = false;
        },

        onFilters(values: FilterValues) {
            this.page = 1;
            this.filters = toQueryString(values);
            void this.getVeiculos();
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
                }
            } catch (error) {
                notifyHttpError(this.$toast, error, "Não foi possível carregar os clientes.");
            }
        },

        async getVeiculos() {
            try {
                this.loadingVeiculos = true;

                const query = listQuery(this.filters, this.page, this.pageLimit);
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

        openDialog(mode: DialogMode, item: VeiculoFormValues, cliente?: ClienteApi) {
            this.dialogKey += 1;
            this.dialogMode = mode;
            this.dialogItem = item;
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
                    tipo: payload.tipo || undefined,
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
