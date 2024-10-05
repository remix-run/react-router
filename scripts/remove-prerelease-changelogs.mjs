import * as fs from "node:fs";
import path from "node:path";
import * as url from "node:url";
import { getPackagesSync } from "@manypkg/get-packages";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import rehypeStringify from "remark-stringify";
import { unified } from "unified";
import { remove } from "unist-util-remove";

const __dirname = url.fileURLToPath(new URL(".", import.meta.url));
const rootDir = path.join(__dirname, "..");

main();

async function main() {
  if (isPrereleaseMode()) {
    console.log("🚫 Skipping changelog removal in prerelease mode");
    return;
  }
  await removePreReleaseChangelogs();
  console.log("✅ Removed pre-release changelogs");
}

async function removePreReleaseChangelogs() {
  let allPackages = getPackagesSync(rootDir).packages;

  /** @type {Promise<any>[]} */
  let processes = [];
  for (let pkg of allPackages) {
    let changelogPath = path.join(pkg.dir, "CHANGELOG.md");
    if (!fs.existsSync(changelogPath)) {
      continue;
    }
    let changelogFileContents = fs.readFileSync(changelogPath, "utf-8");
    processes.push(
      (async () => {
        let file = await unified()
          // Since we have multiple versions of remark-parse, TS resolves to the
          // wrong one
          // @ts-expect-error
          .use(remarkParse)
          .use(remarkGfm)
          .use(removePreReleaseSectionFromMarkdown)
          // same problem
          // @ts-expect-error
          .use(rehypeStringify, {
            bullet: "-",
            emphasis: "_",
            listItemIndent: "one",
          })
          .process(changelogFileContents);

        let fileContents = file.toString();
        await fs.promises.writeFile(changelogPath, fileContents, "utf-8");
      })()
    );
  }
  return Promise.all(processes);
}

function removePreReleaseSectionFromMarkdown() {
  /**
   * @param {import('./unist').RootNode} tree
   * @returns {Promise<void>}
   */
  async function transformer(tree) {
    remove(
      tree,
      /**
       * @param {import("./unist").Node & { __REMOVE__?: boolean }} node
       * @param {number | null | undefined} index
       * @param {*} parent
       */
      (node, index, parent) => {
        if (node.__REMOVE__ === true) return true;
        if (
          node.type === "heading" &&
          node.depth === 2 &&
          node.children[0].type === "text" &&
          isPrereleaseVersion(node.children[0].value)
        ) {
          if (index == null || parent == null) return false;

          let nextIdx = 1;
          let nextNode = parent.children[index + 1];
          let found = false;

          /** @type {import('./unist').FlowNode[]} */
          while (nextNode && !found) {
            if (nextNode.type === "heading" && nextNode.depth === 2) {
              found = true;
              break;
            }
            nextNode.__REMOVE__ = true;
            nextNode = parent.children[++nextIdx + index];
          }
          return true;
        }

        return false;
      }
    );
  }
  return transformer;
}

/**
 * @param {string} str
 * @returns
 */
function isPrereleaseVersion(str) {
  return /^(v?\d+\.){2}\d+-[a-z]+\.\d+$/i.test(str.trim());
}

function isPrereleaseMode() {
  try {
    let prereleaseFilePath = path.join(rootDir, ".changeset", "pre.json");
    return fs.existsSync(prereleaseFilePath);
  } catch (err) {
    return false;
  }
}
