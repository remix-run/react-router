switch (process.env.REACT_VERSION) {
  case "16.3.2":
    module.exports = require("./16.3.2/node_modules/react/cjs/react.development.js");
    break;
  case "16.4.2":
    module.exports = require("./16.4.2/node_modules/react/cjs/react.development.js");
    break;
  case "16.5.2":
  default:
    module.exports = require("./16.5.2/node_modules/react/cjs/react.development.js");
}
