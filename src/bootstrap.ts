import type { App } from "vue";
import type { Router } from "vue-router";
import { http } from "@base/http";
import { onRealtimeEvent } from "@base/realtime";
import { toast } from "@design/toast/toast";
import { isCadastroRealtimePayload } from "@shared/mecarvit/realtime";
import {
    loadCurrentCompany,
    loadCurrentUser,
    mecarvitPlugin,
    mecarvit,
    isUsuarioSuperadmin,
    currentIsSuperadmin
} from "./js/mecarvit";

export function isAuthenticated(): boolean {
    return Boolean(http.getAuthToken());
}

export function setupAuthGuard(router: Router): void {
    router.beforeEach((to) => {
        const authenticated = isAuthenticated();

        if (to.meta.requiresAuth && !authenticated) {
            return {
                name: "login",
                query: to.name === "index" ? undefined : { redirect: to.fullPath }
            };
        }

        if (to.meta.guestOnly && authenticated) {
            return { name: "home" };
        }

        if (to.meta.requiresSuperadmin && !currentIsSuperadmin()) {
            return { name: "home" };
        }

        return true;
    });
}

export async function installClientPlugins(app: App, router: Router): Promise<void> {
    void router;
    app.use(mecarvitPlugin);

    await loadCurrentUser();
    await loadCurrentCompany();

    onRealtimeEvent((event) => {
        if (!isUsuarioSuperadmin(mecarvit.user ?? {})) {
            return;
        }

        if (!isCadastroRealtimePayload(event.payload)) {
            return;
        }

        toast.info(`${event.payload.actorNome} cadastrou ${event.payload.label}`);
    });
}
