<template>
    <main class="container p-8 container-center">
        <div class="flex justify-between items-center">
            <h2 class="text-2xl font-semibold">Funcionários</h2>

            <div>
                <Button label="Cadastrar" left-icon="fa-plus" @click="onCreate"/>
            </div>
        </div>


        <div class="mt-2 mb-4">
            <FilterInputs
                :filters="funcionarioFilters"
                :loading="loadingFuncionarios"

                @filters="onFilters"
                @reload="getFuncionarios"
            />
        </div>

        <div>
            <Table
                :headers="[
                    {
                        label: 'Nome',
                        field: 'nome',
                        position: 'start'
                    },
                    {
                        label: 'Cargo',
                        field: 'cargoNome',
                        position: 'start'
                    },
                    {
                        label: 'CPF',
                        field: 'cpf',
                        position: 'start'
                    }
                ]"
                :actions="[
                    { label: 'Visualizar', value: 'inspect', icon: 'fa-eye' },
                    { label: 'Editar', value: 'edit', icon: 'fa-pen' },
                    { separator: true },
                    { label: 'Excluir', value: 'delete', icon: 'fa-trash', variant: 'destructive' }
                ]"
                :data="funcionarios"
                :loading="loadingFuncionarios"

                @click:action="onRowAction"
            />

            <Pagination
                id="pagination-funcionarios"
                :key="filters || 'all'"

                class="mt-4"

                :amount="pageCount"
                :show-max="5"
                :use-memo="true"

                @update:page="onPage"
            />
        </div>

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
    </main>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import Button from "@design/components/Button.vue";
import Pagination from "@design/components/custom/Pagination.vue";
import { HttpError } from "@base/http";
import { toQueryString } from "@shared/frontend/queryString";
import { PASSWORD_MIN_LENGTH } from "@shared/validators/password";
import type { FormField } from "@shared/interfaces/FormField";
import FilterInputs, { type FilterDef, type FilterValues } from "../../components/FilterInputs.vue";
import ItemViewEdit from "../../components/ItemViewEdit.vue";

type DialogMode = "view" | "edit" | "create";

interface UsuarioApi {
    cpf: string;
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

interface ListResponse<T> {
    data: T[];
    page?: number;
    limit?: number;
    total?: number;
}

interface ItemResponse<T> {
    data: T;
}

interface FuncionarioFormValues {
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

type ItemViewEditExpose = {
    applyFieldErrors: (errors: Record<string, string>) => void;
    setFieldValue: (fieldId: string, value: unknown) => void;
};

function cpfDigits(value: unknown): string {
    return String(value ?? "").replace(/\D/g, "");
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
        Button,
        FilterInputs,
        ItemViewEdit,
        Pagination
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
                    options: [
                        { label: "Ativo", value: "ativo", default: true },
                        { label: "Inativo", value: "inativo" }
                    ]
                },
                { type: "input", value: "cpf", label: "CPF" }
            ] as FilterDef[],
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
            page: 1,
            pageLimit: 10,
            pageCount: 0
        };
    },

    computed: {
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
                selectAction: this.dialogMode === "view"
                    ? undefined
                    : {
                        icon: "fa-plus",
                        side: "right"
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

        fieldErrorsFromHttp(error: HttpError): Record<string, string> {
            const fields: Record<string, string> = {};

            if (!error.fields) {
                return fields;
            }

            for (const [key, value] of Object.entries(error.fields)) {
                if (typeof value === "string") {
                    fields[key] = value;
                }
            }

            return fields;
        },

        notifyError(error: unknown, fallback: string, dialog?: ItemViewEditExpose) {
            if (error instanceof HttpError) {
                this.$toast.error(error.message);
                dialog?.applyFieldErrors(this.fieldErrorsFromHttp(error));
                return;
            }

            this.$toast.error(fallback);
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

        async getCargos() {
            try {
                const response = await this.$http.get<ListResponse<CargoApi>>("/api/cargo", {
                    params: { limit: 100 }
                });

                this.cargos = response.data.data ?? [];
            } catch (error) {
                this.notifyError(error, "Não foi possível carregar os cargos.");
            }
        },

        async getFuncionarios() {
            try {
                this.loadingFuncionarios = true;

                const paging = toQueryString({
                    page: this.page,
                    limit: this.pageLimit
                });
                const query = [this.filters, paging].filter(Boolean).join("&");
                const response = await this.$http.get<ListResponse<UsuarioApi>>(
                    `/api/usuario?${query}`
                );
                const total = Number(response.data.total ?? 0);
                const limit = Number(response.data.limit ?? this.pageLimit);

                this.pageCount = limit > 0 ? Math.ceil(total / limit) : 0;
                this.funcionarios = response.data.data ?? [];
            } catch (error) {
                this.notifyError(error, "Não foi possível carregar os funcionários.");
                this.funcionarios = [];
                this.pageCount = 0;
            } finally {
                this.loadingFuncionarios = false;
            }
        },

        openDialog(mode: DialogMode, item: FuncionarioFormValues) {
            this.dialogKey += 1;
            this.dialogMode = mode;
            this.dialogItem = item;
            this.dialogSaving = false;
            this.dialogOpen = true;
        },

        onCreate() {
            this.openDialog("create", emptyFormValues());
        },

        async openUsuarioDialog(mode: "view" | "edit", row: Record<string, unknown>) {
            const cpf = cpfDigits(row.cpf);

            if (!cpf) {
                this.$toast.error("CPF do funcionário é inválido.");
                return;
            }

            try {
                const response = await this.$http.get<ItemResponse<UsuarioApi>>(
                    `/api/usuario/${cpf}`
                );
                const user = response.data.data;

                this.openDialog(mode, toFormValues(user));
            } catch (error) {
                this.notifyError(error, "Não foi possível carregar o funcionário.");
            }
        },

        onRowAction(value: string, item: Record<string, unknown>) {
            if (value === "inspect") {
                void this.openUsuarioDialog("view", item);
            } else if (value === "edit") {
                void this.openUsuarioDialog("edit", item);
            } else if (value === "delete") {
                this.$toast.info("Exclusão de funcionário não está disponível.");
            }
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
                this.notifyError(
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
                    const cpf = cpfDigits(this.dialogItem.cpf);

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
                this.notifyError(
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
