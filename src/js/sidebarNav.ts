import { ACCESS, hasAccess } from "@shared/mecarvit/access";

export type SidebarNavLink = {
    type: "link";
    label: string;
    link: string;
    leftIcon?: string;
};

export type SidebarNavGroup = {
    type: "group";
    label: string;
    leftIcon?: string;
    openByDefault?: boolean;
    links: SidebarNavLink[];
};

export type SidebarNavItem = SidebarNavLink | SidebarNavGroup;

export type SidebarNavSection = {
    type: "section";
    label: string;
};

export type SidebarNavEntry = SidebarNavSection | SidebarNavItem;

type NavEntryDef = {
    item: SidebarNavItem;
    /** Cargo digit required to reach the item. Omitted means always visible. */
    digit?: string;
};

type NavSectionDef = {
    label?: string;
    entries: NavEntryDef[];
};

function entry(item: SidebarNavItem, digit?: string): NavEntryDef {
    return { item, digit };
}

/**
 * Navigation grouped by section.
 *
 * Digits mirror the backend route guards: an item is only reachable when the
 * corresponding endpoint accepts the cargo, so the menu never offers a page
 * that would answer 403.
 */
const NAV_SECTIONS: NavSectionDef[] = [
    {
        label: "Início",
        entries: [
            entry({
                type: "link",
                label: "Dashboard",
                link: "/home",
                leftIcon: "fa-house"
            })
        ]
    },
    {
        label: "Cadastros",
        entries: [
            entry(
                {
                    type: "group",
                    label: "Funcionários",
                    leftIcon: "fa-users",
                    links: [
                        {
                            label: "Gerenciar",
                            link: "/funcionarios"
                        },
                        {
                            label: "Cadastrar",
                            link: "/funcionarios?cadastrar=true",
                            leftIcon: "fa-plus"
                        }
                    ]
                },
                ACCESS.FUNCIONARIOS
            ),
            entry(
                {
                    type: "group",
                    label: "Clientes",
                    leftIcon: "fa-user",
                    links: [
                        {
                            label: "Gerenciar",
                            link: "/clientes"
                        },
                        {
                            label: "Cadastrar",
                            link: "/clientes?cadastrar=true",
                            leftIcon: "fa-plus"
                        }
                    ]
                },
                ACCESS.CLIENTES
            ),
            entry(
                {
                    type: "group",
                    label: "Veículos",
                    leftIcon: "fa-car",
                    links: [
                        {
                            label: "Gerenciar",
                            link: "/veiculos"
                        },
                        {
                            label: "Cadastrar",
                            link: "/veiculos?cadastrar=true",
                            leftIcon: "fa-plus"
                        }
                    ]
                },
                ACCESS.VEICULOS
            )
        ]
    },
    {
        label: "Ordens de serviço",
        entries: [
            entry(
                {
                    type: "group",
                    label: "Ordens de serviço",
                    leftIcon: "fa-wrench",
                    openByDefault: true,
                    links: [
                        {
                            label: "Gerenciar",
                            link: "/ordem-servico"
                        },
                        {
                            label: "Cadastrar",
                            link: "/ordem-servico?cadastrar=true",
                            leftIcon: "fa-plus"
                        }
                    ]
                },
                ACCESS.OS
            )
        ]
    },
    {
        label: "Financeiro",
        entries: [
            entry(
                {
                    type: "group",
                    label: "Entradas e saídas",
                    leftIcon: "fa-money-bill",
                    openByDefault: true,
                    links: [
                        {
                            label: "Gerenciar",
                            link: "/registro-entrada-saida"
                        },
                        {
                            label: "Entradas",
                            link: "/registro-entrada-saida#entradas"
                        },
                        {
                            label: "Saídas",
                            link: "/registro-entrada-saida#saidas"
                        },
                        {
                            label: "Cadastrar",
                            link: "/registro-entrada-saida?cadastrar=true",
                            leftIcon: "fa-plus"
                        }
                    ]
                },
                ACCESS.FINANCEIRO
            )
        ]
    }
];

/**
 * Sidebar entries the cargo can reach.
 *
 * A section is dropped when the cargo cannot reach any of its items, so no
 * heading is left without content.
 */
function withoutCreateIfNeeded(
    item: SidebarNavItem,
    nivel: string,
    digit?: string
): SidebarNavItem {
    if (item.type !== "group" || !digit) {
        return item;
    }

    const criar = digit.replace(/\.editar$/, ".criar");

    if (criar === digit || hasAccess(nivel, criar)) {
        return item;
    }

    return {
        ...item,
        links: item.links.filter((link) => link.leftIcon !== "fa-plus")
    };
}

export function sidebarNavItems(nivelAcesso: string | undefined): SidebarNavEntry[] {
    const nivel = String(nivelAcesso ?? "");
    const entries: SidebarNavEntry[] = [];

    for (const section of NAV_SECTIONS) {
        const allowed = section.entries.filter(
            ({ digit }) => !digit || hasAccess(nivel, digit)
        );

        if (allowed.length === 0) {
            continue;
        }

        if (section.label) {
            entries.push({ type: "section", label: section.label });
        }

        for (const { item, digit } of allowed) {
            entries.push(withoutCreateIfNeeded(item, nivel, digit));
        }
    }

    return entries;
}
