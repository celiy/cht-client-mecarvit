export type SortDirection = "asc" | "desc";

export type SortFieldPayload = {
    field: string;
    direction: SortDirection;
};

/** UI table `field` → API `?sort=` token (ApiFeatures column / sort alias). */
const SORT_FIELD_ALIAS: Record<string, string> = {
    valorLabel: "valor",
    idLabel: "id"
};

/**
 * Builds the `sort` query value expected by ApiFeatures (`field` or `-field`).
 * Direction is inverted vs Table emit: first click (Table `desc`) → API ASC.
 */
export function toSortQuery(
    payload: SortFieldPayload | null | undefined,
    aliases: Record<string, string> = SORT_FIELD_ALIAS
): string {
    if (!payload?.field) {
        return "";
    }

    const field = aliases[payload.field] ?? payload.field;

    return payload.direction === "desc" ? field : `-${field}`;
}
