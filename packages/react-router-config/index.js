"use strict";

if (process.env.NODE_ENV === "production") {
  module.exports = require("./cjs/react-router-config.min.js");
} else {
  module.exports = require("./cjs/react-router-config.js");
}
