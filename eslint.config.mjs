import taiga from '@taiga-ui/eslint-plugin-experience-next';

export default [
    ...taiga.configs.recommended,
    {
        ignores: ['lib', 'public'],
    },
    {
        files: ['**/*'],
        languageOptions: {
            parserOptions: {
                // files which are not covered by `tsconfig.json`
                projectService: {
                    allowDefaultProject: ['*.js', '*.mjs', 'rollup.config.ts', 'api/github/webhooks/index.js'],
                },
            },
        },
        rules: {
            // argus is a node.js app (not a browser one)
            'compat/compat': 'off',
        },
    },
];
