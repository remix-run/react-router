// eslint-disable-next-line import/no-nodejs-modules
import * as fsp from "node:fs/promises";

const filesToRewrite = [
  "dist/development/server.js",
  "dist/production/server.js",
];

for (const file of filesToRewrite) {
  const contents = await fsp.readFile(file, "utf8");
  const newContents = contents.replaceAll(
    "require('react-router/client')",
    "require('./index.js')"
  );
  await fsp.writeFile(file, newContents);
}
