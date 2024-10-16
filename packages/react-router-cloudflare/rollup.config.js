const path = require("node:path");

const babel = require("@rollup/plugin-babel").default;
const nodeResolve = require("@rollup/plugin-node-resolve").default;
const typescript = require("@rollup/plugin-typescript");
const copy = require("rollup-plugin-copy");

const {
  isBareModuleId,
  getBuildDirectories,
  createBanner,
  sharedBabelConfig,
  WATCH,
} = require("../../rollup.utils");
const { name: packageName, version } = require("./package.json");

/** @returns {import("rollup").RollupOptions[]} */
module.exports = function rollup() {
  const { SOURCE_DIR, OUTPUT_DIR } = getBuildDirectories(
    packageName,
    // We don't live in a folder matching our package name
    "react-router-cloudflare"
  );

  return [
    {
      external: (id) => isBareModuleId(id),
      input: `${SOURCE_DIR}/index.ts`,
      output: {
        banner: createBanner(packageName, version),
        dir: OUTPUT_DIR,
        format: "cjs",
        preserveModules: true,
        exports: "named",
      },
      plugins: [
        babel(sharedBabelConfig),
        typescript({
          tsconfig: path.join(__dirname, "tsconfig.json"),
          noEmitOnError: !WATCH,
          noForceEmit: true,
        }),
        nodeResolve({ extensions: [".ts"] }),
        copy({
          targets: [{ src: "LICENSE.md", dest: SOURCE_DIR }],
        }),
      ],
    },
  ];
};
