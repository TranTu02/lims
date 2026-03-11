export function randomSafe(length: number = 6): string {
    const chars = "123456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPRSTUVWXYZ";
    return Array.from(
        {
            length: Math.max(length, 6),
        },
        () => chars[Math.floor(Math.random() * chars.length)],
    ).join("");
}
