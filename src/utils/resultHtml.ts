/**
 * Converts shorthand characters in an analysis result string to HTML tags.
 *
 * Rules (applied on blur):
 *   ^ at odd occurrence  → <sup>
 *   ^ at even occurrence → </sup>
 *   _ at odd occurrence  → <sub>
 *   _ at even occurrence → </sub>
 *   * → × (multiplication sign, U+00D7)
 *
 * Example:  "H_2_O^2^" → "H<sub>2</sub>O<sup>2</sup>"
 */
export function convertResultToHtml(raw: string): string {
    let supCount = 0;
    let subCount = 0;
    let result = "";

    for (let i = 0; i < raw.length; i++) {
        const ch = raw[i];
        if (ch === "^") {
            supCount++;
            result += supCount % 2 === 1 ? "<sup>" : "</sup>";
        } else if (ch === "_") {
            subCount++;
            result += subCount % 2 === 1 ? "<sub>" : "</sub>";
        } else if (ch === "*") {
            result += "×";
        } else {
            result += ch;
        }
    }

    return result;
}

/**
 * Strips HTML tags to get a plain-text representation for the input field.
 * Converts <sup>/<sub>/× back to shorthand so the user can re-edit naturally.
 */
export function htmlToResultShorthand(html: string): string {
    return html
        .replace(/<sup>/gi, "^")
        .replace(/<\/sup>/gi, "^")
        .replace(/<sub>/gi, "_")
        .replace(/<\/sub>/gi, "_")
        .replace(/×/g, "*")
        .replace(/<[^>]+>/g, ""); // strip any remaining tags
}
