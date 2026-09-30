const BYTE_UNITS = ['B', 'KB', 'MB', 'GB', 'TB'];

export function formatBytes(bytes: number): string {
    if (bytes === 0) {
        return '0 B';
    }

    const exponent = Math.min(
        Math.floor(Math.log(bytes) / Math.log(1024)),
        BYTE_UNITS.length - 1,
    );

    const value = bytes / 1024 ** exponent;

    return `${exponent === 0 ? value : value.toFixed(1)} ${BYTE_UNITS[exponent]}`;
}

export function formatDuration(ms: number): string {
    return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
}

export function truncate(text: string, maxLength: number): string {
    return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;
}

export function formatKeyValue(rows: Array<[string, string]>): string {
    const keyWidth = Math.max(0, ...rows.map(([key]) => key.length));

    return rows.map(([key, value]) => `${key.padEnd(keyWidth)}  ${value}`).join('\n');
}
