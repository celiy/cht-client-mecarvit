import type { Router } from "vue-router";
import { http } from "@base/http";

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

export function installClientPlugins(_app: unknown, router: Router): void {
    setupAuthGuard(router);
}
