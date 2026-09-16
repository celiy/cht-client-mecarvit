<template>
    <CrudListPage
        title="Funcionários"
        :filters="funcionarioFilters"
        :loading="loadingFuncionarios"
        :headers="tableHeaders"
        :rows="tableRows"
        :page-count="pageCount"
        pagination-id="pagination-funcionarios"
        :pagination-key="filters || 'all'"
        delete-name-field="nome"

        @create="onCreate"
        @filters="onFilters"
        @reload="getFuncionarios"
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
            @click:select-action="onUsuarioSelectAction"
            @search:external="onSearchExternal"
        />

        <ItemViewEdit
            ref="cargoDialog"
            v-model:is-open="cargoDialogOpen"
            header="Novo cargo"
            mode="create"
            size="small"
            :item="cargoItem"
            :fields="cargoFields"
            :saving="cargoSaving"
            :form-key="cargoDialogKey"

            @save="onSaveCargo"
            @cancel="closeCargoDialog"
        />
    </CrudListPage>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import type { FormField } from "@shared/interfaces/FormField";
import { toQueryString } from "@shared/frontend/queryString";
import { PASSWORD_MIN_LENGTH } from "@shared/validators/password";
import type { FilterDef, FilterValues } from "../../components/FilterInputs.vue";
import ItemViewEdit from "../../components/ItemViewEdit.vue";
import CrudListPage, { type TableHeader } from "../../components/CrudListPage.vue";
import {
    ATIVO_FILTER_OPTIONS,
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

interface UsuarioApi {
    cpf: string;
    criadoEm?: string;
    modificadoEm?: string;
    nome: string;
    email: string;
    ativo: boolean;
    cargoId: number;
    cargoNome?: string;
}

interface CargoApi {
    id: number;
    nome: string;
    nivelAcesso?: string;
}

interface FuncionarioFormValues {
    criadoEm?: string;
    modificadoEm?: string;
    nome: string;
    email: string;
    cpf: string;
    senha: string;
    cargoId: string;
    ativo: boolean;
}

interface CargoFormValues {
    nome: string;
    nivelAcesso: string[];
}

function emptyCargoForm(): CargoFormValues {
    return {
        nome: "",
        nivelAcesso: []
    };
}

function emptyFormValues(): FuncionarioFormValues {
    return {
        nome: "",
        email: "",
        cpf: "",
        senha: "",
        cargoId: "",
        ativo: true
    };
}

function toFormValues(user: UsuarioApi): FuncionarioFormValues {
    return {
        criadoEm: user.criadoEm ?? "",
        modificadoEm: user.modificadoEm ?? "",
        nome: user.nome ?? "",
        email: user.email ?? "",
        cpf: user.cpf ?? "",
        senha: "",
        cargoId: user.cargoId != null ? String(user.cargoId) : "",
        ativo: Boolean(user.ativo)
    };
}

export default defineComponent({
    name: "MecarvitFuncionariosPage",

    components: {
        CrudListPage,
        ItemViewEdit
    },

    data() {
        return {
            filters: "",
            funcionarioFilters: [
                { type: "input", value: "nome", label: "Nome", default: true },
                {
                    type: "option",
                    value: "ativo",
                    label: "Status",
                    options: ATIVO_FILTER_OPTIONS
                },
                { type: "input", value: "cpf", label: "CPF" }
            ] as FilterDef[],
            tableHeaders: [
                { label: "Nome", field: "nome", position: "start" },
                { label: "Cargo", field: "cargoNome", position: "start" },
                { label: "CPF", field: "cpf", position: "start" }
            ] as TableHeader[],
            funcionarios: [] as UsuarioApi[],
            cargos: [] as CargoApi[],
            loadingFuncionarios: false,
            dialogOpen: false,
            dialogSaving: false,
            dialogMode: "view" as DialogMode,
            dialogItem: emptyFormValues() as FuncionarioFormValues,
            dialogKey: 0,
            cargoDialogOpen: false,
            cargoSaving: false,
            cargoItem: emptyCargoForm() as CargoFormValues,
            cargoDialogKey: 0,
            cargoSearchSeq: 0,
            page: 1,
            pageLimit: 10,
            pageCount: 0
        };
    },

    computed: {
        tableRows() {
            return this.funcionarios as unknown as Array<Record<string, unknown>>;
        },

        dialogHeader(): string {
            if (this.dialogMode === "create") {
                return "Novo funcionário";
            }

            return this.dialogItem.nome || "Funcionário";
        },

        cargoOptions() {
            return this.cargos.map((cargo) => ({
                label: cargo.nome,
                value: String(cargo.id)
            }));
        },

        dialogFields(): FormField[] {
            const isCreate = this.dialogMode === "create";
            const fields: FormField[] = [
                {
                    id: "nome",
                    label: "Nome",
                    type: "text",
                    required: true
                },
                {
                    id: "email",
                    label: "Email",
                    type: "email",
                    required: true
                },
                {
                    id: "cpf",
                    label: "CPF",
                    type: "cpf",
                    required: true,
                    readonly: !isCreate
                }
            ];

            if (isCreate) {
                fields.push({
                    id: "senha",
                    label: "Senha",
                    type: "password",
                    required: true,
                    minSize: PASSWORD_MIN_LENGTH,
                    helperText: `Mínimo de ${PASSWORD_MIN_LENGTH} caracteres`
                });
            }

            fields.push({
                id: "cargoId",
                label: "Cargo",
                type: "select",
                required: true,
                options: this.cargoOptions,
                selectSearch: {
                    external: true,
                    field: "nome"
                },
                selectAction: this.dialogMode === "view"
                    ? undefined
                    : {
                        icon: "fa-plus",
                        side: "right",
                        tooltip: "Cadastrar cargo"
                    }
            });

            if (!isCreate) {
                fields.push({
                    id: "ativo",
                    label: "Ativo",
                    type: "checkbox",
                    checkboxStyle: "switch"
                });
            }

            return fields;
        },

        cargoFields(): FormField[] {
            return [
                {
                    id: "nome",
                    label: "Nome",
                    type: "text",
                    required: true
                },
                {
                    id: "nivelAcesso",
                    label: "Nível de acesso",
                    type: "select",
                    required: true,
                    helperText: "Selecione um ou mais módulos",
                    selectMultiple: { min: 1 },
                    options: [
                        { label: "Ponto", value: "1" },
                        { label: "Clientes", value: "2" },
                        { label: "Veículos", value: "3" },
                        { label: "Ordens de serviço", value: "4" },
                        { label: "Funcionários", value: "5" },
                        { label: "Terminal", value: "6" }
                    ]
                }
            ];
        }
    },

    mounted() {
        void this.getCargos();
    },

    methods: {
        itemDialog(): ItemViewEditExpose | undefined {
            return this.$refs.itemDialog as ItemViewEditExpose | undefined;
        },

        cargoDialogRef(): ItemViewEditExpose | undefined {
            return this.$refs.cargoDialog as ItemViewEditExpose | undefined;
        },

        closeDialog() {
            this.dialogOpen = false;
            this.dialogSaving = false;
            this.closeCargoDialog();
        },

        closeCargoDialog() {
            this.cargoDialogOpen = false;
            this.cargoSaving = false;
        },

        onFilters(values: FilterValues) {
            this.page = 1;
            this.filters = toQueryString(values);
            void this.getFuncionarios();
        },

        onPage(page: number) {
            if (page === this.page) {
                return;
            }

            this.page = page;
            void this.getFuncionarios();
        },

        async getCargos(query = "", field = "nome") {
            this.cargoSearchSeq += 1;
            const seq = this.cargoSearchSeq;

            try {
                const trimmed = query.trim();
                const searchQuery = toQueryString({
                    limit: 100,
                    ...(trimmed && field ? { [field]: trimmed } : {})
                });
                const response = await this.$http.get<ListResponse<CargoApi>>(
                    `/api/cargo?${searchQuery}`
                );

                if (seq !== this.cargoSearchSeq) {
                    return;
                }

                const selectedId = String(
                    this.itemDialog()?.getFieldValue("cargoId") ?? this.dialogItem.cargoId ?? ""
                );
                const selected = this.cargos.find((cargo) => String(cargo.id) === selectedId);

                this.cargos = withSelectedItem(
                    response.data.data ?? [],
                    selected,
                    (cargo) => String(cargo.id)
                );
            } catch (error) {
                notifyHttpError(this.$toast, error, "Não foi possível carregar os cargos.");
            }
        },

        async getFuncionarios() {
            try {
                this.loadingFuncionarios = true;

                const query = listQuery(this.filters, this.page, this.pageLimit);
                const response = await this.$http.get<ListResponse<UsuarioApi>>(
                    `/api/usuario?${query}`
                );

                this.pageCount = pageCountFromTotal(
                    response.data.total,
                    response.data.limit,
                    this.pageLimit
                );
                this.funcionarios = response.data.data ?? [];
            } catch (error) {
                notifyHttpError(this.$toast, error, "Não foi possível carregar os funcionários.");
                this.funcionarios = [];
                this.pageCount = 0;
            } finally {
                this.loadingFuncionarios = false;
            }
        },

        openDialog(mode: DialogMode, item: FuncionarioFormValues, cargo?: CargoApi) {
            this.dialogKey += 1;
            this.dialogMode = mode;
            this.dialogItem = item;
            this.dialogSaving = false;
            this.dialogOpen = true;

            if (cargo) {
                this.cargos = withSelectedItem(
                    this.cargos,
                    cargo,
                    (entry) => String(entry.id)
                );
            }
        },

        onCreate() {
            this.openDialog("create", emptyFormValues());
        },

        async openUsuarioDialog(mode: "view" | "edit", row: Record<string, unknown>) {
            const cpf = documentDigits(row.cpf);

            if (!cpf) {
                this.$toast.error("CPF do funcionário é inválido.");
                return;
            }

            try {
                const response = await this.$http.get<ItemResponse<UsuarioApi>>(
                    `/api/usuario/${cpf}`
                );
                const user = response.data.data;
                const cargo = user.cargoId != null
                    ? {
                        id: user.cargoId,
                        nome: user.cargoNome ?? String(user.cargoId)
                    }
                    : undefined;

                this.openDialog(mode, toFormValues(user), cargo);
            } catch (error) {
                notifyHttpError(this.$toast, error, "Não foi possível carregar o funcionário.");
            }
        },

        onRowAction(value: string, item: Record<string, unknown>) {
            if (value === "inspect") {
                void this.openUsuarioDialog("view", item);
            } else if (value === "edit") {
                void this.openUsuarioDialog("edit", item);
            }
        },

        onDelete() {
            this.$toast.info("Exclusão de funcionário não está disponível.");
        },

        onUsuarioSelectAction(payload: { id: string }) {
            if (payload.id !== "cargoId") {
                return;
            }

            if (this.dialogMode === "view") {
                return;
            }

            this.cargoDialogKey += 1;
            this.cargoItem = emptyCargoForm();
            this.cargoSaving = false;
            this.cargoDialogOpen = true;
        },

        onSearchExternal(payload: { id: string; field: string; value: string }) {
            if (payload.id !== "cargoId") {
                return;
            }

            void this.getCargos(payload.value, payload.field || "nome");
        },

        nivelAcessoFromPayload(value: unknown): string {
            if (Array.isArray(value)) {
                return value
                    .map((item) => String(item))
                    .filter((item) => item !== "")
                    .sort()
                    .join("");
            }

            return String(value ?? "");
        },

        async onSaveCargo(payload: Record<string, unknown>) {
            this.cargoSaving = true;

            try {
                const response = await this.$http.post<ItemResponse<CargoApi>>("/api/cargo", {
                    nome: payload.nome,
                    nivelAcesso: this.nivelAcessoFromPayload(payload.nivelAcesso)
                });
                const created = response.data.data;

                if (!created) {
                    this.$toast.error("Não foi possível criar o cargo.");
                    return;
                }

                this.cargos = [...this.cargos, created];

                await this.$nextTick();

                this.itemDialog()?.setFieldValue("cargoId", String(created.id));
                this.closeCargoDialog();
                this.$toast.success("Cargo criado.");
            } catch (error) {
                notifyHttpError(
                    this.$toast,
                    error,
                    "Não foi possível criar o cargo.",
                    this.cargoDialogRef()
                );
            } finally {
                this.cargoSaving = false;
            }
        },

        async onSave(payload: Record<string, unknown>) {
            this.dialogSaving = true;

            try {
                if (this.dialogMode === "create") {
                    await this.$http.post("/api/usuario", {
                        cpf: payload.cpf,
                        nome: payload.nome,
                        email: payload.email,
                        senha: payload.senha,
                        cargoId: Number(payload.cargoId)
                    });

                    this.$toast.success("Funcionário criado.");
                } else {
                    const cpf = documentDigits(this.dialogItem.cpf);

                    await this.$http.put(`/api/usuario/${cpf}`, {
                        nome: payload.nome,
                        email: payload.email,
                        cargoId: Number(payload.cargoId),
                        ativo: Boolean(payload.ativo)
                    });

                    this.$toast.success("Funcionário atualizado.");
                }

                this.closeDialog();
                await this.getFuncionarios();
            } catch (error) {
                notifyHttpError(
                    this.$toast,
                    error,
                    "Não foi possível salvar o funcionário.",
                    this.itemDialog()
                );
            } finally {
                this.dialogSaving = false;
            }
        }
    }
});
</script>
