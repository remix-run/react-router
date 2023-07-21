const fs = require("fs");
const path = require("path");

module.exports = ({ rootDirectory }) => {
  fs.writeFileSync(
    path.join(rootDirectory, "test.txt"),
    "added via remix.init"
  );
};
