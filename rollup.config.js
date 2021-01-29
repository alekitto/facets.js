import autoprefixer from 'autoprefixer';
import babel from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import { dirname } from 'path';
import pkg from './package.json';
import postcss from 'postcss';
import resolve from '@rollup/plugin-node-resolve';
import scss from 'rollup-plugin-scss';
import typescript from '@rollup/plugin-typescript';
import url from 'postcss-url';

const plugins = [
    scss({
        processor: css => postcss([
            url([
                { filter: '**/*.{woff2,woff,eot,ttf}', url: 'copy', basePath: __dirname + '/styles/icons', assetsPath: __dirname + '/dist/icons', useHash: true },
            ]),
            url([
                { filter: '**/*.{woff2,woff,eot,ttf}', url: 'rebase', assetsPath: './icons' },
            ]),
            autoprefixer(),
        ]),
        output: dirname(pkg.main) + '/facets-js.css',
    }),
    babel({
        exclude: 'node_modules/**',
        babelHelpers: 'runtime',
    }),
];

export default [
    // browser-friendly UMD build
    {
        input: 'facets-js.ts',
        output: {
            name: 'FacetsJs',
            file: pkg.browser,
            format: 'umd'
        },
        plugins: [
            ...plugins,
            typescript({ declaration: false }),
            resolve(),
            commonjs(),
        ]
    },
    {
        input: 'facets-js.ts',
        external: [ 'event-target-shim' ],
        output: {
            dir: dirname(pkg.module),
            format: 'es'
        },
        plugins: [
            ...plugins,
            typescript({
                declaration: true,
                declarationDir: dirname(pkg.module),
                exclude: [
                    "./dist/**/*",
                    "./node_modules/**/*"
                ],
            }),
        ]
    },
    {
        input: 'facets-js.ts',
        external: [ 'event-target-shim' ],
        output: {
            file: pkg.main,
            format: 'cjs'
        },
        plugins: [
            ...plugins,
            typescript({ declaration: false }),
        ]
    },
    {
        input: 'example/main.ts',
        output: {
            file: 'dist/example.bundle.js',
            format: 'iife', // immediately-invoked function expression — suitable for <script> tags
            sourcemap: true
        },
        plugins: [
            ...plugins,
            typescript({ declaration: false, tsconfig: './example/tsconfig.json' }),
            resolve(),
            commonjs(),
        ]
    }
];
