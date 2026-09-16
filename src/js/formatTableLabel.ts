/**
 * Sentence-style label for table cells (pt-BR): "em andamento" → "Em andamento".
 */
export function formatTableLabel(text: string): string {
    const trimmed = text.trim();

    if (!trimmed) {
        return "—";
    }

    return trimmed.charAt(0).toLocaleUpperCase("pt-BR") + trimmed.slice(1);
}
