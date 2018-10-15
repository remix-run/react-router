import babel from "rollup-plugin-babel";
import replace from "rollup-plugin-replace";
import commonjs from "rollup-plugin-commonjs";
import nodeResolve from "rollup-plugin-node-resolve";
import { sizeSnapshot } from "rollup-plugin-size-snapshot";
import { uglify } from "rollup-plugin-uglify";

import pkg from "./package.json";

const input = "modules/index.js";
const name = "ReactRouter";
const globals = {
  react: "React"
};
const babelOptions = {
  exclude: "node_modules/**",
  plugins: ["external-helpers"]
};
const commonjsOptions = {
  include: "node_modules/**"
};

export default [
  {
    input,
    output: {
      file: `cjs/${pkg.name}.js`,
      format: "cjs",
      name,
      globals
    },
    external: Object.keys(globals),
    plugins: [
      babel(babelOptions),
      nodeResolve(),
      commonjs(commonjsOptions),
      replace({ "process.env.NODE_ENV": JSON.stringify("development") })
    ]
  },

  {
    input,
    output: {
      file: `cjs/${pkg.name}.min.js`,
      format: "cjs",
      name,
      globals
    },
    external: Object.keys(globals),
    plugins: [
      babel(babelOptions),
      nodeResolve(),
      commonjs(commonjsOptions),
      replace({ "process.env.NODE_ENV": JSON.stringify("production") }),
      uglify()
    ]
  },

  {
    input,
    output: {
      file: `esm/${pkg.name}.js`,
      format: "esm",
      name,
      globals
    },
    external: Object.keys(globals),
    plugins: [
      babel(babelOptions),
      nodeResolve(),
      commonjs(commonjsOptions),
      sizeSnapshot()
    ]
  },

  {
    input,
    output: {
      file: `umd/${pkg.name}.js`,
      format: "umd",
      name,
      globals
    },
    external: Object.keys(globals),
    plugins: [
      babel(babelOptions),
      nodeResolve(),
      commonjs(commonjsOptions),
      replace({ "process.env.NODE_ENV": JSON.stringify("development") }),
      sizeSnapshot()
    ]
  },

  {
    input,
    output: {
      file: `umd/${pkg.name}.min.js`,
      format: "umd",
      name,
      globals
    },
    external: Object.keys(globals),
    plugins: [
      babel(babelOptions),
      nodeResolve(),
      commonjs(commonjsOptions),
      replace({ "process.env.NODE_ENV": JSON.stringify("production") }),
      sizeSnapshot(),
      uglify()
    ]
  }
];
