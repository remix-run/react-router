import babel from "rollup-plugin-babel";
import replace from "rollup-plugin-replace";
import commonjs from "rollup-plugin-commonjs";
import nodeResolve from "rollup-plugin-node-resolve";
import { sizeSnapshot } from "rollup-plugin-size-snapshot";
import { uglify } from "rollup-plugin-uglify";

import pkg from "./package.json";

const input = "modules/index.js";
const name = "ReactRouterDOM";
const globals = {
  react: "React"
};
const babelOptionsCJS = {
  exclude: /node_modules/
};
const babelOptionsESM = {
  exclude: /node_modules/,
  runtimeHelpers: true,
  plugins: [["@babel/transform-runtime", { useESModules: true }]]
};
const commonjsOptions = {
  include: /node_modules/
};

const external = id => !id.startsWith(".") && !id.startsWith("/");

export default [
  {
    input,
    output: { file: `cjs/${pkg.name}.js`, format: "cjs" },
    external,
    plugins: [
      babel(babelOptionsCJS),
      replace({ "process.env.NODE_ENV": JSON.stringify("development") })
    ]
  },

  {
    input,
    output: { file: `cjs/${pkg.name}.min.js`, format: "cjs" },
    external,
    plugins: [
      babel(babelOptionsCJS),
      replace({ "process.env.NODE_ENV": JSON.stringify("production") }),
      uglify()
    ]
  },

  {
    input,
    output: { file: `esm/${pkg.name}.js`, format: "esm" },
    external,
    plugins: [babel(babelOptionsESM), sizeSnapshot()]
  },

  {
    input,
    output: { file: `umd/${pkg.name}.js`, format: "umd", name, globals },
    external: Object.keys(globals),
    plugins: [
      babel(babelOptionsESM),
      nodeResolve(),
      commonjs(commonjsOptions),
      replace({ "process.env.NODE_ENV": JSON.stringify("development") }),
      sizeSnapshot()
    ]
  },

  {
    input,
    output: { file: `umd/${pkg.name}.min.js`, format: "umd", name, globals },
    external: Object.keys(globals),
    plugins: [
      babel(babelOptionsESM),
      nodeResolve(),
      commonjs(commonjsOptions),
      replace({ "process.env.NODE_ENV": JSON.stringify("production") }),
      sizeSnapshot(),
      uglify()
    ]
  }
];
