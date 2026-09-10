<template>
    <main class="flex max-w-2xl flex-col gap-6 p-8">
        <section>
            <h1 class="text-2xl font-semibold">Perfil</h1>

            <p class="mt-2 text-muted-foreground!">Dados da conta autenticada.</p>
        </section>

        <Card v-if="$mecarvit.user">
            <template #header>
                <h2 class="text-lg font-semibold">{{ $mecarvit.user.nome }}</h2>
            </template>

            <template #body>
                <dl class="grid gap-3 text-sm">
                    <div>
                        <dt class="text-foreground!">Email</dt>

                        <dd class="text-muted-foreground!">
                            {{ $mecarvit.user.email }}
                        </dd>
                    </div>

                    <div>
                        <dt class="text-foreground!">CPF</dt>

                        <dd class="text-muted-foreground!">
                            {{ $mecarvit.user.cpf }}
                        </dd>
                    </div>

                    <div>
                        <dt class="text-foreground!">Cargo</dt>

                        <dd class="text-muted-foreground!">
                            {{ $mecarvit.user.cargoNome }}
                        </dd>
                    </div>

                    <div v-if="$mecarvit.company">
                        <dt class="text-foreground!">Oficina</dt>

                        <dd class="text-muted-foreground!">
                            {{ $mecarvit.company.nome }}
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
                <p class="text-destructive!">Não foi possível carregar o perfil.</p>
            </template>
        </Card>
    </main>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import Card from "@design/components/Card.vue";
import { clearAuthToken } from "@base/http";
import { clearMecarvitSession } from "../js/mecarvit";

export default defineComponent({
    name: "MecarvitUsuarioPage",

    components: {
        Card
    },

    methods: {
        async logout() {
            clearAuthToken();
            clearMecarvitSession();
            await this.$router.push("/login");
        }
    }
});
</script>
