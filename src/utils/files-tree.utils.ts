import {formatBytes} from './format.utils';

export interface IFilesTreeEntry {
    path: string;
    size?: number;
}

export interface IFilesTreeNode {
    name: string;
    isFile: boolean;
    size?: number;
    children: IFilesTreeNode[];
}

export interface IFilesTreeOptions {
    maxEntries?: number;
}

export function buildFilesTree(entries: IFilesTreeEntry[]): IFilesTreeNode {
    const root: IFilesTreeNode = {name: '', isFile: false, children: []};

    for (const entry of entries) {
        const parts = entry.path.split('/').filter(Boolean);
        let node = root;

        parts.forEach((part, index) => {
            let child = node.children.find((c) => c.name === part);

            if (!child) {
                child = {name: part, isFile: false, children: []};
                node.children.push(child);
            }

            if (index === parts.length - 1) {
                child.isFile = true;
                child.size = entry.size;
            }

            node = child;
        });
    }

    return root;
}

function countFiles(node: IFilesTreeNode): number {
    return node.isFile
        ? 1
        : node.children.reduce((sum, child) => sum + countFiles(child), 0);
}

function sortChildren(children: IFilesTreeNode[]): IFilesTreeNode[] {
    return [...children].sort((a, b) => a.name.localeCompare(b.name));
}

export function renderFilesTree(
    root: IFilesTreeNode,
    {maxEntries = Infinity}: IFilesTreeOptions = {},
): string {
    const totalFiles = countFiles(root);
    const lines: string[] = [];
    const state = {printedFiles: 0, stopped: false};

    function walk(
        node: IFilesTreeNode,
        prefix: string,
        isLast: boolean,
        isRoot: boolean,
    ): void {
        if (state.stopped) {
            return;
        }

        if (!isRoot) {
            const connector = isLast ? '└─ ' : '├─ ';
            const label =
                node.isFile && node.size !== undefined
                    ? `${node.name}  ${formatBytes(node.size)}`
                    : node.name;

            lines.push(`${prefix}${connector}${label}`);

            if (node.isFile) {
                state.printedFiles += 1;

                if (state.printedFiles >= maxEntries && totalFiles > maxEntries) {
                    state.stopped = true;

                    return;
                }
            }
        }

        const childPrefix = isRoot ? prefix : `${prefix}${isLast ? '   ' : '│  '}`;

        sortChildren(node.children).forEach((child, index, all) => {
            walk(child, childPrefix, index === all.length - 1, false);
        });
    }

    walk(root, '', true, true);

    if (state.stopped) {
        lines.push(`… ${totalFiles - state.printedFiles} more files (output truncated)`);
    }

    return lines.join('\n');
}
