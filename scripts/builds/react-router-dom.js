import babel from 'rollup-plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import compiler from '@ampproject/rollup-plugin-closure-compiler';
import copy from 'rollup-plugin-copy';
import ignore from 'rollup-plugin-ignore';
import nodeResolve from '@rollup/plugin-node-resolve';
import prettier from 'rollup-plugin-prettier';
import replace from '@rollup/plugin-replace';
import { terser } from 'rollup-plugin-terser';

const PRETTY = !!process.env.PRETTY;
const SOURCE_DIR = 'packages/react-router-dom';
const OUTPUT_DIR = 'build/react-router-dom';

// JS modules for bundlers
const modules = [
  {
    input: `${SOURCE_DIR}/index.js`,
    output: {
      file: `${OUTPUT_DIR}/react-router-dom.js`,
      format: 'esm',
      sourcemap: !PRETTY
    },
    external: ['history', 'prop-types', 'react', 'react-dom', 'react-router'],
    plugins: [
      babel({
        exclude: /node_modules/,
        presets: [
          ['@babel/preset-env', { loose: true }],
          '@babel/preset-react'
        ],
        plugins: ['babel-plugin-dev-expression']
      }),
      compiler(),
      copy({
        targets: [
          { src: `${SOURCE_DIR}/package.json`, dest: OUTPUT_DIR },
          { src: `${SOURCE_DIR}/README.md`, dest: OUTPUT_DIR },
          { src: 'LICENSE', dest: OUTPUT_DIR }
        ],
        verbose: true
      })
    ].concat(PRETTY ? prettier({ parser: 'babel' }) : [])
  }
];

// JS modules for <script type=module>
// Note: These are experimental. You may not even get them to work
// unless you are using a React build with JS modules like es-react.
const webModules = [
  {
    input: `${SOURCE_DIR}/index.js`,
    output: {
      file: `${OUTPUT_DIR}/react-router-dom.development.js`,
      format: 'esm',
      sourcemap: !PRETTY
    },
    external: ['history', 'prop-types', 'react', 'react-router'],
    plugins: [
      babel({
        exclude: /node_modules/,
        presets: ['@babel/preset-modules', '@babel/preset-react'],
        plugins: ['babel-plugin-dev-expression']
      }),
      replace({ 'process.env.NODE_ENV': JSON.stringify('development') }),
      compiler()
    ].concat(PRETTY ? prettier({ parser: 'babel' }) : [])
  },
  {
    input: `${SOURCE_DIR}/index.js`,
    output: {
      file: `${OUTPUT_DIR}/react-router-dom.production.min.js`,
      format: 'esm',
      sourcemap: !PRETTY
    },
    external: ['history', 'react', 'react-router'],
    plugins: [
      ignore(['prop-types']),
      babel({
        exclude: /node_modules/,
        presets: ['@babel/preset-modules', '@babel/preset-react'],
        plugins: ['babel-plugin-dev-expression']
      }),
      replace({ 'process.env.NODE_ENV': JSON.stringify('production') }),
      compiler(),
      terser({ ecma: 8, safari10: true })
    ].concat(PRETTY ? prettier({ parser: 'babel' }) : [])
  }
];

// UMD modules for <script> tags and CommonJS (node)
const globals = [
  {
    input: `${SOURCE_DIR}/index.js`,
    output: {
      file: `${OUTPUT_DIR}/umd/react-router-dom.development.js`,
      format: 'umd',
      sourcemap: !PRETTY,
      globals: {
        history: 'HistoryLibrary',
        react: 'React',
        'react-router': 'ReactRouter'
      },
      name: 'ReactRouterDOM'
    },
    external: ['history', 'react', 'react-router'],
    plugins: [
      babel({
        exclude: /node_modules/,
        presets: [
          ['@babel/preset-env', { loose: true }],
          '@babel/preset-react'
        ],
        plugins: ['babel-plugin-dev-expression']
      }),
      replace({ 'process.env.NODE_ENV': JSON.stringify('development') }),
      nodeResolve(), // for prop-types
      commonjs(), // for prop-types
      compiler()
    ].concat(PRETTY ? prettier({ parser: 'babel' }) : [])
  },
  {
    input: `${SOURCE_DIR}/index.js`,
    output: {
      file: `${OUTPUT_DIR}/umd/react-router-dom.production.min.js`,
      format: 'umd',
      sourcemap: !PRETTY,
      globals: {
        history: 'HistoryLibrary',
        react: 'React',
        'react-router': 'ReactRouter'
      },
      name: 'ReactRouterDOM'
    },
    external: ['history', 'react', 'react-router'],
    plugins: [
      ignore(['prop-types']),
      babel({
        exclude: /node_modules/,
        presets: [
          ['@babel/preset-env', { loose: true }],
          '@babel/preset-react'
        ],
        plugins: ['babel-plugin-dev-expression']
      }),
      replace({ 'process.env.NODE_ENV': JSON.stringify('production') }),
      compiler(),
      terser()
    ].concat(PRETTY ? prettier({ parser: 'babel' }) : [])
  }
];

// Node entry points
const node = [
  {
    input: `${SOURCE_DIR}/node-main.js`,
    output: {
      file: `${OUTPUT_DIR}/main.js`,
      format: 'cjs'
    },
    plugins: [compiler()].concat(PRETTY ? prettier({ parser: 'babel' }) : [])
  },
  {
    input: `${SOURCE_DIR}/server.js`,
    output: {
      file: `${OUTPUT_DIR}/server.js`,
      format: 'cjs'
    },
    external: [
      'fs',
      'path',
      'url',
      'history',
      'prop-types',
      'react',
      'react-dom/server',
      'react-router-dom'
    ],
    plugins: [
      babel({
        exclude: /node_modules/,
        presets: [
          ['@babel/preset-env', { loose: true, targets: { node: '12' } }],
          '@babel/preset-react'
        ],
        plugins: ['babel-plugin-dev-expression']
      }),
      compiler()
    ].concat(PRETTY ? prettier({ parser: 'babel' }) : [])
  }
];

export default [...modules, ...webModules, ...globals, ...node];
