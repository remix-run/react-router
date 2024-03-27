let restrictedGlobalsError = `Node globals are not allowed in this package.`;

module.exports = {
  extends: "../../.eslintrc.js",
  rules: {
    "no-restricted-globals": [
      "error",
      { name: "__dirname", message: restrictedGlobalsError },
      { name: "__filename", message: restrictedGlobalsError },
      { name: "Buffer", message: restrictedGlobalsError },
    ],
    "import/no-nodejs-modules": "error",
  },
};
