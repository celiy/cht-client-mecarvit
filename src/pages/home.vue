<template>
    <main class="flex max-w-2xl flex-col gap-6 p-8">
        <section>
            <h1 class="text-2xl font-semibold">Home</h1>

            <p class="mt-2 text-muted-foreground!">
                Área autenticada do {{ $project.labels.siteTitle }}.
            </p>
        </section>

        <Card v-if="loading">
            <template #body>
                <p class="text-muted-foreground!">Carregando perfil...</p>
            </template>
        </Card>

        <Card v-else-if="user">
            <template #header>
                <h2 class="text-lg font-semibold">Olá, {{ user.name }}</h2>
            </template>

            <template #body>
                <dl class="grid gap-3 text-sm">
                    <div>
                        <dt class="text-muted-foreground!">Email</dt>

                        <dd>
                            {{ user.email }}
                        </dd>
                    </div>

                    <div>
                        <dt class="text-muted-foreground!">ID</dt>

                        <dd>
                            {{ user.id }}
                        </dd>
                    </div>
                </dl>
            </template>

            <template #footer>
                <Button
                    label="Sair"
                    variant="secondary"

                    @click="logout"
                />
            </template>
        </Card>

        <Card v-else>
            <template #body>
                <p class="text-destructive">
                    {{ loadError || "Não foi possível carregar o perfil." }}
                </p>

                <Button
                    label="Tentar novamente"
                    variant="secondary"
                    class="mt-4"

                    @click="loadProfile"
                />
            </template>
        </Card>
    </main>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import Button from "@design/components/Button.vue";
import Card from "@design/components/Card.vue";
import { clearAuthToken, HttpError } from "@base/http";

interface PublicUser {
    id: number;
    name: string;
    email: string;
}

interface MeApiResponse {
    data: PublicUser;
}

export default defineComponent({
    name: "MecarvitHomePage",

    components: {
        Button,
        Card
    },

    data() {
        return {
            user: null as PublicUser | null,
            loading: true,
            loadError: ""
        };
    },

    mounted() {
        void this.loadProfile();
    },

    methods: {
        async loadProfile() {
            this.loading = true;
            this.loadError = "";

            try {
                const response = await this.$http.get<MeApiResponse>("/api/auth/me");
                this.user = response.data.data;
            } catch (error) {
                this.user = null;
                this.loadError =
                    error instanceof HttpError ? error.message : "Erro ao carregar perfil.";
            } finally {
                this.loading = false;
            }
        },

        async logout() {
            clearAuthToken();
            await this.$router.push("/login");
        }
    }
});
</script>
