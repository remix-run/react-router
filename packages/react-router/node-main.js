/* eslint-env node */

if (process.env.NODE_ENV === "production") {
  module.exports = require("./dist/umd/react-router.production.min.js");
} else {
  module.exports = require("./dist/umd/react-router.development.js");
}
