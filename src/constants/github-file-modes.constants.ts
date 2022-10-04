export const enum GithubFileMode {
    Blob = '100644',
    ExecutableBlob = '100755',
    Tree = '040000',
    Commit = '160000',
    Symlink = '120000',
}
