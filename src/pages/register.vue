<template>
    <main class="flex min-h-dvh items-center justify-center p-6">
        <Card class="w-full max-w-md">
            <template #header>
                <h4 class="text-xl font-semibold">Cadastrar oficina</h4>

                <p class="mb-2 text-sm text-muted-foreground!">
                    Crie a oficina e a conta do gestor.
                </p>
            </template>

            <template #body>
                <form
                    class="flex flex-col gap-4"

                    @submit.prevent="submit"
                >
                    <Input
                        id="register-empresa"
                        v-model="empresaNome"
                        type="text"
                        label="Nome da oficina"
                        placeholder="Oficina Central"
                        autocomplete="organization"
                        :error="errors.empresaNome"
                        required
                    />

                    <Input
                        id="register-nome"
                        v-model="nome"
                        type="text"
                        label="Seu nome"
                        placeholder="Nome completo"
                        autocomplete="name"
                        :error="errors.nome"
                        required
                    />

                    <Input
                        id="register-cpf"
                        v-model="cpf"
                        type="cpf"
                        label="CPF"
                        placeholder="000.000.000-00"
                        autocomplete="off"
                        :error="errors.cpf"
                        required
                    />

                    <Input
                        id="register-email"
                        v-model="email"
                        type="email"
                        label="Email"
                        placeholder="nome@exemplo.com"
                        autocomplete="email"
                        :error="errors.email"
                        required
                    />

                    <Input
                        id="register-senha"
                        v-model="senha"
                        type="password"
                        label="Senha"
                        placeholder="Mínimo de 8 caracteres"
                        autocomplete="new-password"
                        helper-text="Mínimo de 8 caracteres"
                        :error="errors.senha"
                        required
                    />

                    <p
                        v-if="formError"

                        class="text-sm text-destructive"
                    >
                        {{ formError }}
                    </p>

                    <Button
                        label="Cadastrar"
                        variant="primary"
                        class="w-full"
                        type="submit"
                        :disabled="loading"
                    />

                    <small class="text-center text-sm">
                        Já tem conta?

                        <RouterLink
                            class="text-primary hover:underline"
                            to="/login"
                        >
                            Entrar
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
import { HttpError } from "@base/http";
import { validateCadastro } from "@shared/validators/mecarvit";
import { completeAuth, type AuthApiResponse } from "../js/auth";

export default defineComponent({
    name: "MecarvitRegisterPage",

    components: {
        Button,
        Card,
        Input
    },

    data() {
        return {
            empresaNome: "",
            nome: "",
            cpf: "",
            email: "",
            senha: "",
            loading: false,
            formError: "",
            errors: {
                empresaNome: "",
                nome: "",
                cpf: "",
                email: "",
                senha: ""
            }
        };
    },

    methods: {
        clearErrors() {
            this.formError = "";
            this.errors.empresaNome = "";
            this.errors.nome = "";
            this.errors.cpf = "";
            this.errors.email = "";
            this.errors.senha = "";
        },

        applyFields(fields: Record<string, string> | undefined) {
            if (!fields) {
                return;
            }

            this.errors.empresaNome = fields["empresa.nome"] ?? fields.empresa ?? "";
            this.errors.nome = fields["usuario.nome"] ?? fields.nome ?? "";
            this.errors.cpf = fields["usuario.cpf"] ?? fields.cpf ?? "";
            this.errors.email = fields["usuario.email"] ?? fields.email ?? "";
            this.errors.senha = fields["usuario.senha"] ?? fields.senha ?? fields.password ?? "";
        },

        async submit() {
            this.clearErrors();

            const body = {
                empresa: { nome: this.empresaNome.trim() },
                usuario: {
                    cpf: this.cpf.trim(),
                    nome: this.nome.trim(),
                    email: this.email.trim(),
                    senha: this.senha
                }
            };
            const clientErrors = validateCadastro(body);

            if (clientErrors) {
                this.applyFields(clientErrors);
                this.formError = "Verifique os campos e tente novamente.";
                return;
            }

            this.loading = true;

            try {
                const response = await this.$http.post<AuthApiResponse>("/api/cadastro", body);

                await completeAuth(this.$router, this.$route, response.data.data);
            } catch (error) {
                if (error instanceof HttpError) {
                    this.formError = error.message;
                    this.applyFields(error.fields);
                    return;
                }

                this.formError = "Não foi possível cadastrar. Tente novamente.";
            } finally {
                this.loading = false;
            }
        }
    }
});
</script>
