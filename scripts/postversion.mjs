import * as path from "path";
import { createRequire } from "node:module";

// Changesets assumes that an internal peer dependency's version range should
// include the version of that package in our repo. This normally makes sense,
// but the compat package has a peer dependency on react-router-dom v4 or v5, so
// we need to:
//   - Avoid validity checks for peer dependencies (done via patch package)
//   - Reset the automatic version updates resulting from yarn changeset version
//     (done via a simple node script)

const require = createRequire(import.meta.url);
const jsonfile = require("jsonfile");

let file = path.join(
  process.cwd(),
  "packages/react-router-dom-v5-compat/package.json"
);
let json = await jsonfile.readFile(file);
json.peerDependencies["react-router-dom"] = "4 || 5";
await jsonfile.writeFile(file, json, { spaces: 2 });

console.log("Patched peerDependencies for react-router-dom-v5-compat");
