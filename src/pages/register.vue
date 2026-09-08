<template>
    <main class="flex min-h-dvh items-center justify-center p-6">
        <Card class="w-full max-w-md">
            <template #header>
                <h1 class="text-xl font-semibold">
                    Criar conta
                </h1>

                <p class="text-sm text-muted-foreground!">
                    Cadastre-se com nome, email e senha.
                </p>
            </template>

            <template #body>
                <form class="flex flex-col gap-4" @submit.prevent="submit">
                    <Input
                        id="register-name"
                        v-model="name"
                        type="text"
                        label="Nome"
                        placeholder="Seu nome"
                        autocomplete="name"
                        :error="errors.name"
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
                        id="register-password"
                        v-model="password"
                        type="password"
                        label="Senha"
                        placeholder="Mínimo de 8 caracteres"
                        autocomplete="new-password"
                        :error="errors.password"
                        required
                    />

                    <p v-if="formError" class="text-sm text-destructive">
                        {{ formError }}
                    </p>

                    <Button
                        label="Cadastrar"
                        variant="primary"
                        class="w-full"
                        type="submit"
                        :disabled="loading"
                    />

                    <p class="text-sm text-muted-foreground text-center">
                        Já tem conta?

                        <RouterLink class="text-primary hover:underline" to="/login">
                            Entrar
                        </RouterLink>
                    </p>
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
import { HttpError, persistAuthToken } from "@base/http";

interface AuthApiResponse {
    data: {
        token: string;
    };
}

export default defineComponent({
    name: "MecarvitRegisterPage",

    components: {
        Button,
        Card,
        Input
    },

    data() {
        return {
            name: "",
            email: "",
            password: "",
            loading: false,
            formError: "",
            errors: {
                name: "",
                email: "",
                password: ""
            }
        };
    },

    methods: {
        clearErrors() {
            this.formError = "";
            this.errors.name = "";
            this.errors.email = "";
            this.errors.password = "";
        },

        async submit() {
            this.clearErrors();
            this.loading = true;

            try {
                const response = await this.$http.post<AuthApiResponse>("/api/auth/register", {
                    name: this.name.trim(),
                    email: this.email.trim(),
                    password: this.password
                });

                persistAuthToken(response.data.data.token);
                await this.$router.push("/home");
            } catch (error) {
                if (error instanceof HttpError) {
                    this.formError = error.message;
                    this.errors.name = error.fields?.name ?? "";
                    this.errors.email = error.fields?.email ?? "";
                    this.errors.password = error.fields?.password ?? "";

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
