import * as path from "path";

async function run() {
  try {
    await require("remix/magic").installMagicExports(
      path.resolve(__dirname, "..", "magicExports")
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
