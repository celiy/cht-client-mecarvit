import type { App } from "vue";
import type { Router } from "vue-router";
import { http } from "@base/http";
import {
    loadCurrentCompany,
    loadCurrentUser,
    mecarvitPlugin
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

        return true;
    });
}

export async function installClientPlugins(app: App, router: Router): Promise<void> {
    app.use(mecarvitPlugin);

    await loadCurrentUser();
    await loadCurrentCompany();
}
