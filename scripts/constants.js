import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const ROOT_DIR = path.resolve(__dirname, "..");
const EXAMPLES_DIR = path.resolve(ROOT_DIR, "examples");

export { ROOT_DIR, EXAMPLES_DIR };
