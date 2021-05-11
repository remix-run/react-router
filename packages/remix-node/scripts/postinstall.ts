import * as path from "path";

async function run() {
  let packageJson = require("../package.json");

  try {
    await require("remix/magic").installMagicExports(
      path.resolve(__dirname, "..", "magicExports"),
      { [packageJson.name]: packageJson.version }
    );
  } catch (error) {
    if (error.code === "MODULE_NOT_FOUND") {
      // ignore missing "remix" package
    } else {
      throw error;
    }
  }
}

run().then(
  () => {
    process.exit(0);
  },
  error => {
    console.error(error);
    process.exit(1);
  }
);
