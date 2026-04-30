/**
 * Main shell sidebar navigation (client-owned; not driven by cht-base configs).
 * Shape matches @design/components/custom/Sidebar.vue `navItems`.
 */
export const mainNav = [
    {
        type: "section" as const,
        label: "Mecarvit"
    },
    {
        type: "link" as const,
        label: "Index",
        link: "/"
    },
    {
        type: "link" as const,
        label: "Home",
        link: "/home"
    },
    {
        type: "link" as const,
        label: "Login",
        link: "/login"
    }
];
