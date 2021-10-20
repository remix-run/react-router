/* eslint-env node */
module.exports =
  process.env.NODE_ENV === "production"
    ? require("./umd/react-router.production.min.js")
    : require("./umd/react-router.development.js");
