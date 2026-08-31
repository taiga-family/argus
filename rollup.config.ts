import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import nodeResolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';

const config = {
    input: 'src/github-action.ts',
    output: {
        esModule: true,
        file: 'public/index.js',
        format: 'es',
        sourcemap: true,
        inlineDynamicImports: true,
    },
    plugins: [
        json(),
        typescript({compilerOptions: {module: 'esnext'}}),
        nodeResolve({preferBuiltins: true}),
        commonjs({transformMixedEsModules: true}),
    ],
};

export default config;
