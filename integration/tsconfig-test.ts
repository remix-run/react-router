import { test, expect } from "@playwright/test";
import fse from "fs-extra";
import path from "path";
import JSON5 from "json5";
import type { TsConfigJson } from "type-fest";

import { createFixture, json } from "./helpers/create-fixture";

async function getTsConfig(
  projectDir: string,
  configType: "tsconfig.json" | "jsconfig.json" = "tsconfig.json"
) {
  let configPath = path.join(projectDir, configType);
  let config = await fse.readFile(configPath, "utf8");
  return JSON5.parse(config);
}

// Omit non JSON-serializable things we don't need
type SerializableTsConfigJson = Omit<
  TsConfigJson,
  "compilerOptions" | "references" | "typeAcquisition" | "watchOptions"
> & {
  compilerOptions: Omit<TsConfigJson.CompilerOptions, "plugins">;
};
// this is the default tsconfig.json that is shipped with `create-remix` templates
const DEFAULT_CONFIG: SerializableTsConfigJson = {
  include: ["remix.env.d.ts", "**/*.ts", "**/*.tsx"],
  compilerOptions: {
    allowJs: true,
    esModuleInterop: true,
    forceConsistentCasingInFileNames: true,
    isolatedModules: true,
    jsx: "react-jsx",
    lib: ["DOM", "DOM.Iterable", "ES2019"],
    moduleResolution: "node",
    noEmit: true,
    resolveJsonModule: true,
    strict: true,
    target: "ES2019",
    baseUrl: ".",
  },
};

// besides baseUrl, due to an upstream issue in tsconfig-paths
// https://github.com/dividab/tsconfig-paths/pull/208
test("should output default tsconfig if file is empty", async () => {
  let fixture = await createFixture({
    future: { v2_routeConvention: true },
    files: {
      "tsconfig.json": json({ compilerOptions: { baseUrl: "." } }),
    },
  });

  let tsconfig = await getTsConfig(fixture.projectDir);
  expect(tsconfig).toEqual(DEFAULT_CONFIG);
});

test("should add/update mandatory config", async () => {
  let config = {
    ...DEFAULT_CONFIG,
    compilerOptions: {
      ...DEFAULT_CONFIG.compilerOptions,
      isolatedModules: false, // true is required by esbuild
    },
  };
  delete config.compilerOptions.moduleResolution; // this is required by esbuild
  let fixture = await createFixture({
    future: { v2_routeConvention: true },
    files: { "tsconfig.json": json(config) },
  });

  let tsconfig = await getTsConfig(fixture.projectDir);
  expect(tsconfig).toEqual(DEFAULT_CONFIG);
});

test("shouldn't change suggested config if set", async () => {
  let config = {
    ...DEFAULT_CONFIG,
    compilerOptions: {
      ...DEFAULT_CONFIG.compilerOptions,
      strict: false,
      moduleResolution: "NodeNext",
    },
  };

  let fixture = await createFixture({
    future: { v2_routeConvention: true },
    files: {
      "tsconfig.json": json(config),
    },
  });

  let tsconfig = await getTsConfig(fixture.projectDir);
  expect(tsconfig).toEqual(config);
});

test("shouldn't change suggested config for moduleResolution: bundler", async () => {
  let config = {
    ...DEFAULT_CONFIG,
    compilerOptions: {
      ...DEFAULT_CONFIG.compilerOptions,
      strict: false,
      moduleResolution: "bundler",
    },
  };

  let fixture = await createFixture({
    future: { v2_routeConvention: true },
    files: {
      "tsconfig.json": json(config),
    },
  });

  let tsconfig = await getTsConfig(fixture.projectDir);
  expect(tsconfig).toEqual(config);
});

test("allows for `extends` in tsconfig", async () => {
  let config = {
    extends: "./tsconfig.base.json",
  };

  let baseConfig = {
    compilerOptions: {
      allowJs: true,
      baseUrl: ".",
    },
  };

  let fixture = await createFixture({
    future: { v2_routeConvention: true },
    files: {
      "tsconfig.json": json(config),
      "tsconfig.base.json": json(baseConfig),
    },
  });

  let tsconfig = await getTsConfig(fixture.projectDir);

  // our base config only sets a few options, so our local config should fill in the missing ones
  let expected = JSON.parse(JSON.stringify({ ...DEFAULT_CONFIG }));
  // these were defined by the base config
  delete expected.compilerOptions.allowJs;
  delete expected.compilerOptions.baseUrl;

  expect(tsconfig).toEqual({
    extends: "./tsconfig.base.json",
    ...expected,
  });
});

test("works with jsconfig", async () => {
  let config = {
    compilerOptions: DEFAULT_CONFIG.compilerOptions,
  };

  let fixture = await createFixture({
    future: { v2_routeConvention: true },
    files: {
      "jsconfig.json": json(config),
    },
  });

  let jsconfig = await getTsConfig(fixture.projectDir, "jsconfig.json");
  expect(jsconfig).toEqual({
    ...config,
    include: ["**/*.js", "**/*.jsx"],
  });
});
