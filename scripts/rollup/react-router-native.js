import babel from 'rollup-plugin-babel';
import compiler from '@ampproject/rollup-plugin-closure-compiler';
import copy from 'rollup-plugin-copy';
import prettier from 'rollup-plugin-prettier';

import tscPlugin from './tsc-plugin.js';

const PRETTY = !!process.env.PRETTY;
const SOURCE_DIR = 'packages/react-router-native';
const OUTPUT_DIR = 'build/react-router-native';

export default function() {
  const modules = [
    {
      input: `${SOURCE_DIR}/index.tsx`,
      output: {
        file: `${OUTPUT_DIR}/index.js`,
        format: 'esm',
        sourcemap: !PRETTY
      },
      external: [
        '@babel/runtime/helpers/esm/extends',
        '@babel/runtime/helpers/esm/objectWithoutPropertiesLoose',
        '@ungap/url-search-params',
        'history',
        'prop-types',
        'react',
        'react-native',
        'react-router'
      ],
      plugins: [
        tscPlugin(),
        babel({
          exclude: /node_modules/,
          runtimeHelpers: true,
          presets: [
            [
              'module:metro-react-native-babel-preset',
              {
                disableImportExportTransform: true,
                enableBabelRuntime: false
              }
            ]
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

  return modules;
}
