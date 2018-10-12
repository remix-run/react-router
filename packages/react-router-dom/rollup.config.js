import alias from "rollup-plugin-alias";
import babel from "rollup-plugin-babel";
import uglify from "rollup-plugin-uglify";
import replace from "rollup-plugin-replace";
import commonjs from "rollup-plugin-commonjs";
import resolve from "rollup-plugin-node-resolve";

const config = {
  output: {
    name: "ReactRouterDOM",
    globals: {
      react: "React"
    }
  },
  external: ["react"],
  plugins: [
    alias({
      "react-router":
        process.env.NODE_ENV === "production"
          ? "../react-router/esm/react-router.min.js"
          : "../react-router/esm/react-router.js"
    }),
    babel({
      exclude: "node_modules/**",
      plugins: ["external-helpers"]
    }),
    resolve(),
    commonjs({
      include: "node_modules/**"
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
