<template>
    <AppUpdateButton class="fixed top-4 right-4 z-50" />

    <main class="flex min-h-screen flex-col items-center p-6">
        <div class="container-center mt-12 mb-4">
            <Image
                class="mx-auto mb-3 h-24 w-24"
                image-class="h-24 w-24 object-contain"
                :src="logo"
                alt="Mecarvit"
                :draggable="false"
            />

            <h1>Mecarvit</h1>
        </div>

        <Card class="w-full max-w-md">
            <template #header>
                <h4 class="text-xl font-semibold">Entrar</h4>

                <p class="mb-2 text-sm text-muted-foreground!">
                    Acesse com email e senha. Se o mesmo login existir em mais de uma oficina, escolha a oficina.
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

                    <div v-if="empresaOptions.length > 1">
                        <Select
                            id="login-empresa"
                            v-model="empresaId"
                            label="Oficina"
                            header="Selecione a oficina"
                            :options="empresaOptions"
                            :error="errors.empresaId"
                        />
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

                    <small
                        class="text-center text-sm"
                    >
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
import { HttpError } from "@base/http";
import AppUpdateButton from "@base/components/AppUpdateButton.vue";
import { validateLogin } from "@shared/validators/auth";
import logo from "../assets/logo.png";
import { completeAuth, type AuthApiResponse, type EmpresaLocal } from "../js/auth";
import type { ApiErrorResponse } from "@shared/errors/ApiError";

export default defineComponent({
    name: "MecarvitLoginPage",

    components: {
        AppUpdateButton
    },

    data() {
        return {
            logo,
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

        empresasFromError(error: HttpError): EmpresaLocal[] {
            const data = error.data as ApiErrorResponse | undefined;
            const empresas = data?.error?.empresas;

            if (!Array.isArray(empresas)) {
                return [];
            }

            return empresas.filter(
                (item): item is EmpresaLocal =>
                    typeof item?.id === "number" && typeof item?.nome === "string"
            );
        },

        async submit() {
            this.clearErrors();

            const empresaId = this.parsedEmpresaId();

            if (this.empresaOptions.length > 1 && empresaId === undefined) {
                this.errors.empresaId = "Selecione a oficina";
                return;
            }

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
                    const empresas = this.empresasFromError(error);

                    if (empresas.length > 1) {
                        this.empresas = empresas;
                        this.errors.empresaId = empresaId === undefined ? "Selecione a oficina" : "";
                        this.$toast.warning(
                            "Este login existe em mais de uma oficina. Selecione a oficina desejada e entre novamente."
                        );
                    } else {
                        this.formError = error.message;
                        this.errors.empresaId = error.fields?.empresaId ?? "";
                    }

                    this.errors.email = error.fields?.email ?? "";
                    this.errors.senha = error.fields?.senha ?? error.fields?.password ?? "";
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
