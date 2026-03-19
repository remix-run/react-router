import { createRequire } from "node:module";
import { fixupPluginRules } from "@eslint/compat";
import { defineConfig } from "eslint/config";

const require = createRequire(import.meta.url);
const eslintRequire = createRequire(require.resolve("eslint/package.json"));

const globals = eslintRequire("globals");
const reactAppConfig = require("eslint-config-react-app");

const flowtypePlugin = fixupPluginRules(require("eslint-plugin-flowtype"));
const importPlugin = fixupPluginRules(require("eslint-plugin-import"));
const jestPlugin = fixupPluginRules(require("eslint-plugin-jest"));
const jsdocPlugin = fixupPluginRules(require("eslint-plugin-jsdoc"));
const jsxA11yPlugin = fixupPluginRules(require("eslint-plugin-jsx-a11y"));
const reactPlugin = fixupPluginRules(require("eslint-plugin-react"));
const reactHooksPlugin = fixupPluginRules(require("eslint-plugin-react-hooks"));
const tsEslintPlugin = fixupPluginRules(
  require("@typescript-eslint/eslint-plugin"),
);
const tsParser = require("@typescript-eslint/parser");

const reactAppTsOverride = reactAppConfig.overrides.find(
  (config: { files?: string[] }) => config.files?.includes("**/*.ts?(x)"),
);

if (!reactAppTsOverride) {
  throw new Error("Could not find the react-app TypeScript override.");
}

const jestRecommended = jestPlugin.configs["flat/recommended"];

function normalizeGlobals(globalsToNormalize: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(globalsToNormalize).map(([name, value]) => [
      name.trim(),
      value,
    ]),
  );
}

function disableGlobals(globalsToDisable: Record<string, unknown>) {
  return Object.fromEntries(
    Object.keys(globalsToDisable).map((name) => [name, "off"] as const),
  );
}

const codeFiles = ["**/*.{js,mjs,cjs,jsx,ts,tsx}"];
const reactRouterFiles = ["packages/react-router/**/*.{js,mjs,cjs,jsx,ts,tsx}"];
const browserGlobals = normalizeGlobals(globals.browser);
const commonJsGlobals = normalizeGlobals(globals.commonjs);
const nodeGlobals = normalizeGlobals(globals.node);
const jestGlobals = normalizeGlobals(globals.jest);

export default defineConfig([
  {
    ignores: [
      "fixtures/**",
      "node_modules/**",
      "pnpm-lock.yaml",
      "docs/api/**",
      "examples/**/dist/**",
      "worker-configuration.d.ts",
      "playground/**",
      "playground-local/**",
      "integration/helpers/**/dist/**",
      "integration/helpers/**/build/**",
      "playwright-report/**",
      "test-results/**",
      "build.utils.d.ts",
      ".wrangler/**",
      "**/.wrangler/**",
      ".tmp/**",
      ".react-router/**",
      "**/.react-router/**",
      "packages/**/dist/**",
      "packages/react-router-dom/server.d.ts",
      "packages/react-router-dom/server.js",
      "packages/react-router-dom/server.mjs",
      "tutorial/dist/**",
      "public/**",
    ],
  },
  {
    linterOptions: {
      reportUnusedDisableDirectives: "warn",
    },
  },
  {
    files: codeFiles,
    languageOptions: {
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...browserGlobals,
        ...commonJsGlobals,
        ...nodeGlobals,
        ...jestGlobals,
      },
    },
    plugins: {
      flowtype: flowtypePlugin,
      import: importPlugin,
      "jsx-a11y": jsxA11yPlugin,
      react: reactPlugin,
      "react-hooks": reactHooksPlugin,
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: {
      ...reactAppConfig.rules,
      "import/first": "off",
      "react/jsx-uses-react": "warn",
      "react/jsx-uses-vars": "warn",
    },
  },
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
        warnOnUnsupportedTypeScriptVersion: true,
      },
    },
    plugins: {
      "@typescript-eslint": tsEslintPlugin,
    },
    rules: {
      ...reactAppTsOverride.rules,
      "@typescript-eslint/consistent-type-imports": [
        "error",
        {
          disallowTypeAnnotations: false,
        },
      ],
    },
  },
  {
    files: ["**/__tests__/**/*.{js,mjs,cjs,jsx,ts,tsx}"],
    plugins: {
      jest: jestPlugin,
    },
    languageOptions: jestRecommended.languageOptions,
    rules: jestRecommended.rules,
  },
  {
    files: ["integration/**/*.{js,mjs,cjs,jsx,ts,tsx}"],
    languageOptions: {
      globals: disableGlobals(jestGlobals),
    },
    rules: {
      "react-hooks/rules-of-hooks": "off",
    },
  },
  {
    files: reactRouterFiles,
    rules: {
      strict: "off",
      "import/no-nodejs-modules": "error",
      "no-restricted-globals": [
        "error",
        {
          name: "__dirname",
          message: "Node globals are not allowed in this package.",
        },
        {
          name: "__filename",
          message: "Node globals are not allowed in this package.",
        },
        {
          name: "Buffer",
          message: "Node globals are not allowed in this package.",
        },
      ],
    },
  },
  {
    files: ["packages/react-router/__tests__/**/*.{js,mjs,cjs,jsx,ts,tsx}"],
    rules: {
      "import/no-nodejs-modules": "off",
      "no-console": "off",
      "no-restricted-globals": "off",
    },
  },
  {
    files: [
      "packages/react-router/lib/server-runtime/**/*.{js,mjs,cjs,jsx,ts,tsx}",
    ],
    rules: {
      "no-restricted-syntax": "off",
    },
  },
  {
    files: ["packages/react-router-dev/config/default-rsc-entries/*"],
    rules: {
      "@typescript-eslint/consistent-type-imports": "off",
    },
  },
  {
    files: [
      "packages/react-router/lib/components.tsx",
      "packages/react-router/lib/hooks.tsx",
      "packages/react-router/lib/dom/lib.tsx",
      "packages/react-router/lib/dom/ssr/components.tsx",
      "packages/react-router/lib/dom/ssr/server.tsx",
      "packages/react-router/lib/dom-export/hydrated-router.tsx",
      "packages/react-router/lib/dom/server.tsx",
      "packages/react-router/lib/router/utils.ts",
      "packages/react-router/lib/rsc/browser.tsx",
      "packages/react-router/lib/rsc/server.rsc.ts",
      "packages/react-router/lib/rsc/server.ssr.tsx",
      "packages/react-router/lib/rsc/html-stream/browser.ts",
    ],
    plugins: {
      jsdoc: jsdocPlugin,
    },
    rules: {
      "jsdoc/check-access": "error",
      "jsdoc/check-alignment": "error",
      "jsdoc/check-param-names": "error",
      "jsdoc/check-property-names": "error",
      "jsdoc/check-tag-names": [
        "error",
        {
          definedTags: ["additionalExamples", "category", "mode"],
        },
      ],
      "jsdoc/no-defaults": "error",
      "jsdoc/no-multi-asterisks": ["error", { allowWhitespace: true }],
      "jsdoc/require-description": "error",
      "jsdoc/require-param": ["error", { enableRootFixer: false }],
      "jsdoc/require-param-description": "error",
      "jsdoc/require-param-name": "error",
      "jsdoc/require-returns": "error",
      "jsdoc/require-returns-check": "error",
      "jsdoc/require-returns-description": "error",
      "jsdoc/sort-tags": [
        "error",
        {
          tagSequence: [
            {
              tags: ["description"],
            },
            {
              tags: ["example"],
            },
            {
              tags: ["additionalExamples"],
            },
            {
              tags: [
                "name",
                "public",
                "private",
                "category",
                "mode",
                "param",
                "returns",
              ],
            },
          ],
        },
      ],
    },
  },
]);
