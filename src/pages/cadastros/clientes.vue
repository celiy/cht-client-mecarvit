<template>
    <CrudListPage
        title="Clientes"
        :filters="clienteFilters"
        :loading="loadingClientes"
        :headers="tableHeaders"
        :rows="tableRows"
        :page-count="pageCount"
        pagination-id="pagination-clientes"
        :pagination-key="filters || 'all'"
        delete-name-field="nome"

        @create="onCreate"
        @filters="onFilters"
        @reload="getClientes"
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
            @click:select-action="onClienteSelectAction"
            @click:select-option="onClienteChipClick"
            @click:select-remove="onClienteChipRemove"
            @search:external="onEnderecoSearchExternal"
        />

        <ItemViewEdit
            ref="enderecoDialog"

            v-model:is-open="enderecoDialogOpen"
            :header="enderecoDialogHeader"
            :mode="enderecoDialogMode"
            size="small"
            :item="enderecoItem"
            :fields="enderecoFields"
            :saving="enderecoSaving"
            :form-key="enderecoDialogKey"

            @save="onSaveEndereco"
            @cancel="closeEnderecoDialog"
        />

        <ItemViewEdit
            ref="veiculoDialog"

            v-model:is-open="veiculoDialogOpen"
            :header="veiculoDialogHeader"
            :mode="veiculoDialogMode"
            size="small"
            :item="veiculoItem"
            :fields="veiculoFields"
            :saving="veiculoSaving"
            :form-key="veiculoDialogKey"

            @save="onSaveVeiculo"
            @cancel="closeVeiculoDialog"
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
    clienteFormFields,
    clienteNomeSocialForSave,
    optionalTextForSave,
    optionalPhoneForSave,
    enderecoFormFields,
    veiculoFormFields,
    emptyVeiculoFormExtras,
    veiculoExtrasFromApi,
    veiculoOptionalFields
} from "../../js/entityFields";
import { HttpError } from "@base/http";
import { enderecoOptionLabel, uniqueEnderecoIds } from "../../js/enderecoLabel";
import {
    ATIVO_FILTER_OPTIONS,
    documentDigits,
    listQuery,
    notifyHttpError,
    pageCountFromTotal,
    type DialogMode,
    type ItemResponse,
    type ItemViewEditExpose,
    type ListResponse
} from "../../js/crudHttp";

interface VeiculoApi {
    id?: number;
    criadoEm?: string;
    modificadoEm?: string;
    modelo: string;
    placa: string;
    tipo?: string | null;
    chassi?: string | null;
    kilometragem?: number | null;
    dataTrocaOleo?: string | number | null;
    ativo?: boolean;
    clienteDocumento?: string;
}

interface EnderecoApi {
    id: number;
    criadoEm?: string;
    modificadoEm?: string;
    estado: string;
    cidade: string;
    cep: string;
    bairro: string;
    rua: string;
    numero: number;
    complemento: string;
}

interface ClienteApi {
    documento: string;
    criadoEm?: string;
    modificadoEm?: string;
    nome: string;
    nomeSocial?: string | null;
    email?: string | null;
    cel?: string | null;
    obs?: string | null;
    ativo: boolean;
    veiculos?: VeiculoApi[];
    enderecos?: EnderecoApi[];
}

interface ClienteFormValues {
    documento: string;
    criadoEm?: string;
    modificadoEm?: string;
    nome: string;
    nomeSocial: string;
    email: string;
    cel: string;
    obs: string;
    ativo: boolean;
    enderecoIds: string[];
    veiculoIds: string[];
}

interface PendingVeiculo {
    id: string;
    modelo: string;
    placa: string;
    tipo: string;
    chassi: string;
    kilometragem: string;
    dataTrocaOleo: string;
}

function emptyClienteForm(): ClienteFormValues {
    return {
        documento: "",
        nome: "",
        nomeSocial: "",
        email: "",
        cel: "",
        obs: "",
        ativo: true,
        enderecoIds: [],
        veiculoIds: []
    };
}

function toClienteForm(cliente: ClienteApi): ClienteFormValues {
    const veiculos = cliente.veiculos ?? [];
    const enderecos = cliente.enderecos ?? [];

    return {
        documento: cliente.documento ?? "",
        criadoEm: cliente.criadoEm ?? "",
        modificadoEm: cliente.modificadoEm ?? "",
        nome: cliente.nome ?? "",
        nomeSocial: cliente.nomeSocial ?? "",
        email: cliente.email ?? "",
        cel: cliente.cel ?? "",
        obs: cliente.obs ?? "",
        ativo: Boolean(cliente.ativo),
        enderecoIds: enderecos.map((endereco) => String(endereco.id)).filter((id) => id !== ""),
        veiculoIds: veiculos
            .map((veiculo) => (veiculo.id != null ? String(veiculo.id) : ""))
            .filter((id) => id !== "")
    };
}

function emptyEnderecoForm() {
    return {
        estado: "",
        cidade: "",
        cep: "",
        bairro: "",
        rua: "",
        numero: "",
        complemento: ""
    };
}

function emptyVeiculoForm() {
    return {
        modelo: "",
        placa: "",
        tipo: "",
        ...emptyVeiculoFormExtras(),
        ativo: true
    };
}

export default defineComponent({
    name: "MecarvitClientesPage",

    components: {
        CrudListPage,
        ItemViewEdit
    },

    data() {
        return {
            filters: "",
            clienteFilters: [
                { type: "input", value: "nome", label: "Nome", default: true },
                {
                    type: "option",
                    value: "ativo",
                    label: "Status",
                    options: ATIVO_FILTER_OPTIONS
                },
                { type: "input", value: "documento", label: "Documento" },
                { type: "input", value: "cel", label: "Celular", inputType: "phone" }
            ] as FilterDef[],
            tableHeaders: [
                { label: "Nome", field: "nome", position: "start" },
                { label: "Documento", field: "documento", position: "start" },
                { label: "Celular", field: "cel", position: "start" }
            ] as TableHeader[],
            clientes: [] as ClienteApi[],
            loadingClientes: false,
            dialogOpen: false,
            dialogSaving: false,
            dialogMode: "view" as DialogMode,
            dialogItem: emptyClienteForm() as ClienteFormValues,
            dialogKey: 0,
            dialogVehicles: [] as VeiculoApi[],
            allEnderecos: [] as EnderecoApi[],
            enderecoSearchSeq: 0,
            enderecoDialogOpen: false,
            enderecoSaving: false,
            enderecoDialogMode: "create" as DialogMode,
            editingEnderecoId: null as string | null,
            enderecoItem: emptyEnderecoForm(),
            enderecoDialogKey: 0,
            pendingVeiculos: [] as PendingVeiculo[],
            veiculoDialogOpen: false,
            veiculoSaving: false,
            veiculoDialogMode: "create" as DialogMode,
            editingVeiculoId: null as string | null,
            veiculoItem: emptyVeiculoForm(),
            veiculoDialogKey: 0,
            pendingVeiculoSeq: 0,
            page: 1,
            pageLimit: 10,
            pageCount: 0
        };
    },

    computed: {
        tableRows() {
            return this.clientes as unknown as Array<Record<string, unknown>>;
        },

        dialogHeader(): string {
            if (this.dialogMode === "create") {
                return "Novo cliente";
            }

            return this.dialogItem.nome || "Cliente";
        },

        veiculoOptions() {
            if (this.dialogMode === "create") {
                return this.pendingVeiculos.map((veiculo) => ({
                    label: `${veiculo.modelo} · ${veiculo.placa}`,
                    value: veiculo.id
                }));
            }

            return this.dialogVehicles.map((veiculo) => ({
                label: `${veiculo.modelo} · ${veiculo.placa}`,
                value: String(veiculo.id)
            }));
        },

        enderecoOptions() {
            return this.allEnderecos.map((endereco) => ({
                label: enderecoOptionLabel(endereco),
                value: String(endereco.id)
            }));
        },

        dialogFields() {
            return clienteFormFields({
                isCreate: this.dialogMode === "create",
                isView: this.dialogMode === "view",
                documento: this.dialogItem.documento,
                enderecoOptions: this.enderecoOptions,
                veiculoOptions: this.veiculoOptions,
                includeVehicles: true
            });
        },

        enderecoFields() {
            return enderecoFormFields();
        },

        enderecoDialogHeader(): string {
            if (this.enderecoDialogMode === "create") {
                return "Novo endereço";
            }

            return this.enderecoDialogMode === "view" ? "Endereço" : "Editar endereço";
        },

        veiculoDialogHeader(): string {
            if (this.veiculoDialogMode === "create") {
                return "Novo veículo";
            }

            const modelo = String(this.veiculoItem.modelo ?? "").trim();

            if (modelo) {
                return modelo;
            }

            return this.veiculoDialogMode === "view" ? "Veículo" : "Editar veículo";
        },

        veiculoFields() {
            const editingPending = Boolean(
                this.editingVeiculoId && this.editingVeiculoId.startsWith("new:")
            );

            return veiculoFormFields({
                isCreate: this.veiculoDialogMode === "create" || editingPending,
                clienteOptions: [],
                showCliente: false
            });
        }
    },

    mounted() {
        void this.loadAllEnderecos();
    },

    methods: {
        itemDialog(): ItemViewEditExpose | undefined {
            return this.$refs.itemDialog as ItemViewEditExpose | undefined;
        },

        veiculoDialogRef(): ItemViewEditExpose | undefined {
            return this.$refs.veiculoDialog as ItemViewEditExpose | undefined;
        },

        enderecoDialogRef(): ItemViewEditExpose | undefined {
            return this.$refs.enderecoDialog as ItemViewEditExpose | undefined;
        },

        closeDialog() {
            this.dialogOpen = false;
            this.dialogSaving = false;
            this.closeVeiculoDialog();
            this.closeEnderecoDialog();
        },

        closeEnderecoDialog() {
            this.enderecoDialogOpen = false;
            this.enderecoSaving = false;
            this.editingEnderecoId = null;
        },

        closeVeiculoDialog() {
            this.veiculoDialogOpen = false;
            this.veiculoSaving = false;
            this.editingVeiculoId = null;
        },

        onFilters(values: FilterValues) {
            this.page = 1;
            this.filters = toQueryString(values);
            void this.getClientes();
        },

        onPage(page: number) {
            if (page === this.page) {
                return;
            }

            this.page = page;
            void this.getClientes();
        },

        async getClientes() {
            try {
                this.loadingClientes = true;

                const query = listQuery(this.filters, this.page, this.pageLimit);
                const response = await this.$http.get<ListResponse<ClienteApi>>(
                    `/api/cliente?${query}`
                );

                this.pageCount = pageCountFromTotal(
                    response.data.total,
                    response.data.limit,
                    this.pageLimit
                );
                this.clientes = response.data.data ?? [];
            } catch (error) {
                notifyHttpError(this.$toast, error, "Não foi possível carregar os clientes.");
                this.clientes = [];
                this.pageCount = 0;
            } finally {
                this.loadingClientes = false;
            }
        },

        mergeEnderecosIntoCatalog(enderecos: EnderecoApi[]) {
            const byId = new Map(this.allEnderecos.map((entry) => [entry.id, entry]));

            for (const endereco of enderecos) {
                byId.set(endereco.id, endereco);
            }

            this.allEnderecos = [...byId.values()].sort((left, right) => left.id - right.id);
        },

        enderecosWithSelectedInList(results: EnderecoApi[]): EnderecoApi[] {
            const byId = new Map(results.map((entry) => [entry.id, entry]));

            for (const id of this.selectedEnderecoIds()) {
                const numericId = Number(id);

                if (!Number.isInteger(numericId) || numericId <= 0) {
                    continue;
                }

                if (byId.has(numericId)) {
                    continue;
                }

                const fromCatalog = this.enderecoFromCatalog(id);

                if (fromCatalog) {
                    byId.set(fromCatalog.id, fromCatalog);
                }
            }

            return [...byId.values()].sort((left, right) => left.id - right.id);
        },

        async searchEnderecos(query = "", field = "rua") {
            this.enderecoSearchSeq += 1;
            const seq = this.enderecoSearchSeq;

            try {
                const trimmed = query.trim();
                const searchQuery = toQueryString({
                    limit: 100,
                    sort: "id",
                    ...(trimmed && field ? { [field]: trimmed } : {})
                });
                const response = await this.$http.get<ListResponse<EnderecoApi>>(
                    `/api/endereco?${searchQuery}`
                );

                if (seq !== this.enderecoSearchSeq) {
                    return;
                }

                this.allEnderecos = this.enderecosWithSelectedInList(response.data.data ?? []);
            } catch (error) {
                if (seq !== this.enderecoSearchSeq) {
                    return;
                }

                notifyHttpError(this.$toast, error, "Não foi possível buscar endereços.");
            }
        },

        loadAllEnderecos() {
            return this.searchEnderecos("", "rua");
        },

        onEnderecoSearchExternal(payload: { id: string; field: string; value: string }) {
            if (payload.id !== "enderecoIds") {
                return;
            }

            void this.searchEnderecos(payload.value, payload.field || "rua");
        },

        openDialog(mode: DialogMode, item: ClienteFormValues, veiculos: VeiculoApi[] = []) {
            this.dialogKey += 1;
            this.dialogMode = mode;
            this.dialogItem = item;
            this.dialogVehicles = veiculos;
            this.dialogSaving = false;
            this.dialogOpen = true;
        },

        onCreate() {
            this.pendingVeiculos = [];
            this.pendingVeiculoSeq = 0;
            void this.loadAllEnderecos();
            this.openDialog("create", emptyClienteForm(), []);
        },

        async openClienteDialog(mode: "view" | "edit", row: Record<string, unknown>) {
            const documento = documentDigits(row.documento);

            if (!documento) {
                this.$toast.error("Documento do cliente é inválido.");
                return;
            }

            try {
                const response = await this.$http.get<ItemResponse<ClienteApi>>(
                    `/api/cliente/${documento}`
                );
                const cliente = response.data.data;

                this.pendingVeiculos = [];
                this.mergeEnderecosIntoCatalog(cliente.enderecos ?? []);
                this.openDialog(mode, toClienteForm(cliente), cliente.veiculos ?? []);
            } catch (error) {
                notifyHttpError(this.$toast, error, "Não foi possível carregar o cliente.");
            }
        },

        onRowAction(value: string, item: Record<string, unknown>) {
            if (value === "inspect") {
                void this.openClienteDialog("view", item);
            } else if (value === "edit") {
                void this.openClienteDialog("edit", item);
            }
        },

        async onDelete(item: Record<string, unknown>) {
            const documento = documentDigits(item.documento);

            if (!documento) {
                this.$toast.error("Documento do cliente é inválido.");
                return;
            }

            try {
                await this.$http.delete(`/api/cliente/${documento}`);
                this.$toast.success("Cliente excluído.");
                await this.getClientes();
            } catch (error) {
                notifyHttpError(this.$toast, error, "Não foi possível excluir o cliente.");
            }
        },

        selectedVeiculoIds(): string[] {
            const current = this.itemDialog()?.getFieldValue("veiculoIds");

            if (!Array.isArray(current)) {
                return [];
            }

            return current.map((item) => String(item));
        },

        setSelectedVeiculoIds(ids: string[]) {
            this.itemDialog()?.setFieldValue("veiculoIds", [...ids]);
        },

        appendSelectedVeiculoId(id: string) {
            const ids = this.selectedVeiculoIds();

            if (!ids.includes(id)) {
                ids.push(id);
            }

            this.setSelectedVeiculoIds(ids);
        },

        isPendingVeiculoId(id: string): boolean {
            return id.startsWith("new:");
        },

        openVeiculoCreateDialog() {
            this.veiculoDialogKey += 1;
            this.veiculoDialogMode = "create";
            this.editingVeiculoId = null;
            this.veiculoItem = emptyVeiculoForm();
            this.veiculoSaving = false;
            this.veiculoDialogOpen = true;
        },

        selectedEnderecoIds(): string[] {
            const current = this.itemDialog()?.getFieldValue("enderecoIds");

            if (!Array.isArray(current)) {
                return [];
            }

            return current.map((item) => String(item));
        },

        setSelectedEnderecoIds(ids: string[]) {
            this.itemDialog()?.setFieldValue("enderecoIds", [...ids]);
        },

        appendSelectedEnderecoId(id: string) {
            const ids = this.selectedEnderecoIds();

            if (!ids.includes(id)) {
                ids.push(id);
            }

            this.setSelectedEnderecoIds(ids);
        },

        enderecoFromCatalog(id: string): EnderecoApi | undefined {
            const numericId = Number(id);

            if (!Number.isInteger(numericId) || numericId <= 0) {
                return undefined;
            }

            return this.allEnderecos.find((entry) => entry.id === numericId);
        },

        openEnderecoCreateDialog() {
            this.enderecoDialogKey += 1;
            this.enderecoDialogMode = "create";
            this.editingEnderecoId = null;
            this.enderecoItem = emptyEnderecoForm();
            this.enderecoSaving = false;
            this.enderecoDialogOpen = true;
        },

        onClienteSelectAction(payload: { id: string }) {
            if (this.dialogMode === "view") {
                return;
            }

            if (payload.id === "veiculoIds") {
                this.openVeiculoCreateDialog();
                return;
            }

            if (payload.id === "enderecoIds") {
                this.openEnderecoCreateDialog();
            }
        },

        onClienteChipClick(payload: { id: string; value: string }) {
            if (payload.id === "veiculoIds") {
                this.onVeiculoChipClick(payload);
                return;
            }

            if (payload.id !== "enderecoIds" || !payload.value) {
                return;
            }

            void this.openEnderecoDialogById(payload.value);
        },

        async openEnderecoDialogById(id: string) {
            let found = this.enderecoFromCatalog(id);

            if (!found) {
                const numericId = Number(id);

                if (!Number.isInteger(numericId) || numericId <= 0) {
                    return;
                }

                try {
                    const response = await this.$http.get<ItemResponse<EnderecoApi>>(
                        `/api/endereco/${numericId}`
                    );
                    found = response.data.data;
                    this.mergeEnderecosIntoCatalog([found]);
                } catch (error) {
                    notifyHttpError(this.$toast, error, "Não foi possível carregar o endereço.");
                    return;
                }
            }

            this.enderecoDialogKey += 1;
            this.enderecoDialogMode = this.dialogMode === "view" ? "view" : "edit";
            this.editingEnderecoId = String(found.id);
            this.enderecoItem = {
                estado: found.estado,
                cidade: found.cidade,
                cep: found.cep,
                bairro: found.bairro,
                rua: found.rua,
                numero: String(found.numero),
                complemento: found.complemento,
                criadoEm: found.criadoEm ?? "",
                modificadoEm: found.modificadoEm ?? ""
            };
            this.enderecoDialogOpen = true;
        },

        onClienteChipRemove(payload: { id: string; value: string }) {
            if (payload.id === "veiculoIds") {
                void this.onVeiculoChipRemove(payload);
                return;
            }

            if (payload.id !== "enderecoIds" || this.dialogMode === "view" || !payload.value) {
                return;
            }

            const ids = this.selectedEnderecoIds().filter((id) => id !== payload.value);

            this.setSelectedEnderecoIds(ids);
        },

        enderecoPayloadFromForm(payload: Record<string, unknown>) {
            return {
                estado: String(payload.estado ?? "").trim(),
                cidade: String(payload.cidade ?? "").trim(),
                cep: String(payload.cep ?? "").trim(),
                bairro: String(payload.bairro ?? "").trim(),
                rua: String(payload.rua ?? "").trim(),
                numero: Number(payload.numero),
                complemento: String(payload.complemento ?? "").trim()
            };
        },

        async handleEnderecoDuplicateError(error: unknown): Promise<boolean> {
            if (!(error instanceof HttpError) || error.status !== 409) {
                return false;
            }

            const existingId = error.fields?.enderecoId;

            if (!existingId) {
                return false;
            }

            await this.loadAllEnderecos();
            this.appendSelectedEnderecoId(String(existingId));
            this.closeEnderecoDialog();
            this.$toast.info("Este endereço já estava cadastrado e foi selecionado.");

            return true;
        },

        async onSaveEndereco(payload: Record<string, unknown>) {
            const body = this.enderecoPayloadFromForm(payload);

            this.enderecoSaving = true;

            try {
                if (this.enderecoDialogMode === "edit" && this.editingEnderecoId) {
                    const id = Number(this.editingEnderecoId);

                    const response = await this.$http.put<ItemResponse<EnderecoApi>>(
                        `/api/endereco/${id}`,
                        body
                    );
                    const updated = response.data.data;

                    if (updated) {
                        this.mergeEnderecosIntoCatalog([updated]);
                    }

                    this.closeEnderecoDialog();
                    this.$toast.success("Endereço atualizado.");

                    return;
                }

                const response = await this.$http.post<ItemResponse<EnderecoApi>>(
                    "/api/endereco",
                    body
                );
                const created = response.data.data;

                if (!created?.id) {
                    this.$toast.error("Não foi possível criar o endereço.");
                    return;
                }

                this.mergeEnderecosIntoCatalog([created]);
                await this.$nextTick();
                this.appendSelectedEnderecoId(String(created.id));
                this.closeEnderecoDialog();
                this.$toast.success("Endereço cadastrado.");
            } catch (error) {
                if (await this.handleEnderecoDuplicateError(error)) {
                    return;
                }

                notifyHttpError(
                    this.$toast,
                    error,
                    "Não foi possível salvar o endereço.",
                    this.enderecoDialogRef()
                );
            } finally {
                this.enderecoSaving = false;
            }
        },

        openPendingVeiculoDialog(id: string) {
            const pending = this.pendingVeiculos.find((veiculo) => veiculo.id === id);

            if (!pending) {
                return;
            }

            this.veiculoDialogKey += 1;
            this.veiculoDialogMode = this.dialogMode === "view" ? "view" : "edit";
            this.editingVeiculoId = id;
            this.veiculoItem = {
                modelo: pending.modelo,
                placa: pending.placa,
                tipo: pending.tipo,
                chassi: pending.chassi,
                kilometragem: pending.kilometragem,
                dataTrocaOleo: pending.dataTrocaOleo,
                ativo: true
            };
            this.veiculoSaving = false;
            this.veiculoDialogOpen = true;
        },

        async openPersistedVeiculoDialog(id: string) {
            const numericId = Number(id);

            if (!Number.isInteger(numericId) || numericId <= 0) {
                this.$toast.error("Veículo inválido.");
                return;
            }

            try {
                const response = await this.$http.get<ItemResponse<VeiculoApi>>(
                    `/api/veiculo/${numericId}`
                );
                const veiculo = response.data.data;

                this.veiculoDialogKey += 1;
                this.veiculoDialogMode = this.dialogMode === "view" ? "view" : "edit";
                this.editingVeiculoId = id;
                this.veiculoItem = {
                    modelo: veiculo.modelo ?? "",
                    placa: veiculo.placa ?? "",
                    tipo: veiculo.tipo ?? "",
                    ...veiculoExtrasFromApi(veiculo),
                    ativo: veiculo.ativo !== false,
                    criadoEm: veiculo.criadoEm ?? "",
                    modificadoEm: veiculo.modificadoEm ?? ""
                };
                this.veiculoSaving = false;
                this.veiculoDialogOpen = true;
            } catch (error) {
                notifyHttpError(this.$toast, error, "Não foi possível carregar o veículo.");
            }
        },

        onVeiculoChipClick(payload: { id: string; value: string }) {
            if (!payload.value) {
                return;
            }

            if (this.isPendingVeiculoId(payload.value)) {
                this.openPendingVeiculoDialog(payload.value);
                return;
            }

            void this.openPersistedVeiculoDialog(payload.value);
        },

        async onVeiculoChipRemove(payload: { id: string; value: string }) {
            if (payload.id !== "veiculoIds" || this.dialogMode === "view") {
                return;
            }

            const id = payload.value;

            if (!id) {
                return;
            }

            if (this.isPendingVeiculoId(id)) {
                this.pendingVeiculos = this.pendingVeiculos.filter((veiculo) => veiculo.id !== id);
                return;
            }

            const numericId = Number(id);

            if (!Number.isInteger(numericId) || numericId <= 0) {
                return;
            }

            try {
                await this.$http.delete(`/api/veiculo/${numericId}`);
                this.dialogVehicles = this.dialogVehicles.filter(
                    (veiculo) => String(veiculo.id) !== id
                );
                this.$toast.success("Veículo excluído.");
            } catch (error) {
                this.appendSelectedVeiculoId(id);
                notifyHttpError(this.$toast, error, "Não foi possível excluir o veículo.");
            }
        },

        async onSaveVeiculo(payload: Record<string, unknown>) {
            const modelo = String(payload.modelo ?? "").trim();
            const placa = String(payload.placa ?? "")
                .trim()
                .toUpperCase();
            const tipo = String(payload.tipo ?? "").trim();
            const extras = {
                chassi: String(payload.chassi ?? "").trim(),
                kilometragem: String(payload.kilometragem ?? "").trim(),
                dataTrocaOleo: String(payload.dataTrocaOleo ?? "").trim()
            };
            const optional = veiculoOptionalFields(payload, {
                clearEmpty: this.veiculoDialogMode === "edit"
            });

            if (this.dialogMode === "create") {
                if (this.veiculoDialogMode === "edit" && this.editingVeiculoId) {
                    this.pendingVeiculos = this.pendingVeiculos.map((veiculo) => {
                        if (veiculo.id !== this.editingVeiculoId) {
                            return veiculo;
                        }

                        return {
                            ...veiculo,
                            modelo,
                            placa,
                            tipo,
                            ...extras
                        };
                    });
                    this.closeVeiculoDialog();
                    this.$toast.success("Veículo atualizado. Ele será salvo com o cliente.");
                    return;
                }

                this.pendingVeiculoSeq += 1;
                const pending: PendingVeiculo = {
                    id: `new:${this.pendingVeiculoSeq}`,
                    modelo,
                    placa,
                    tipo,
                    ...extras
                };

                this.pendingVeiculos = [...this.pendingVeiculos, pending];
                await this.$nextTick();
                this.appendSelectedVeiculoId(pending.id);
                this.closeVeiculoDialog();
                this.$toast.success("Veículo adicionado. Ele será salvo com o cliente.");
                return;
            }

            this.veiculoSaving = true;

            try {
                if (this.veiculoDialogMode === "edit" && this.editingVeiculoId) {
                    const numericId = Number(this.editingVeiculoId);
                    const response = await this.$http.put<ItemResponse<VeiculoApi>>(
                        `/api/veiculo/${numericId}`,
                        {
                            modelo,
                            placa,
                            ativo: Boolean(payload.ativo),
                            clienteDocumento: documentDigits(this.dialogItem.documento),
                            ...optional
                        }
                    );
                    const updated = response.data.data;

                    if (updated) {
                        this.dialogVehicles = this.dialogVehicles.map((veiculo) => {
                            if (String(veiculo.id) !== this.editingVeiculoId) {
                                return veiculo;
                            }

                            return updated;
                        });
                    }

                    this.closeVeiculoDialog();
                    this.$toast.success("Veículo atualizado.");
                    return;
                }

                const response = await this.$http.post<ItemResponse<VeiculoApi>>("/api/veiculo", {
                    modelo,
                    placa,
                    tipo: tipo || undefined,
                    clienteDocumento: documentDigits(this.dialogItem.documento),
                    ...optional
                });
                const created = response.data.data;

                if (!created || created.id == null) {
                    this.$toast.error("Não foi possível criar o veículo.");
                    return;
                }

                this.dialogVehicles = [...this.dialogVehicles, created];
                await this.$nextTick();
                this.appendSelectedVeiculoId(String(created.id));
                this.closeVeiculoDialog();
                this.$toast.success("Veículo criado.");
            } catch (error) {
                notifyHttpError(
                    this.$toast,
                    error,
                    "Não foi possível salvar o veículo.",
                    this.veiculoDialogRef()
                );
            } finally {
                this.veiculoSaving = false;
            }
        },

        async onSave(payload: Record<string, unknown>) {
            this.dialogSaving = true;

            try {
                if (this.dialogMode === "create") {
                    const selectedVeiculoIds = Array.isArray(payload.veiculoIds)
                        ? payload.veiculoIds.map((item) => String(item))
                        : [];
                    const enderecoIds = uniqueEnderecoIds(
                        Array.isArray(payload.enderecoIds)
                            ? payload.enderecoIds.map((item) => String(item))
                            : []
                    );

                    await this.$http.post("/api/cliente", {
                        documento: payload.documento,
                        nome: payload.nome,
                        nomeSocial: clienteNomeSocialForSave(
                            payload.documento,
                            payload.nomeSocial,
                            true
                        ),
                        email: optionalTextForSave(payload.email, true),
                        cel: optionalPhoneForSave(payload.cel, true),
                        obs: optionalTextForSave(payload.obs, true),
                        enderecoIds,
                        veiculos: this.pendingVeiculos
                            .filter((veiculo) => selectedVeiculoIds.includes(veiculo.id))
                            .map((veiculo) => ({
                                modelo: veiculo.modelo,
                                placa: veiculo.placa,
                                tipo: veiculo.tipo || undefined,
                                ...veiculoOptionalFields(veiculo, { clearEmpty: false })
                            }))
                    });

                    this.$toast.success("Cliente criado.");
                } else {
                    const documento = documentDigits(this.dialogItem.documento);

                    const enderecoIds = uniqueEnderecoIds(
                        Array.isArray(payload.enderecoIds)
                            ? payload.enderecoIds.map((item) => String(item))
                            : []
                    );

                    await this.$http.put(`/api/cliente/${documento}`, {
                        nome: payload.nome,
                        nomeSocial: clienteNomeSocialForSave(documento, payload.nomeSocial, false),
                        email: optionalTextForSave(payload.email, false),
                        cel: optionalPhoneForSave(payload.cel, false),
                        obs: optionalTextForSave(payload.obs, false),
                        ativo: Boolean(payload.ativo),
                        enderecoIds
                    });

                    this.$toast.success("Cliente atualizado.");
                }

                this.closeDialog();
                await this.getClientes();
            } catch (error) {
                notifyHttpError(
                    this.$toast,
                    error,
                    "Não foi possível salvar o cliente.",
                    this.itemDialog()
                );
            } finally {
                this.dialogSaving = false;
            }
        }
    }
});
</script>
