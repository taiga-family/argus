export function toCamelCase(str: string): string {
    return str
        .toLowerCase()
        .replace(/[^a-z0-9](.)/g, (_, x) => x.toUpperCase());
}
