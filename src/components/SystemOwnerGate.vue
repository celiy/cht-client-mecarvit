<template>
    <div class="relative flex min-h-0 flex-1 flex-col">
        <slot />

        <div
            v-if="showOverlay"

            class="fixed inset-0 z-90 flex flex-col items-center justify-center bg-background px-6"
        >
            <Card class="w-full max-w-md">
                <template #header>
                    <h4 class="text-xl font-semibold">
                        {{ isSetup ? "Dono do sistema" : "Desbloquear" }}
                    </h4>

                    <p class="mb-2 text-sm text-muted-foreground!">
                        {{
                            isSetup
                                ? "Crie o login que protege os bancos das oficinas salvos neste computador."
                                : "Entre com o login criado na instalação para acessar os bancos locais."
                        }}
                    </p>
                </template>

                <template #body>
                    <form
                        class="flex flex-col gap-4"

                        @submit.prevent="submit"
                    >
                        <Input
                            id="system-owner-login"
                            v-model="login"
                            type="text"
                            label="Login"
                            autocomplete="username"
                            :error="errors.login"
                            required
                        />

                        <Input
                            id="system-owner-password"
                            v-model="senha"
                            type="password"
                            label="Senha"
                            autocomplete="current-password"
                            :error="errors.senha"
                            required
                        />

                        <Item
                            v-if="formError"

                            icon="fa-circle-xmark"
                            variant="destructive"
                            type="alert"
                            :hover-effect="false"
                            :description="formError"
                        />

                        <Button
                            :label="isSetup ? 'Criar login' : 'Desbloquear'"
                            variant="primary"
                            class="w-full"
                            type="submit"
                            :disabled="loading"
                        />
                    </form>
                </template>
            </Card>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { HttpError, persistSystemToken, getStoredSystemToken } from "@base/http";
import { project } from "@base/project";
import { validateSystemOwnerCredentials } from "@shared/validators/auth";

type SystemStatusResponse = {
    data: {
        configured: boolean;
        required: boolean;
    };
};

type SystemAuthResponse = {
    data: {
        token: string;
        login: string;
    };
};

export default defineComponent({
    name: "SystemOwnerGate",

    data() {
        return {
            loading: false,
            ready: false,
            configured: false,
            required: false,
            unlocked: false,
            login: "",
            senha: "",
            formError: "",
            errors: {
                login: "",
                senha: ""
            }
        };
    },

    computed: {
        isElectron(): boolean {
            return project.electron.isElectron;
        },

        backendReady(): boolean {
            return project.electron.backendReady;
        },

        isSetup(): boolean {
            return !this.configured;
        },

        showOverlay(): boolean {
            if (!this.isElectron || !this.ready || this.unlocked) {
                return false;
            }

            return this.isSetup || this.required;
        }
    },

    watch: {
        backendReady(ready: boolean) {
            if (ready) {
                void this.refreshStatus();
            }
        }
    },

    mounted() {
        if (!this.isElectron) {
            this.ready = true;
            this.unlocked = true;
            return;
        }

        if (project.electron.backendReady) {
            void this.refreshStatus();
        }
    },

    methods: {
        async refreshStatus() {
            try {
                const response = await this.$http.get<SystemStatusResponse>("/api/system/status");
                const status = response.data.data;

                this.configured = Boolean(status?.configured);
                this.required = Boolean(status?.required);
                this.unlocked = Boolean(getStoredSystemToken()) && this.configured;
                this.ready = true;
            } catch {
                this.ready = true;
                this.formError = "Não foi possível verificar o dono do sistema.";
            }
        },

        async submit() {
            this.formError = "";
            this.errors.login = "";
            this.errors.senha = "";

            const payload = {
                login: this.login.trim(),
                senha: this.senha
            };
            const clientErrors = validateSystemOwnerCredentials(payload);

            if (clientErrors) {
                this.errors.login = clientErrors.login ?? "";
                this.errors.senha = clientErrors.senha ?? "";
                return;
            }

            this.loading = true;

            try {
                const path = this.isSetup ? "/api/system/setup" : "/api/system/login";
                const response = await this.$http.post<SystemAuthResponse>(path, payload);
                const token = response.data.data.token;

                persistSystemToken(token);
                this.configured = true;
                this.required = true;
                this.unlocked = true;
            } catch (error) {
                if (error instanceof HttpError) {
                    this.errors.login = error.fields?.login ?? "";
                    this.errors.senha = error.fields?.senha ?? "";
                    this.formError = error.message;
                    return;
                }

                this.formError = "Não foi possível continuar. Tente novamente.";
            } finally {
                this.loading = false;
            }
        }
    }
});
</script>
