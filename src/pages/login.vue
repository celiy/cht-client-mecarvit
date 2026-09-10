<template>
    <main class="flex min-h-dvh items-center justify-center p-6">
        <Card class="w-full max-w-md">
            <template #header>
                <h4 class="text-xl font-semibold">Entrar</h4>

                <p class="mb-2 text-sm text-muted-foreground!">
                    Acesse com email e senha. Funcionários precisam selecionar a oficina.
                </p>
            </template>

            <template #body>
                <form
                    class="flex flex-col gap-4"

                    @submit.prevent="submit"
                >
                    <Input
                        id="login-email"
                        v-model="email"
                        type="email"
                        label="Email"
                        placeholder="nome@exemplo.com"
                        autocomplete="email"
                        :error="errors.email"
                        required
                    />

                    <Input
                        id="login-password"
                        v-model="senha"
                        type="password"
                        label="Senha"
                        placeholder="Sua senha"
                        autocomplete="current-password"
                        :error="errors.senha"
                        required
                    />

                    <div v-if="empresaOptions.length > 0">
                        <Select
                            id="login-empresa"
                            v-model="empresaId"
                            label="Oficina"
                            header="Selecione a oficina"
                            :options="empresaOptions"
                        />

                        <p
                            v-if="errors.empresaId"

                            class="mt-2 text-sm text-destructive"
                        >
                            {{ errors.empresaId }}
                        </p>
                    </div>

                    <Item
                        v-if="formError"

                        icon="fa-circle-xmark"
                        variant="destructive"
                        type="alert"
                        :hover-effect="false"
                        :description="formError"
                    />

                    <Button
                        label="Entrar"
                        variant="primary"
                        class="w-full"
                        type="submit"
                        :disabled="loading"
                    />

                    <small class="text-center text-sm">
                        Não tem conta?

                        <RouterLink
                            class="text-primary hover:underline"
                            to="/register"
                        >
                            Cadastre a oficina
                        </RouterLink>
                    </small>
                </form>
            </template>
        </Card>
    </main>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import Button from "@design/components/Button.vue";
import Card from "@design/components/Card.vue";
import Input from "@design/components/Input.vue";
import Select from "@design/components/Select.vue";
import { HttpError } from "@base/http";
import { validateLogin } from "@shared/validators/auth";
import { completeAuth, type AuthApiResponse, type EmpresaLocal } from "../js/auth";

export default defineComponent({
    name: "MecarvitLoginPage",

    components: {
        Button,
        Card,
        Input,
        Select
    },

    data() {
        return {
            email: "",
            senha: "",
            empresaId: "" as string | number,
            empresas: [] as EmpresaLocal[],
            loading: false,
            formError: "",
            errors: {
                email: "",
                senha: "",
                empresaId: ""
            }
        };
    },

    computed: {
        empresaOptions() {
            return this.empresas.map((empresa) => ({
                label: empresa.nome,
                value: String(empresa.id)
            }));
        }
    },

    mounted() {
        void this.loadEmpresas();
    },

    methods: {
        clearErrors() {
            this.formError = "";
            this.errors.email = "";
            this.errors.senha = "";
            this.errors.empresaId = "";
        },

        parsedEmpresaId(): number | undefined {
            if (this.empresaId === "" || this.empresaId === undefined || this.empresaId === null) {
                return undefined;
            }

            const id = Number(this.empresaId);

            if (!Number.isInteger(id) || id <= 0) {
                return undefined;
            }

            return id;
        },

        async loadEmpresas() {
            try {
                const response = await this.$http.get<{ data: EmpresaLocal[] }>(
                    "/api/empresa-locais"
                );
                this.empresas = response.data.data ?? [];

                if (this.empresas.length === 1) {
                    const only = this.empresas[0];

                    if (only) {
                        this.empresaId = String(only.id);
                    }
                }
            } catch {
                this.empresas = [];
            }
        },

        async submit() {
            this.clearErrors();

            const empresaId = this.parsedEmpresaId();
            const payload = {
                email: this.email.trim(),
                senha: this.senha,
                empresaId
            };
            const clientErrors = validateLogin(payload);

            if (clientErrors) {
                this.errors.email = clientErrors.email ?? "";
                this.errors.senha = clientErrors.senha ?? clientErrors.password ?? "";
                this.errors.empresaId = clientErrors.empresaId ?? "";
                this.formError = "Verifique os campos e tente novamente.";
                return;
            }

            this.loading = true;

            try {
                const body: { email: string; senha: string; empresaId?: number } = {
                    email: payload.email,
                    senha: payload.senha
                };

                if (empresaId !== undefined) {
                    body.empresaId = empresaId;
                }

                const response = await this.$http.post<AuthApiResponse>("/api/login", body);

                await completeAuth(this.$router, this.$route, response.data.data);
            } catch (error) {
                if (error instanceof HttpError) {
                    this.formError = error.message;
                    this.errors.email = error.fields?.email ?? "";
                    this.errors.senha = error.fields?.senha ?? error.fields?.password ?? "";
                    this.errors.empresaId = error.fields?.empresaId ?? "";
                    return;
                }

                this.formError = "Não foi possível entrar. Tente novamente.";
            } finally {
                this.loading = false;
            }
        }
    }
});
</script>
