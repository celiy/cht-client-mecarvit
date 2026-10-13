import { ACCESS, hasAccess } from "@shared/mecarvit/access";

export type SidebarNavLink = {
    type: "link";
    label: string;
    link: string;
    leftIcon?: string;
    rightButton?: object;
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
 * Link with a "+" button that opens the page's create modal (`?cadastrar=true`).
 */
function linkWithCreate(
    label: string,
    href: string,
    leftIcon: string,
    tooltip: string
): SidebarNavLink {
    return {
        type: "link",
        label,
        link: href,
        leftIcon,
        rightButton: {
            leftIcon: "fa-plus",
            variant: "outline",
            class: "p-1.5! mr-2 text-xs!",
            tooltip,
            appearWhen: "linkIsOpen",
            emits: `${href}?cadastrar=true`
        }
    };
}

function link(label: string, href: string, leftIcon?: string): SidebarNavLink {
    return leftIcon
        ? { type: "link", label, link: href, leftIcon }
        : { type: "link", label, link: href };
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
                linkWithCreate(
                    "Funcionários",
                    "/funcionarios",
                    "fa-users",
                    "Cadastrar funcionário"
                ),
                ACCESS.FUNCIONARIOS
            ),
            entry(
                linkWithCreate("Clientes", "/clientes", "fa-user", "Cadastrar cliente"),
                ACCESS.CLIENTES
            ),
            entry(
                linkWithCreate("Veículos", "/veiculos", "fa-car", "Cadastrar veículo"),
                ACCESS.VEICULOS
            )
        ]
    },
    {
        label: "Ordens de serviço",
        entries: [
            entry(
                linkWithCreate(
                    "Ordens de serviço",
                    "/ordem-servico",
                    "fa-wrench",
                    "Cadastrar ordem de serviço"
                ),
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
                        link("Gerenciar", "/registro-entrada-saida"),
                        link("Entradas", "/registro-entrada-saida#entradas"),
                        link("Saídas", "/registro-entrada-saida#saidas")
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
    if (!digit) {
        return item;
    }

    const criar = digit.replace(/\.editar$/, ".criar");

    if (criar === digit || hasAccess(nivel, criar)) {
        return item;
    }

    if (item.type === "link") {
        return { ...item, rightButton: undefined };
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
        const allowed = section.entries.filter(({ digit }) => !digit || hasAccess(nivel, digit));

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
