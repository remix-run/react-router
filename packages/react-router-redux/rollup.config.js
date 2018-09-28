import babel from "rollup-plugin-babel";
import uglify from "rollup-plugin-uglify";

const config = {
  output: {
    format: "umd",
    name: "ReactRouterRedux",
    globals: {
      react: "React",
      "prop-types": "PropTypes",
      "react-router": "ReactRouter"
    }
  },
  external: ["react", "prop-types", "react-router"],
  plugins: [
    babel({
      exclude: "node_modules/**",
      plugins: ["external-helpers"]
    })
  ]
};

if (process.env.NODE_ENV === "production") {
  config.plugins.push(
    uglify({
      compress: {
        pure_getters: true,
        unsafe: true,
        unsafe_comps: true,
        warnings: false
      }
    })
  );
}

export default config;
