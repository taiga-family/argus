export function markCommentWithHiddenLabel(markdownText: string, label: string): string {
    return `<!-- screenshot-bot-id: ${label} -->\n${markdownText}`;
}

export function checkContainsHiddenLabel(markdownText: string, label: string): boolean {
    return markdownText.includes(`<!-- screenshot-bot-id: ${label} -->`);
}
