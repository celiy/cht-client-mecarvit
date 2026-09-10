import type { Router, RouteLocationNormalizedLoaded } from "vue-router";
import { persistAuthToken } from "@base/http";
import { loadCurrentCompany, loadCurrentUser, type MecarvitUser } from "./mecarvit";

export type PublicUsuario = MecarvitUser;

export interface AuthApiResponse {
    data: {
        token: string;
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
    persistAuthToken(payload.token);

    await loadCurrentUser();
    await loadCurrentCompany();

    if (payload.precisaTrocarSenha) {
        await router.push({ name: "change-password" });
        return;
    }

    const redirect = typeof route.query.redirect === "string"
        ? route.query.redirect
        : "/home";

    await router.push(redirect);
}
