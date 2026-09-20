<template>
    <CrudListPage
        ref="listPage"
        title="Funcionários"
        :filters="funcionarioFilters"
        :loading="loadingFuncionarios"
        :headers="tableHeaders"
        :rows="tableRows"
        :page-count="pageCount"
        pagination-id="pagination-funcionarios"
        :pagination-key="filters || 'all'"
        delete-name-field="nome"
        empty-title="Nenhum funcionário encontrado."
        empty-description="Ajuste os filtros ou cadastre um novo funcionário."

        @create="onCreate"
        @close-create="closeDialog"
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
            :hide-mode-toggle="dialogUsuarioSuperadmin"

            @save="onSave"
            @cancel="closeDialog"
            @update:mode="onDialogModeChange"
            @click:select-action="onUsuarioSelectAction"
            @search:external="onSearchExternal"
        >
            <template #formActions>
                <Button
                    v-if="dialogMode !== 'view' && !dialogUsuarioSuperadmin"

                    type="button"
                    variant="secondary"
                    label="Resetar senha"
                    left-icon="fa-rotate-right"
                    class="mr-auto"

                    @click="openResetConfirm"
                />
            </template>
        </ItemViewEdit>

        <ConfirmationModal
            :is-open="resetConfirmOpen"
            variant="warning"
            title="Resetar senha"
            description="O funcionário precisará trocar a senha no próximo acesso."
            body="Defina uma nova senha para o funcionário. Esta ação não pode ser desfeita."
            confirm-text="Resetar"
            cancel-text="Cancelar"

            @confirm="onConfirmReset"
            @cancel="closeResetConfirm"
            @update:is-open="onResetOpenChange"
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
import ConfirmationModal from "@design/components/custom/ConfirmationModal.vue";
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
import {
    excludeCurrentUsuario,
    excludeSuperadminCargos,
    isUsuarioSuperadmin
} from "../../js/mecarvit";

interface UsuarioApi {
    cpf: string;
    criadoEm?: string;
    modificadoEm?: string;
    nome: string;
    email: string;
    ativo: boolean;
    fundador?: boolean;
    nivelAcesso?: string;
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
    cargoNome?: string;
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
        cargoNome: user.cargoNome ?? "",
        ativo: Boolean(user.ativo)
    };
}

export default defineComponent({
    name: "MecarvitFuncionariosPage",

    components: {
        ConfirmationModal,
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
            dialogOriginalItem: emptyFormValues() as FuncionarioFormValues,
            dialogKey: 0,
            cargoDialogOpen: false,
            cargoSaving: false,
            cargoItem: emptyCargoForm() as CargoFormValues,
            cargoDialogKey: 0,
            cargoSearchSeq: 0,
            page: 1,
            pageLimit: 10,
            pageCount: 0,
            dialogUsuarioSuperadmin: false,
            senhaResetTriggered: false,
            resetConfirmOpen: false
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
            return excludeSuperadminCargos(this.cargos).map((cargo) => ({
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
            } else if (this.senhaResetTriggered) {
                fields.push({
                    id: "senha",
                    label: "Nova senha",
                    type: "password",
                    required: true,
                    minSize: PASSWORD_MIN_LENGTH,
                    helperText: `Mínimo de ${PASSWORD_MIN_LENGTH} caracteres`
                });
            }

            if (this.dialogUsuarioSuperadmin) {
                fields.push({
                    id: "cargoNome",
                    label: "Cargo",
                    type: "text",
                    readonly: true
                });
            } else {
                fields.push({
                    id: "cargoId",
                    label: "Cargo",
                    placeholder: "Selecione o cargo",
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
            }

            if (!isCreate) {
                fields.push({
                    id: "ativo",
                    label: "Ativo",
                    type: "checkbox",
                    checkboxStyle: "switch",
                    description: "Quando desativado, a entidade não será indexada nem poderá ser usada. Isso funciona como exclusão lógica, sem perder os dados."
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
            this.dialogUsuarioSuperadmin = false;
            this.senhaResetTriggered = false;
            this.resetConfirmOpen = false;
            this.closeCargoDialog();
            void this.$refs.listPage?.clearCadastrarQuery?.();
        },

        onDialogModeChange(mode: DialogMode) {
            if (this.dialogUsuarioSuperadmin && mode === "edit") {
                return;
            }

            if (this.dialogMode === "view" && mode === "edit") {
                this.dialogOriginalItem = JSON.parse(JSON.stringify(this.dialogItem));
            }

            if (this.dialogMode === "edit" && mode === "view") {
                this.dialogItem = JSON.parse(JSON.stringify(this.dialogOriginalItem));
                this.senhaResetTriggered = false;
                this.dialogKey += 1;
            }

            this.dialogMode = mode;
        },

        closeCargoDialog() {
            this.cargoDialogOpen = false;
            this.cargoSaving = false;
        },

        openResetConfirm() {
            this.resetConfirmOpen = true;
        },

        closeResetConfirm() {
            this.resetConfirmOpen = false;
        },

        onResetOpenChange(open: boolean) {
            if (!open) {
                this.resetConfirmOpen = false;
            }
        },

        onConfirmReset() {
            this.senhaResetTriggered = true;
            this.resetConfirmOpen = false;
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

                const rows = excludeSuperadminCargos(response.data.data ?? []);
                const selectedForList =
                    selected && isUsuarioSuperadmin({ nivelAcesso: selected.nivelAcesso })
                        ? undefined
                        : selected;

                this.cargos = withSelectedItem(
                    rows,
                    selectedForList,
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
                this.funcionarios = excludeCurrentUsuario(response.data.data ?? []);
            } catch (error) {
                notifyHttpError(this.$toast, error, "Não foi possível carregar os funcionários.");
                this.funcionarios = [];
                this.pageCount = 0;
            } finally {
                this.loadingFuncionarios = false;
            }
        },

        openDialog(
            mode: DialogMode,
            item: FuncionarioFormValues,
            cargo?: CargoApi,
            usuarioMeta?: Pick<UsuarioApi, "fundador" | "nivelAcesso">
        ) {
            this.dialogKey += 1;
            this.dialogMode = mode;
            this.dialogItem = item;
            this.dialogOriginalItem = JSON.parse(JSON.stringify(item));
            this.dialogUsuarioSuperadmin = isUsuarioSuperadmin(usuarioMeta ?? {});
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
            this.openDialog("create", emptyFormValues(), undefined, {});
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

                this.openDialog(mode, toFormValues(user), cargo, user);
            } catch (error) {
                notifyHttpError(this.$toast, error, "Não foi possível carregar o funcionário.");
            }
        },

        onRowAction(value: string, item: Record<string, unknown>) {
            if (value === "inspect") {
                void this.openUsuarioDialog("view", item);
            } else if (value === "edit") {
                if (
                    isUsuarioSuperadmin({
                        fundador: Boolean(item.fundador),
                        nivelAcesso: String(item.nivelAcesso ?? "")
                    })
                ) {
                    this.$toast.error("Não é permitido editar este usuário.");
                    void this.openUsuarioDialog("view", item);
                    return;
                }

                void this.openUsuarioDialog("edit", item);
            }
        },

        async onDelete(item: Record<string, unknown>) {
            const cpf = documentDigits(item.cpf);

            if (!cpf) {
                this.$toast.error("CPF do funcionário é inválido.");
                return;
            }

            if (
                isUsuarioSuperadmin({
                    fundador: Boolean(item.fundador),
                    nivelAcesso: String(item.nivelAcesso ?? "")
                })
            ) {
                this.$toast.error("Não é permitido excluir este usuário.");
                return;
            }

            try {
                await this.$http.put(`/api/usuario/${cpf}`, {
                    ativo: false
                });
                this.$toast.success("Funcionário desativado.");
                await this.getFuncionarios();
            } catch (error) {
                notifyHttpError(this.$toast, error, "Não foi possível excluir o funcionário.");
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
                    const patch: Record<string, unknown> = {
                        nome: payload.nome,
                        email: payload.email,
                        cargoId: Number(payload.cargoId),
                        ativo: Boolean(payload.ativo)
                    };

                    if (this.senhaResetTriggered && payload.senha) {
                        patch.senha = String(payload.senha);
                        patch.senhaInicial = true;
                    }

                    await this.$http.put(`/api/usuario/${cpf}`, patch);

                    this.$toast.success(
                        this.senhaResetTriggered
                            ? "Senha do funcionário resetada."
                            : "Funcionário atualizado."
                    );
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
