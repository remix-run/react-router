import babel from "rollup-plugin-babel";
import uglify from "rollup-plugin-uglify";
import replace from "rollup-plugin-replace";
import commonjs from "rollup-plugin-commonjs";
import resolve from "rollup-plugin-node-resolve";

const config = {
  output: {
    format: "umd",
    name: "ReactRouterConfig",
    globals: {
      react: "React",
      "react-router": "ReactRouter",
      "react-router/es/Route": "ReactRouter.Route",
      "react-router/es/Router": "ReactRouter.Router",
      "react-router/es/Switch": "ReactRouter.Switch",
      "react-router/es/matchPath": "ReactRouter.matchPath"
    }
  },
  external: [
    "react",
    "react-router",
    "react-router/es/Route",
    "react-router/es/Router",
    "react-router/es/Switch",
    "react-router/es/matchPath"
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
