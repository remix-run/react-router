/* eslint-env node */

if (process.env.NODE_ENV === "production") {
  module.exports = require("./umd/history.production.min.js");
} else {
  module.exports = require("./umd/history.development.js");
}
