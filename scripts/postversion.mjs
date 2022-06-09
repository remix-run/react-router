import * as path from "path";
import { createRequire } from "node:module";

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
