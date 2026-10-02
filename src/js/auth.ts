import type { Router, RouteLocationNormalizedLoaded } from "vue-router";
import { http } from "@base/http";
import { setRealtimeEnabled } from "@base/realtime";
import { loadCurrentCompany, loadCurrentUser, clearMecarvitSession, mecarvit, type MecarvitUser } from "./mecarvit";

export type PublicUsuario = MecarvitUser;

export interface AuthApiResponse {
    data: {
        token?: string;
        usuario: PublicUsuario;
        empresa: { id: number; nome?: string };
        precisaTrocarSenha: boolean;
    };
}

export interface EmpresaLocal {
    id: number;
    nome: string;
}

export async function completeAuth(
    router: Router,
    route: RouteLocationNormalizedLoaded,
    payload: AuthApiResponse["data"]
): Promise<void> {
    await loadCurrentUser();

    if (mecarvit.user) {
        await loadCurrentCompany();
    }

    setRealtimeEnabled(Boolean(mecarvit.user));

    if (payload.precisaTrocarSenha) {
        await router.push({ name: "change-password" });
        return;
    }

    const redirect = typeof route.query.redirect === "string"
        ? route.query.redirect
        : "/home";

    await router.push(redirect);
}

export async function endSession(): Promise<void> {
    try {
        await http.post("/api/logout");
    } catch {
        void 0;
    }

    clearMecarvitSession();
    setRealtimeEnabled(false);
}
