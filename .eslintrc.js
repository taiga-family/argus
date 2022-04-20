/**
 * @type {import('eslint').Linter.Config}
 */
module.exports = {
    env: {
        es2021: true,
        node: true,
    },
    extends: ['@tinkoff/eslint-config/app', '@tinkoff/eslint-config-angular'],
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: [require.resolve('./tsconfig.json')],
    },
    ignorePatterns: ['lib'],
    plugins: ['@typescript-eslint'],
    rules: {
        '@typescript-eslint/ban-ts-comment': 'off',
    },
};
