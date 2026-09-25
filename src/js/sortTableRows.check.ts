import { toSortQuery, type SortFieldPayload } from "./sortTableRows";

function assertEqual(actual: unknown, expected: unknown, label: string) {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    }
}

assertEqual(toSortQuery({ field: "nome", direction: "asc" }), "-nome", "asc -> API desc");
assertEqual(toSortQuery({ field: "nome", direction: "desc" }), "nome", "desc -> API asc");
assertEqual(toSortQuery({ field: "valorLabel", direction: "desc" }), "valor", "alias + invert");
assertEqual(toSortQuery({ field: "idLabel", direction: "asc" }), "-id", "id alias + invert");
assertEqual(toSortQuery(null), "", "empty");

const payload: SortFieldPayload = { field: "statusBadge", direction: "asc" };

assertEqual(toSortQuery(payload), "-statusBadge", "passthrough + invert");

console.log("toSortQuery ok");
