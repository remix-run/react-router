import * as fsp from "fs/promises";
import * as path from "path";

// Import environment variables from: .env, failing gracefully if it doesn't exist
export async function loadEnv(rootDirectory: string): Promise<void> {
  const envPath = path.join(rootDirectory, ".env");
  try {
    await fsp.readFile(envPath);
  } catch (e) {
    return;
  }

  console.log(`Loading environment variables from .env`);
  const result = require("dotenv").config({ path: envPath });
  if (result.error) {
    throw result.error;
  }
}
