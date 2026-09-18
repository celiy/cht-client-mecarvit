<template>
    <main class="p-8">
        <Card v-if="$mecarvit.user">
            <template #header>
                <h2 class="text-lg font-semibold">
                    Meu perfil
                </h2>
            </template>

            <template #body>
                <FormRenderer
                    ref="profileForm"
                    form-id="usuario-profile-form"
                    :fields="profileFields"
                    :values="profileValues"
                    :section-columns="1"

                    @submit="onSaveProfile"
                />

                <div class="mt-4 flex flex-wrap gap-2">
                    <Button
                        type="button"
                        variant="secondary"
                        label="Alterar senha"

                        @click="goChangePassword"
                    />
                </div>
            </template>

            <template #footer>
                <div class="flex flex-wrap justify-end gap-2">
                    <Button
                        type="submit"
                        form="usuario-profile-form"
                        variant="primary"
                        label="Salvar"
                        :disabled="profileSaving"
                    />

                    <Button
                        type="button"
                        variant="secondary"
                        label="Sair"

                        @click="logout"
                    />
                </div>
            </template>
        </Card>

        <Card v-else>
            <template #body>
                <p class="text-destructive!">Não foi possível carregar o perfil.</p>
            </template>
        </Card>
    </main>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import type { FormField } from "@shared/interfaces/FormField";
import Card from "@design/components/Card.vue";
import Button from "@design/components/Button.vue";
import FormRenderer from "@design/components/form/FormRenderer.vue";
import { clearAuthToken } from "@base/http";
import { clearMecarvitSession, loadCurrentUser, mecarvit } from "../js/mecarvit";
import { documentDigits, notifyHttpError } from "../js/crudHttp";
import { HttpError } from "@base/http";

type ProfileFormExpose = {
    applyFieldErrors: (errors: Record<string, string>) => void;
};

export default defineComponent({
    name: "MecarvitUsuarioPage",

    components: {
        Button,
        Card,
        FormRenderer
    },

    data() {
        return {
            profileSaving: false,
            profileValues: {
                nome: "",
                email: "",
                cpf: "",
                cargoNome: "",
                empresaNome: ""
            }
        };
    },

    computed: {
        profileFields(): FormField[] {
            return [
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
                    readonly: true
                },
                {
                    id: "cargoNome",
                    label: "Cargo",
                    type: "text",
                    readonly: true
                },
                {
                    id: "empresaNome",
                    label: "Oficina",
                    type: "text",
                    readonly: true
                }
            ];
        }
    },

    mounted() {
        this.syncProfileFromSession();
    },

    methods: {
        profileFormRef(): ProfileFormExpose | undefined {
            return this.$refs.profileForm as ProfileFormExpose | undefined;
        },

        syncProfileFromSession() {
            const user = mecarvit.user;

            if (!user) {
                return;
            }

            this.profileValues = {
                nome: user.nome ?? "",
                email: user.email ?? "",
                cpf: user.cpf ?? "",
                cargoNome: user.cargoNome ?? "",
                empresaNome: mecarvit.company?.nome ?? ""
            };
        },

        goChangePassword() {
            void this.$router.push("/trocar-senha");
        },

        async onSaveProfile(payload: Record<string, unknown>) {
            const cpf = documentDigits(mecarvit.user?.cpf);

            if (!cpf) {
                return;
            }

            this.profileSaving = true;

            try {
                await this.$http.put(`/api/usuario/${cpf}`, {
                    nome: String(payload.nome ?? "").trim(),
                    email: String(payload.email ?? "").trim()
                });
                await loadCurrentUser();
                this.syncProfileFromSession();
                this.$toast.success("Perfil atualizado.");
            } catch (error) {
                if (error instanceof HttpError) {
                    notifyHttpError(
                        this.$toast,
                        error,
                        "Não foi possível salvar o perfil.",
                        this.profileFormRef()
                    );
                } else {
                    this.$toast.error("Não foi possível salvar o perfil.");
                }
            } finally {
                this.profileSaving = false;
            }
        },

        async logout() {
            clearAuthToken();
            clearMecarvitSession();
            await this.$router.push("/login");
        }
    }
});
</script>
