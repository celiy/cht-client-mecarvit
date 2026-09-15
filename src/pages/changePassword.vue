<template>
    <main class="flex min-h-dvh items-center justify-center p-6">
        <Card class="w-full max-w-md">
            <template #header>
                <h1 class="text-xl font-semibold">
                    Trocar senha
                </h1>

                <p class="text-sm text-muted-foreground!">
                    Defina uma senha própria antes de continuar.
                </p>
            </template>

            <template #body>
                <form
                    class="flex flex-col gap-4"

                    @submit.prevent="submit"
                >
                    <Input
                        id="change-senha-atual"
                        v-model="senhaAtual"

                        type="password"
                        label="Senha atual"
                        placeholder="Senha temporária"
                        autocomplete="current-password"
                        :error="errors.senhaAtual"
                        required
                    />

                    <Input
                        id="change-senha-nova"
                        v-model="senhaNova"

                        type="password"
                        label="Nova senha"
                        placeholder="Mínimo de 8 caracteres"
                        autocomplete="new-password"
                        helper-text="Mínimo de 8 caracteres"
                        :error="errors.senhaNova"
                        required
                    />

                    <Input
                        id="change-senha-confirmacao"
                        v-model="senhaConfirmacao"

                        type="password"
                        label="Confirmar senha"
                        placeholder="Repita a nova senha"
                        autocomplete="new-password"
                        :error="errors.senhaConfirmacao"
                        required
                    />

                    <p
                        v-if="formError"

                        class="text-sm text-destructive"
                    >
                        {{ formError }}
                    </p>

                    <Button
                        label="Salvar senha"
                        variant="primary"
                        class="w-full"
                        type="submit"
                        :disabled="loading || !cpf"
                    />
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
import { clearAuthToken, HttpError } from "@base/http";
import { validateChangeSenha } from "@shared/validators/mecarvit";
import { loadCurrentUser } from "../js/mecarvit";

export default defineComponent({
    name: "MecarvitChangePasswordPage",

    components: {
        Button,
        Card,
        Input
    },

    data() {
        return {
            senhaAtual: "",
            senhaNova: "",
            senhaConfirmacao: "",
            loading: false,
            formError: "",
            errors: {
                senhaAtual: "",
                senhaNova: "",
                senhaConfirmacao: ""
            }
        };
    },

    computed: {
        cpf() {
            return this.$mecarvit.user?.cpf ?? "";
        }
    },

    mounted() {
        void this.loadMe();
    },

    methods: {
        clearErrors() {
            this.formError = "";
            this.errors.senhaAtual = "";
            this.errors.senhaNova = "";
            this.errors.senhaConfirmacao = "";
        },

        async loadMe() {
            if (this.cpf) {
                return;
            }

            await loadCurrentUser();

            if (!this.cpf) {
                clearAuthToken();
                await this.$router.push({ name: "login" });
            }
        },

        async submit() {
            this.clearErrors();

            const clientErrors = validateChangeSenha({
                senhaAtual: this.senhaAtual,
                senhaNova: this.senhaNova
            });

            if (this.senhaNova !== this.senhaConfirmacao) {
                this.errors.senhaConfirmacao = "As senhas não coincidem.";
            }

            if (clientErrors || this.errors.senhaConfirmacao) {
                this.errors.senhaAtual = clientErrors?.senhaAtual ?? this.errors.senhaAtual;
                this.errors.senhaNova = clientErrors?.senhaNova ?? this.errors.senhaNova;
                this.formError = "Verifique os campos e tente novamente.";
                return;
            }

            this.loading = true;

            try {
                await this.$http.post(`/api/usuario/${this.cpf}/senha`, {
                    senhaAtual: this.senhaAtual,
                    senhaNova: this.senhaNova
                });

                await this.$router.push("/home");
            } catch (error) {
                if (error instanceof HttpError) {
                    this.formError = error.message;
                    this.errors.senhaAtual = error.fields?.senhaAtual ?? "";
                    this.errors.senhaNova = error.fields?.senhaNova ?? "";
                    return;
                }

                this.formError = "Não foi possível alterar a senha. Tente novamente.";
            } finally {
                this.loading = false;
            }
        }
    }
});
</script>
