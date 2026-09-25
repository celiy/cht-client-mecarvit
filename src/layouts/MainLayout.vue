<template>
    <main class="relative flex h-screen w-full flex-col overflow-hidden">
        <Sidebar
            :title="$mecarvit.company?.nome"
            description="Sistema Mecarvit"
            :nav-items="navItems"
        >
            <template #top-bar>
                <div class="ml-auto flex items-center pr-2">
                    <AppUpdateButton />
                </div>
            </template>

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
                                v-if="isSuperadmin"

                                label="Logs do sistema"
                                value="audit-logs"
                                icon="fa-clipboard-list"

                                @click="goToAuditLogs"
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
    </main>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";
import { clearAuthToken } from "@base/http";
import { project } from "@base/project";
import { clearMecarvitSession, currentIsSuperadmin, mecarvit } from "../js/mecarvit";
import { sidebarNavItems } from "../js/sidebarNav";
import Button from "@design/components/Button.vue";
import AppUpdateButton from "@base/components/AppUpdateButton.vue";

const router = useRouter();

const navItems = computed(() => sidebarNavItems(mecarvit.user?.nivelAcesso));
const isSuperadmin = computed(() => currentIsSuperadmin());

const themeIcon = computed(() => {
    return project.style.activeTheme === "dark" ? "fa-sun" : "fa-moon";
});

function goToProfile() {
    void router.push({ name: "usuario" });
}

function goToAuditLogs() {
    void router.push({ name: "audit-logs" });
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
