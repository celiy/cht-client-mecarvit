import type { App } from "vue";
import type { Router } from "vue-router";
import { http } from "@base/http";
import {
    loadCurrentCompany,
    loadCurrentUser,
    mecarvitPlugin
} from "./js/mecarvit";

export function setupAuthGuard(router: Router): void {
    router.beforeEach((to) => {
        const isAuthenticated = Boolean(http.getAuthToken());

        if (to.meta.requiresAuth && !isAuthenticated) {
            return {
                name: "login",
                query: {
                    redirect: to.fullPath
                }
            };
        }

        if (to.meta.guestOnly && isAuthenticated) {
            return { name: "home" };
        }

        return true;
    });
}

export async function installClientPlugins(app: App, router: Router): Promise<void> {
    setupAuthGuard(router);
    app.use(mecarvitPlugin);

    await loadCurrentUser();
    await loadCurrentCompany();
}
