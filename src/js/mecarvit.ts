import type { App } from "vue";
import { reactive } from "vue";
import { http } from "@base/http";

export interface MecarvitUser {
    cpf: string;
    nome: string;
    email: string;
    ativo: boolean;
    senhaInicial: boolean;
    fundador: boolean;
    cargoId: number;
    empresaId: number;
    nivelAcesso: string;
    cargoNome: string;
    criadoEm: string;
    modificadoEm: string;
}

export interface MecarvitCompany {
    id: number;
    nome: string;
    criadoEm: string;
    modificadoEm: string;
}

export interface MecarvitState {
    user: MecarvitUser | null;
    company: MecarvitCompany | null;
}

export const mecarvit = reactive<MecarvitState>({
    user: null,
    company: null
});

interface MeApiResponse {
    data: MecarvitUser;
}

interface EmpresaApiResponse {
    data: MecarvitCompany;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

function isMecarvitUser(value: unknown): value is MecarvitUser {
    if (!isRecord(value)) {
        return false;
    }

    return typeof value.cpf === "string"
        && typeof value.nome === "string"
        && typeof value.email === "string"
        && typeof value.empresaId === "number";
}

function isMecarvitCompany(value: unknown): value is MecarvitCompany {
    if (!isRecord(value)) {
        return false;
    }

    return typeof value.id === "number" && typeof value.nome === "string";
}

export function setCurrentUser(user: MecarvitUser | null): void {
    mecarvit.user = user;
}

export function setCurrentCompany(company: MecarvitCompany | null): void {
    mecarvit.company = company;
}

export async function loadCurrentUser(): Promise<void> {
    if (!http.getAuthToken()) {
        setCurrentUser(null);
        return;
    }

    try {
        const response = await http.get<MeApiResponse>("/api/me");
        const user = response.data.data;

        if (!isMecarvitUser(user)) {
            setCurrentUser(null);
            return;
        }

        setCurrentUser(user);
    } catch {
        setCurrentUser(null);
    }
}

export async function loadCurrentCompany(): Promise<void> {
    if (!http.getAuthToken()) {
        setCurrentCompany(null);
        return;
    }

    try {
        const response = await http.get<EmpresaApiResponse>("/api/empresa");
        const company = response.data.data;

        if (!isMecarvitCompany(company)) {
            setCurrentCompany(null);
            return;
        }

        setCurrentCompany(company);
    } catch {
        setCurrentCompany(null);
    }
}

export function clearMecarvitSession(): void {
    setCurrentUser(null);
    setCurrentCompany(null);
}

export const mecarvitPlugin = {
    install(app: App) {
        app.config.globalProperties.$mecarvit = mecarvit;
    }
};
