const buildFormat = process.env.BUILD_FORMAT;

module.exports = {
  plugins: [
    "dev-expression",
    [
      "transform-imports",
      {
        "react-router": {
          transform:
            buildFormat == null
              ? "react-router/modules/${member}"
              : buildFormat === "cjs"
                ? "react-router/${member}"
                : "react-router/es/${member}",
          preventFullImport: true
        }
      }
    ]
  ],
  presets: [
    [
      "es2015",
      {
        loose: true,
        modules:
          buildFormat == null || buildFormat === "cjs" ? "commonjs" : false
      }
    ],
    "stage-1",
    "react"
  ]
};
