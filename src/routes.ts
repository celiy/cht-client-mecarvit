import type { RouteRecordRaw } from "vue-router";

import MainLayout from "./layouts/MainLayout.vue";
import IndexPage from "./pages/index.vue";
import HomePage from "./pages/home.vue";
import LoginPage from "./pages/login.vue";
import RegisterPage from "./pages/register.vue";

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
        path: "/",
        component: MainLayout,
        meta: {
            requiresAuth: true
        },
        children: [
            { path: "", name: "index", component: IndexPage },
            { path: "home", name: "home", component: HomePage }
        ]
    }
];

export default routes;
