import type { RouteRecordRaw } from "vue-router";

import MainLayout from "./layouts/MainLayout.vue";
import IndexPage from "./pages/index.vue";
import HomePage from "./pages/home.vue";
import LoginPage from "./pages/login.vue";
import RegisterPage from "./pages/register.vue";
import ChangePasswordPage from "./pages/changePassword.vue";
import FuncionariosPage from "./pages/cadastros/funcionarios.vue";
import ClientesPage from "./pages/cadastros/clientes.vue";
import VeiculosPage from "./pages/cadastros/veiculos.vue";
import OrdemServicoPage from "./pages/ordem-servico/ordem-servico.vue";
import EntradasSaidasPage from "./pages/financeiro/entradas-saidas.vue";
import UsuarioPage from "./pages/usuario.vue";
import NotFoundPage from "@design/components/custom/NotFoundPage.vue";

const notFoundProps = {
    homeHref: "/home"
};

const routes: RouteRecordRaw[] = [
    {
        path: "/login",
        name: "login",
        component: LoginPage,
        meta: {
            guestOnly: true
        }
    },
    {
        path: "/register",
        name: "register",
        component: RegisterPage,
        meta: {
            guestOnly: true
        }
    },
    {
        path: "/trocar-senha",
        name: "change-password",
        component: ChangePasswordPage,
        meta: {
            requiresAuth: true
        }
    },
    {
        path: "/",
        component: MainLayout,
        meta: {
            requiresAuth: true
        },
        children: [
            { path: "", name: "index", component: IndexPage },
            { path: "home", name: "home", component: HomePage },
            { path: "usuario", name: "usuario", component: UsuarioPage },
            { path: "funcionarios", name: "funcionarios", component: FuncionariosPage },
            { path: "clientes", name: "clientes", component: ClientesPage },
            { path: "veiculos", name: "veiculos", component: VeiculosPage },
            { path: "ordem-servico", name: "ordem-servico", component: OrdemServicoPage },
            {
                path: "registro-entrada-saida",
                name: "registro-entrada-saida",
                component: EntradasSaidasPage
            },
            {
                path: ":pathMatch(.*)*",
                name: "not-found",
                component: NotFoundPage,
                props: notFoundProps
            }
        ]
    },
    {
        path: "/:pathMatch(.*)*",
        name: "not-found-public",
        component: NotFoundPage,
        props: notFoundProps
    }
];

export default routes;
