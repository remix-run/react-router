/* eslint-env node */

if (process.env.NODE_ENV === "production") {
  module.exports = require("./dist/umd/react-router-dom.production.min.js");
} else {
  module.exports = require("./dist/umd/react-router-dom.development.js");
}
