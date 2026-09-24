<template>
    <CrudListPage
        ref="listPage"

        title="Clientes"
        :filters="clienteFilters"
        :loading="loadingClientes"
        :headers="tableHeaders"
        :rows="tableRows"
        :actions="rowActions"
        :page-count="pageCount"
        pagination-id="pagination-clientes"
        :pagination-key="filters || 'all'"
        delete-name-field="nome"
        :show-create="canCreate"
        :show-export="canExport"
        :exporting="exporting"
        empty-title="Nenhum cliente encontrado."
        empty-description="Ajuste os filtros ou cadastre um novo cliente."

        @create="onCreate"
        @close-create="closeDialog"
        @filters="onFilters"
        @reload="getClientes"
        @page="onPage"
        @action="onRowAction"
        @delete="onDelete"
        @export="onExport"
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
            @click:select-action="onClienteSelectAction"
            @click:select-option="onClienteChipClick"
            @click:select-remove="onClienteChipRemove"
            @search:external="onEnderecoSearchExternal"
        >
            <template
                v-if="dialogMode !== 'view'"
                #select-inside-empty-panel="{ field }"
            >
                <Button
                    v-if="field.id === 'enderecoIds'"

                    type="button"
                    variant="outline"
                    left-icon="fa-plus"
                    label="Cadastrar endereço"

                    @click="onClienteSelectInsideEmptyPanel('enderecoIds')"
                />

                <Button
                    v-else-if="field.id === 'veiculoIds'"

                    type="button"
                    variant="outline"
                    left-icon="fa-plus"
                    label="Cadastrar veículo"

                    @click="onClienteSelectInsideEmptyPanel('veiculoIds')"
                />
            </template>

            <template
                v-if="dialogMode === 'view'"
                #aboveCriadoModificado
            >
                <section
                    class="mt-4 border-t border-border pt-2"
                    aria-labelledby="cliente-ordens-servico-heading"
                >
                    <h4
                        id="cliente-ordens-servico-heading"
                        class="mb-2"
                    >
                        Ordens de serviço
                    </h4>

                    <p
                        v-if="clienteOrdensLoading"

                        class="text-sm text-muted-foreground"
                    >
                        Carregando ordens de serviço…
                    </p>

                    <p
                        v-else-if="clienteOrdens.length === 0"

                        class="text-sm text-muted-foreground"
                    >
                        Nenhuma ordem de serviço para este cliente.
                    </p>

                    <div
                        v-else

                        class="flex flex-col gap-2"
                    >
                        <Button
                            v-for="os in clienteOrdens"
                            :key="os.id"

                            :label="clienteOrdemRowLabel(os)"

                            @click="openClienteOsView(os.id)"
                        />
                    </div>
                </section>
            </template>
        </ItemViewEdit>

        <Modal
            ref="clienteOsModal"

            :is-open="clienteOsDialogOpen"
            size="extra-large"

            @update:value="onClienteOsDialogOpenChange"
        >
            <template #header>
                {{ clienteOsDialogHeader }}
            </template>

            <template #body>
                <OrdemServicoForm
                    v-if="clienteOsDialogOpen"
                    :key="clienteOsDialogKey"
                    ref="clienteOsForm"

                    :form-id="clienteOsFormId"
                    mode="view"
                    :values="clienteOsDialogItem"
                    :cliente-options="clienteOsClienteOptions"
                    :veiculo-options="clienteOsVeiculoOptions"
                    :funcionario-options="clienteOsFuncionarioOptions"
                    :status-options="clienteOsStatusOptions"
                    :servico-suggestions="[]"
                    pagamentos-button-label="Ver pagamentos"
                    :pagamentos="clienteOsDialogPagamentos"

                    @click:pagamentos="openClienteOsPagamentos"
                />
            </template>

            <template #footer>
                <div class="flex flex-wrap justify-end gap-2">
                    <Button
                        variant="primary"
                        type="button"

                        @click="closeClienteOsDialog"
                    >
                        Fechar
                    </Button>
                </div>
            </template>
        </Modal>

        <PagamentosModal
            v-model:is-open="clienteOsPaymentModalOpen"
            :saving="false"
            :valor-total="clienteOsPaymentValorTotal"
            :rows="clienteOsPaymentRows"
            readonly

            @cancel="onClienteOsPaymentModalCancel"
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
import Button from "@design/components/Button.vue";
import type { FilterDef, FilterValues } from "../../components/FilterInputs.vue";
import ItemViewEdit from "../../components/ItemViewEdit.vue";
import CrudListPage, { type TableHeader } from "../../components/CrudListPage.vue";
import PagamentosModal from "../../components/PagamentosModal.vue";
import OrdemServicoForm, {
    emptyOrdemServicoFormValues,
    type OrdemServicoFormValues,
    type VeiculoSelectOption
} from "../../components/OrdemServicoForm.vue";
import type { PagamentoFormRow } from "../../js/pagamentoOptions";
import type { OrdemServicoItemFormRow } from "../../components/OrdemServicoItensSection.vue";
import { toOsForm, type OrdemServicoApi } from "../../js/ordemServicoFormMap";
import { formatTableLabel } from "../../js/formatTableLabel";
import { osStatusIndicator } from "../../js/osStatusBadge";
import { parseMoneyInput } from "@shared/format/moneyInput";
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
    CRUD_ROW_ACTIONS,
    documentDigits,
    fetchAllList,
    listQuery,
    notifyHttpError,
    pageCountFromTotal,
    type DialogMode,
    type ItemResponse,
    type ItemViewEditExpose,
    type ListResponse,
    withSelectedItem
} from "../../js/crudHttp";
import {
    currentCanCreate,
    currentCanDelete,
    currentCanExport,
    currentCanSeePii
} from "../../js/mecarvit";
import { downloadTablePdf } from "../../js/exportTablePdf";

interface StatusOsApi {
    id: number;
    nome: string;
}

interface UsuarioApi {
    cpf: string;
    nome: string;
}

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
        Button,
        CrudListPage,
        ItemViewEdit,
        OrdemServicoForm,
        PagamentosModal
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
            tableHeadersBase: [
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
            dialogOriginalItem: emptyClienteForm() as ClienteFormValues,
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
            pageCount: 0,
            clienteOrdens: [] as OrdemServicoApi[],
            clienteOrdensLoading: false,
            clienteOrdensSeq: 0,
            osStatusList: [] as StatusOsApi[],
            clienteOsFormId: "cliente-os-form",
            clienteOsDialogOpen: false,
            clienteOsDialogKey: 0,
            clienteOsDialogItem: emptyOrdemServicoFormValues() as OrdemServicoFormValues,
            clienteOsDialogPagamentos: [] as PagamentoFormRow[],
            clienteOsFormFuncionarios: [] as UsuarioApi[],
            clienteOsPaymentModalOpen: false,
            clienteOsPaymentRows: [] as PagamentoFormRow[],
            clienteOsPaymentValorTotal: 0,
            exporting: false
        };
    },

    computed: {
        canCreate(): boolean {
            return currentCanCreate("clientes");
        },

        canExport(): boolean {
            return currentCanExport("clientes");
        },

        canSeePii(): boolean {
            return currentCanSeePii("clientes");
        },

        tableHeaders(): TableHeader[] {
            if (this.canSeePii) {
                return this.tableHeadersBase;
            }

            return this.tableHeadersBase.filter((header) => header.field !== "documento");
        },

        rowActions() {
            if (currentCanDelete("clientes")) {
                return CRUD_ROW_ACTIONS;
            }

            return CRUD_ROW_ACTIONS.filter((action) => action.value !== "delete" && !action.separator);
        },

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
            const fields = clienteFormFields({
                isCreate: this.dialogMode === "create",
                isView: this.dialogMode === "view",
                documento: this.dialogItem.documento,
                enderecoOptions: this.enderecoOptions,
                veiculoOptions: this.veiculoOptions,
                includeVehicles: true
            });

            if (this.dialogMode === "create" || this.canSeePii) {
                return fields;
            }

            return fields.filter((field) => field.id !== "documento");
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
        },

        osStatusNameById(): Record<number, string> {
            const map: Record<number, string> = {};

            for (const status of this.osStatusList) {
                map[status.id] = status.nome;
            }

            return map;
        },

        clienteOsDialogHeader(): string {
            if (this.clienteOsDialogItem.id) {
                return `OS #${this.clienteOsDialogItem.id}`;
            }

            return "Ordem de serviço";
        },

        clienteOsClienteOptions() {
            const documento = documentDigits(this.dialogItem.documento);

            if (!documento) {
                return [];
            }

            return [
                {
                    label: this.dialogItem.nome || documento,
                    value: documento,
                    cel: this.dialogItem.cel ?? ""
                }
            ];
        },

        clienteOsVeiculoOptions(): VeiculoSelectOption[] {
            return this.dialogVehicles.map((veiculo) => ({
                label: `${veiculo.modelo} · ${veiculo.placa}`,
                value: String(veiculo.id),
                clienteDocumento:
                    veiculo.clienteDocumento ?? documentDigits(this.dialogItem.documento),
                modelo: veiculo.modelo,
                placa: veiculo.placa,
                kilometragem:
                    veiculo.kilometragem != null && veiculo.kilometragem !== 0
                        ? String(veiculo.kilometragem)
                        : "",
                tipo: veiculo.tipo ?? ""
            }));
        },

        clienteOsFuncionarioOptions() {
            return this.clienteOsFormFuncionarios.map((usuario) => ({
                label: usuario.nome,
                value: documentDigits(usuario.cpf)
            }));
        },

        clienteOsStatusOptions() {
            return this.osStatusList.map((status) => ({
                label: formatTableLabel(status.nome),
                value: String(status.id),
                indicator: osStatusIndicator(status.id)
            }));
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
            this.clienteOrdens = [];
            this.clienteOrdensLoading = false;
            this.clienteOrdensSeq += 1;
            this.closeClienteOsDialog();
            this.closeVeiculoDialog();
            this.closeEnderecoDialog();
            void this.$refs.listPage?.clearCadastrarQuery?.();
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

        clienteOrdemRowLabel(os: OrdemServicoApi): string {
            const veiculo = this.dialogVehicles.find((entry) => entry.id === os.veiculoId);
            const veiculoLabel = veiculo
                ? `${veiculo.modelo} · ${veiculo.placa}`
                : `Veículo #${os.veiculoId}`;
            const statusName = os.status?.nome ?? this.osStatusNameById[os.statusOsId] ?? "—";

            return `OS #${os.id} · ${formatTableLabel(statusName)} · ${veiculoLabel}`;
        },

        async ensureOsStatusLoaded() {
            if (this.osStatusList.length > 0) {
                return;
            }

            try {
                const response = await this.$http.get<ListResponse<StatusOsApi>>(
                    "/api/status-os?limit=100"
                );
                this.osStatusList = response.data.data ?? [];
            } catch (error) {
                notifyHttpError(this.$toast, error, "Não foi possível carregar os status da OS.");
            }
        },

        async loadClienteOrdens(documento: string) {
            this.clienteOrdensSeq += 1;
            const seq = this.clienteOrdensSeq;
            this.clienteOrdensLoading = true;
            this.clienteOrdens = [];

            try {
                const query = toQueryString({
                    cliente: documento,
                    limit: 50,
                    sort: "-id"
                });
                const response = await this.$http.get<ListResponse<OrdemServicoApi>>(
                    `/api/ordem-servico?${query}`
                );

                if (seq !== this.clienteOrdensSeq) {
                    return;
                }

                this.clienteOrdens = response.data.data ?? [];
            } catch (error) {
                if (seq !== this.clienteOrdensSeq) {
                    return;
                }

                notifyHttpError(
                    this.$toast,
                    error,
                    "Não foi possível carregar as ordens de serviço do cliente."
                );
                this.clienteOrdens = [];
            } finally {
                if (seq === this.clienteOrdensSeq) {
                    this.clienteOrdensLoading = false;
                }
            }
        },

        closeClienteOsDialog() {
            this.clienteOsDialogOpen = false;
            this.clienteOsDialogPagamentos = [];
            this.clienteOsFormFuncionarios = [];
            this.onClienteOsPaymentModalCancel();
        },

        onClienteOsDialogOpenChange(open: boolean) {
            this.clienteOsDialogOpen = open;

            if (!open) {
                this.closeClienteOsDialog();
            }
        },

        clienteOsFormRef(): { getFieldValue: (fieldId: string) => unknown } | undefined {
            return this.$refs.clienteOsForm as
                { getFieldValue: (fieldId: string) => unknown } | undefined;
        },

        clienteOsValorTotalFromForm(): number {
            const itens =
                (this.clienteOsFormRef()?.getFieldValue("itens") as
                    OrdemServicoItemFormRow[] | undefined) ??
                this.clienteOsDialogItem.itens ??
                [];

            return itens.reduce((sum, item) => {
                const qty = Number(item.quantidade);
                const valor = parseMoneyInput(item.valor) ?? 0;
                const quantidade = Number.isFinite(qty) && qty > 0 ? qty : 0;

                return sum + quantidade * valor;
            }, 0);
        },

        openClienteOsPagamentos() {
            this.clienteOsPaymentRows = [...this.clienteOsDialogPagamentos];
            this.clienteOsPaymentValorTotal = this.clienteOsValorTotalFromForm();
            this.clienteOsPaymentModalOpen = true;
        },

        onClienteOsPaymentModalCancel() {
            this.clienteOsPaymentModalOpen = false;
            this.clienteOsPaymentRows = [];
            this.clienteOsPaymentValorTotal = 0;
        },

        async ensureClienteOsFuncionariosForCpfs(cpfs: string[]) {
            for (const rawCpf of cpfs) {
                const cpf = documentDigits(rawCpf);

                if (!cpf) {
                    continue;
                }

                const exists = this.clienteOsFormFuncionarios.some(
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

                    this.clienteOsFormFuncionarios = withSelectedItem(
                        this.clienteOsFormFuncionarios,
                        usuario,
                        (entry) => documentDigits(entry.cpf)
                    );
                } catch {
                    // Responsável pode ter sido desativado; mantém só o CPF no formulário.
                }
            }
        },

        async openClienteOsView(osId: number) {
            if (!Number.isInteger(osId) || osId <= 0) {
                return;
            }

            try {
                const response = await this.$http.get<ItemResponse<OrdemServicoApi>>(
                    `/api/ordem-servico/${osId}`
                );
                const os = response.data.data;
                const veiculo = this.dialogVehicles.find((entry) => entry.id === os.veiculoId);

                this.clienteOsDialogKey += 1;
                this.clienteOsDialogItem = toOsForm(
                    os,
                    {
                        nome: this.dialogItem.nome,
                        cel: this.dialogItem.cel
                    },
                    veiculo
                );
                this.clienteOsDialogPagamentos = (os.pagamentos ?? []).map((row) => ({
                    id: row.id,
                    tipo: row.tipo,
                    valor: String(row.valor),
                    criadoEm: row.criadoEm,
                    modificadoEm: row.modificadoEm
                }));
                this.clienteOsFormFuncionarios = [];

                await this.ensureClienteOsFuncionariosForCpfs(
                    this.clienteOsDialogItem.responsaveisCpfs ?? []
                );

                this.clienteOsDialogOpen = true;
            } catch (error) {
                notifyHttpError(
                    this.$toast,
                    error,
                    "Não foi possível carregar a ordem de serviço."
                );
            }
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

        async onExport() {
            this.exporting = true;

            try {
                const rows = await fetchAllList<ClienteApi>(
                    this.$http.get.bind(this.$http),
                    "/api/cliente",
                    this.filters
                );
                downloadTablePdf(
                    "Clientes",
                    this.tableHeaders,
                    rows as unknown as Array<Record<string, unknown>>
                );
            } catch (error) {
                notifyHttpError(this.$toast, error, "Não foi possível exportar a tabela.");
            } finally {
                this.exporting = false;
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
            this.dialogOriginalItem = JSON.parse(JSON.stringify(item));
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

                if (mode === "view") {
                    await this.ensureOsStatusLoaded();
                    await this.loadClienteOrdens(documento);
                } else {
                    this.clienteOrdens = [];
                    this.clienteOrdensLoading = false;
                    this.clienteOrdensSeq += 1;
                }
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

            this.onClienteSelectInsideEmptyPanel(payload.id);
        },

        onClienteSelectInsideEmptyPanel(fieldId: string) {
            if (this.dialogMode === "view") {
                return;
            }

            this.itemDialog()?.closeSelect(fieldId);

            if (fieldId === "veiculoIds") {
                this.openVeiculoCreateDialog();
                return;
            }

            if (fieldId === "enderecoIds") {
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
