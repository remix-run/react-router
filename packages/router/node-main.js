/* eslint-env node */

if (process.env.NODE_ENV === "production") {
  module.exports = require("./umd/router.production.min.js");
} else {
  module.exports = require("./umd/router.development.js");
}
