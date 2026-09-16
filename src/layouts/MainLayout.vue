<template>
    <main class="relative flex h-dvh w-full flex-col overflow-hidden">
        <Sidebar
            :title="$mecarvit.company?.nome"
            description="Sistema Mecarvit"
            :nav-items="[
                {
                    type: 'section',
                    label: 'Início'
                },
                {
                    type: 'link',
                    label: 'Dashboard',
                    link: '/home',
                    leftIcon: 'fa-house'
                },

                {
                    type: 'section',
                    label: 'Cadastros'
                },
                {
                    type: 'group',
                    label: 'Funcionários',
                    leftIcon: 'fa-users',
                    links: [
                        {
                            label: 'Gerenciar',
                            link: '/funcionarios'
                        },
                        {
                            label: 'Cadastrar',
                            link: '/funcionarios?cadastrar=true',
                            leftIcon: 'fa-plus'
                        }
                    ]
                },
                {
                    type: 'group',
                    label: 'Clientes',
                    leftIcon: 'fa-user',
                    links: [
                        {
                            label: 'Gerenciar',
                            link: '/clientes'
                        },
                        {
                            label: 'Cadastrar',
                            link: '/clientes?cadastrar=true',
                            leftIcon: 'fa-plus'
                        }
                    ]
                },
                {
                    type: 'group',
                    label: 'Veículos',
                    leftIcon: 'fa-car',
                    links: [
                        {
                            label: 'Gerenciar',
                            link: '/veiculos'
                        },
                        {
                            label: 'Cadastrar',
                            link: '/veiculos?cadastrar=true',
                            leftIcon: 'fa-plus'
                        }
                    ]
                },

                {
                    type: 'section',
                    label: 'Ordens de serviço'
                },
                {
                    type: 'group',
                    label: 'Ordens de serviço',
                    leftIcon: 'fa-wrench',
                    openByDefault: true,
                    links: [
                        {
                            label: 'Gerenciar',
                            link: '/ordem-servico'
                        },
                        {
                            label: 'Cadastrar',
                            link: '/ordem-servico?cadastrar=true',
                            leftIcon: 'fa-plus'
                        }
                    ]
                },

                {
                    type: 'section',
                    label: 'Financeiro'
                },
                {
                    type: 'group',
                    label: 'Entradas e saídas',
                    leftIcon: 'fa-money-bill',
                    openByDefault: true,
                    links: [
                        {
                            label: 'Gerenciar',
                            link: '/registro-entrada-saida'
                        },
                        {
                            label: 'Entradas',
                            link: '/registro-entrada-saida#entradas'
                        },
                        {
                            label: 'Saídas',
                            link: '/registro-entrada-saida#saidas'
                        },
                        {
                            label: 'Cadastrar',
                            link: '/registro-entrada-saida?cadastrar=true',
                            leftIcon: 'fa-plus'
                        }
                    ]
                }
            ]"
        >
            <template #footer>
                <div class="text-sm">
                    <Marker separator />

                    <Popover
                        close-on-content-click
                        panel-class="p-0"
                        class="pt-2 pb-4"
                    >
                        <template #button="{ toggle, isOpen }">
                            <Button
                                variant="transparent"
                                class="flex w-full justify-start!"
                                content-position="none"

                                @click.stop="toggle"
                            >
                                <div class="flex w-full items-center justify-between">
                                    <div class="flex items-center gap-2 text-sidebar-foreground!">
                                        <span class="fa-user fa-solid" />

                                        <small>
                                            {{ $mecarvit.user?.nome }}
                                        </small>
                                    </div>

                                    <span
                                        class="fa-solid fa-angle-up transition-all"
                                        :class="{ 'rotate-180': isOpen }"
                                    />
                                </div>
                            </Button>
                        </template>

                        <div>
                            <Option
                                first
                                label="Ver perfil"
                                value="profile"
                                icon="fa-user"

                                @click="goToProfile"
                            />

                            <Option
                                label="Mudar tema"
                                value="theme"
                                :icon="themeIcon"

                                @click="toggleTheme"
                            />

                            <Marker
                                separator
                                class="my-1"
                            />

                            <Option
                                last
                                label="Sair"
                                value="logout"
                                icon="fa-right-from-bracket"
                                variant="destructive"

                                @click="logout"
                            />
                        </div>
                    </Popover>
                </div>
            </template>

            <RouterView />
        </Sidebar>

        <Toast position="bottom" />
    </main>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";
import { clearAuthToken } from "@base/http";
import { project } from "@base/project";
import { clearMecarvitSession } from "../js/mecarvit";
import Button from "@design/components/Button.vue";

const router = useRouter();

const themeIcon = computed(() => {
    return project.style.activeTheme === "dark" ? "fa-sun" : "fa-moon";
});

function goToProfile() {
    void router.push({ name: "usuario" });
}

function toggleTheme() {
    const next = project.style.activeTheme === "dark" ? "light" : "dark";

    project.style.theme(next);
}

async function logout() {
    clearAuthToken();
    clearMecarvitSession();
    await router.push({ name: "login" });
}
</script>
