/* eslint-env node */

if (process.env.NODE_ENV === "production") {
  module.exports = require("./umd/react-router-dom-v5-compat.production.min.js");
} else {
  module.exports = require("./umd/react-router-dom-v5-compat.development.js");
}
