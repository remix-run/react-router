import { defineConfig } from 'vite';
import path from 'path';
import { createBanner } from "../../build.utils.js";
import pkg from './package.json';
import dts from 'vite-plugin-dts';
import excludeDependenciesFromBundle from "rollup-plugin-exclude-dependencies-from-bundle";

// Create build configurations for development and production
export default defineConfig(({mode}) => {
  const enableDevWarnings = mode !== 'production';
  const outDir = enableDevWarnings ? 'development' : 'production';

  return {
    build: {
      lib: {
        entry: {
          index: path.resolve(__dirname, 'index.ts'),
          'dom-export': path.resolve(__dirname, 'dom-export.ts'),
          'lib/types/route-module': path.resolve(__dirname, 'lib/types/route-module.ts')
        },
      },
      emptyOutDir: false,
      rollupOptions: {
        external: ['react-router'],
        plugins: [
          excludeDependenciesFromBundle() as any,
        ],
        output: [
          {
            format: 'es',
            dir: `dist/${outDir}`,
            preserveModules: true,
            preserveModulesRoot: 'src',
            entryFileNames: '[name].mjs',
            banner: createBanner(pkg.name, pkg.version),
          },
          {
            format: 'cjs',
            dir: `dist/${outDir}`,
            preserveModules: true,
            preserveModulesRoot: 'src',
            entryFileNames: '[name].js',
            banner: createBanner(pkg.name, pkg.version),
            exports: 'named',
          },
        ],
      },
    },
    define: {
      'import.meta.hot': 'undefined',
      'REACT_ROUTER_VERSION': JSON.stringify(pkg.version),
      'DEV': JSON.stringify(enableDevWarnings),
    },
    plugins: [
      dts({
        outDir: `dist/${outDir}`,
        rollupTypes: true,
      }),
    ],
  };
});