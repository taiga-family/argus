import toml from 'toml';

export function parseTomlFileBase64Str<T>(base64Str: string): T {
    const parsedString = Buffer.from(base64Str, 'base64').toString();

    return toml.parse(parsedString) as T;
}
