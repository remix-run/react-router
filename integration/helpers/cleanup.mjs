import * as path from "path";
import rimraf from "rimraf";

if (process.env.CI) {
  console.log("Skipping cleanup in CI");
  process.exit();
}

const pathsToRemove = [path.resolve(process.cwd(), ".tmp/integration")];

for (let pathToRemove of pathsToRemove) {
  console.log(`Removing ${path.relative(process.cwd(), pathToRemove)}`);
  rimraf.sync(pathToRemove);
}
