const fs = require("node:fs");
const path = require("node:path");

module.exports = ({ rootDirectory }) => {
  fs.writeFileSync(
    path.join(rootDirectory, "test.txt"),
    "added via remix.init"
  );
};
