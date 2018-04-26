import babel from "rollup-plugin-babel";
import uglify from "rollup-plugin-uglify";
import replace from "rollup-plugin-replace";
import commonjs from "rollup-plugin-commonjs";
import resolve from "rollup-plugin-node-resolve";

const config = {
  input: "modules/index.js",
  output: {
    name: "ReactRouterConfig",
    globals: {
      react: "React",
      "react-router/Switch": "ReactRouter.Switch",
      "react-router/Router": "ReactRouter.Router",
      "react-router/Route": "ReactRouter.Route",
      "react-router/matchPath": "ReactRouter.matchPath"
    }
  },
  external: [
    "react",
    "react-router/Switch",
    "react-router/Router",
    "react-router/Route",
    "react-router/matchPath"
  ],
  plugins: [
    babel({
      exclude: "node_modules/**",
      plugins: ["external-helpers"]
    }),
    resolve(),
    commonjs({
      include: /node_modules/
    }),
    replace({
      "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV)
    })
  ]
};

if (process.env.NODE_ENV === "production") {
  config.plugins.push(uglify());
}

export default config;
