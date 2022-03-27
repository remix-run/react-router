import stream from "stream";
import { promisify } from "util";
import path from "path";
import fse from "fs-extra";
import fetch from "node-fetch";
import gunzip from "gunzip-maybe";
import tar from "tar-fs";
import * as semver from "semver";
import { fileURLToPath } from "url";
import { execSync } from "child_process";
import sortPackageJSON from "sort-package-json";
import glob from "fast-glob";
import * as babel from "@babel/core";
// @ts-expect-error these modules dont have types
import babelPluginSyntaxJSX from "@babel/plugin-syntax-jsx";
// @ts-expect-error these modules dont have types
import babelPresetTypeScript from "@babel/preset-typescript";
import prettier from "prettier";

import packageJson from "../package.json";

const remixDevPackageVersion = packageJson.version;

interface CreateAppArgs {
  appTemplate: string;
  projectDir: string;
  remixVersion?: string;
  installDeps: boolean;
  useTypeScript: boolean;
  githubToken?: string;
}

export async function createApp({
  appTemplate,
  projectDir,
  remixVersion = remixDevPackageVersion,
  installDeps,
  useTypeScript = true,
  githubToken = process.env.GITHUB_TOKEN,
}: CreateAppArgs) {
  // Check the node version
  let versions = process.versions;
  if (versions?.node && semver.major(versions.node) < 14) {
    throw new Error(
      `️🚨 Oops, Node v${versions.node} detected. Remix requires a Node version greater than 14.`
    );
  }

  // Create the app directory
  let relativeProjectDir = path.relative(process.cwd(), projectDir);
  let projectDirIsCurrentDir = relativeProjectDir === "";
  if (!projectDirIsCurrentDir) {
    if (fse.existsSync(projectDir)) {
      throw new Error(
        `️🚨 Oops, "${relativeProjectDir}" already exists. Please try again with a different directory.`
      );
    }
  }

  /**
   * Grab the template
   * First we'll need to determine if the template we got is
   * - file on disk
   * - directory on disk
   * - tarball URL (github or otherwise)
   * - github owner/repo
   * - example in remix-run org
   * - template in remix-run org
   */
  let templateType = await detectTemplateType(
    appTemplate,
    useTypeScript,
    githubToken
  );
  let options = { useTypeScript, token: githubToken };
  switch (templateType) {
    case "local": {
      let filepath = appTemplate.startsWith("file://")
        ? fileURLToPath(appTemplate)
        : appTemplate;
      if (!fse.existsSync(filepath)) {
        throw new Error(`️🚨 Oops, "${filepath}" does not exist.`);
      }
      if (fse.statSync(filepath).isDirectory()) {
        await fse.copy(filepath, projectDir);
        break;
      }
      if (appTemplate.endsWith(".tar.gz")) {
        await extractLocalTarball(projectDir, filepath);
        break;
      }
    }
    case "remoteTarball": {
      await downloadAndExtractTarball(projectDir, appTemplate, options);
      break;
    }
    case "example": {
      await downloadAndExtractTemplateOrExample(
        projectDir,
        appTemplate,
        "examples",
        options
      );
      break;
    }
    case "template": {
      await downloadAndExtractTemplateOrExample(
        projectDir,
        appTemplate,
        "templates",
        options
      );
      break;
    }
    case "repo": {
      let { filePath, tarballURL } = await getTarballUrl(
        appTemplate,
        githubToken
      );
      await downloadAndExtractTarball(projectDir, tarballURL, {
        ...options,
        filePath,
      });
      break;
    }
    default:
      throw new Error(`Unable to determine template type for "${appTemplate}"`);
  }

  // Update remix deps
  let appPkg = require(path.join(projectDir, "package.json"));
  ["dependencies", "devDependencies"].forEach((pkgKey) => {
    for (let key in appPkg[pkgKey]) {
      if (appPkg[pkgKey][key] === "*") {
        appPkg[pkgKey][key] = semver.prerelease(remixVersion)
          ? // Templates created from prereleases should pin to a specific version
            remixVersion
          : "^" + remixVersion;
      }
    }
  });
  appPkg = sortPackageJSON(appPkg);
  await fse.writeJSON(path.join(projectDir, "package.json"), appPkg, {
    spaces: 2,
  });

  if (!useTypeScript) {
    await convertTemplateToJavaScript(projectDir);
  }

  if (installDeps) {
    // TODO: use yarn/pnpm/npm
    let npmConfig = execSync("npm config get @remix-run:registry", {
      encoding: "utf8",
    });
    if (npmConfig?.startsWith("https://npm.remix.run")) {
      console.log(
        "🚨 Oops! You still have the private Remix registry configured. Please run `npm config delete @remix-run:registry` or edit your .npmrc file to remove it."
      );
      process.exit(1);
    }

    execSync("npm install", { stdio: "inherit", cwd: projectDir });
  }
}

// this is natively a promise in node 15+ stream/promises
const pipeline = promisify(stream.pipeline);

async function extractLocalTarball(
  projectDir: string,
  filePath: string
): Promise<void> {
  await pipeline(
    fse.createReadStream(filePath),
    gunzip(),
    tar.extract(projectDir, { strip: 1 })
  );
}

async function downloadAndExtractTemplateOrExample(
  projectDir: string,
  name: string,
  type: "templates" | "examples",
  options: {
    token?: string;
    useTypeScript: boolean;
  }
) {
  let response = await fetch(
    "https://codeload.github.com/remix-run/remix/tar.gz/main",
    options.token
      ? { headers: { Authorization: `token ${options.token}` } }
      : {}
  );

  if (response.status !== 200) {
    throw new Error(`Error fetching repo: ${response.status}`);
  }

  let cwd = path.dirname(projectDir);
  let desiredDir = path.basename(projectDir);
  let templateDir = path.join(desiredDir, type, name);
  await pipeline(
    response.body.pipe(gunzip()),
    tar.extract(cwd, {
      map(header) {
        let originalDirName = header.name.split("/")[0];
        header.name = header.name.replace(originalDirName, desiredDir);
        // https://github.com/remix-run/remix/issues/2356#issuecomment-1071458832
        if (path.sep === "\\") {
          templateDir = templateDir.replace("\\", "/");
        }
        if (!header.name.startsWith(templateDir + "/")) {
          header.name = "__IGNORE__";
        } else {
          header.name = header.name.replace(templateDir, desiredDir);
        }
        return header;
      },
      ignore(_filename, header) {
        if (!header) {
          throw new Error(`Header is undefined`);
        }

        return header.name === "__IGNORE__";
      },
    })
  );
}

async function downloadAndExtractTarball(
  projectDir: string,
  url: string,
  options: {
    token?: string;
    filePath?: string | null | undefined;
  }
): Promise<void> {
  let desiredDir = path.basename(projectDir);

  let response = await fetch(
    url,
    options.token
      ? { headers: { Authorization: `token ${options.token}` } }
      : {}
  );

  if (response.status !== 200) {
    throw new Error(`Error fetching repo: ${response.status}`);
  }

  await pipeline(
    response.body.pipe(gunzip()),
    tar.extract(projectDir, {
      map(header) {
        let originalDirName = header.name.split("/")[0];
        header.name = header.name.replace(originalDirName, desiredDir);

        let templateFiles = options.filePath
          ? path.join(desiredDir, options.filePath) + path.sep
          : desiredDir + path.sep;

        // https://github.com/remix-run/remix/issues/2356#issuecomment-1071458832
        if (path.sep === "\\") {
          templateFiles = templateFiles.replace("\\", "/");
        }

        if (!header.name.startsWith(templateFiles)) {
          header.name = "__IGNORE__";
        } else {
          header.name = header.name.replace(templateFiles, "");
        }

        return header;
      },
      ignore(_filename, header) {
        if (!header) {
          throw new Error(`Header is undefined`);
        }

        return header.name === "__IGNORE__";
      },
    })
  );
}

async function getTarballUrl(
  from: string,
  token?: string | undefined
): Promise<{ tarballURL: string; filePath: string }> {
  let info = await getRepoInfo(from, token);

  if (!info) {
    throw new Error(`Could not find repo: ${from}`);
  }

  return {
    tarballURL: `https://codeload.github.com/${info.owner}/${info.name}/tar.gz/${info.branch}`,
    filePath: info.filePath,
  };
}

interface RepoInfo {
  owner: string;
  name: string;
  branch: string;
  filePath: string;
}

async function getRepoInfo(
  from: string,
  token?: string | undefined
): Promise<RepoInfo | undefined> {
  try {
    let url = new URL(from);
    if (url.hostname !== "github.com") {
      return;
    }

    let [, owner, name, t, branch, ...file] = url.pathname.split("/");
    let filePath = file.join(path.sep);

    if (t === undefined) {
      let defaultBranch = await getDefaultBranch(`${owner}/${name}`, token);

      return { owner, name, branch: defaultBranch, filePath };
    }

    if (owner && name && branch && t === "tree") {
      return { owner, name, branch, filePath };
    }

    return;
  } catch (error: unknown) {
    // invalid url, but it could be a github shorthand for
    // :owner/:repo
    try {
      let parts = from.split("/");
      if (parts.length === 1) {
        parts.unshift("remix-run");
      }
      let [owner, name] = parts;
      let branch = await getDefaultBranch(`${owner}/${name}`, token);
      return { owner, name, branch, filePath: "" };
    } catch (error) {
      // invalid url, but we can try to match a template or example
      return undefined;
    }
  }
}

async function getDefaultBranch(
  repo: string,
  token: string | undefined
): Promise<string> {
  let response = await fetch(`https://api.github.com/repos/${repo}`, {
    headers: {
      Authorization: token ? `token ${token}` : "",
      Accept: "application/vnd.github.v3+json",
    },
  });

  if (response.status !== 200) {
    throw new Error(
      `Error fetching repo: ${response.status} ${response.statusText}`
    );
  }

  let info = await response.json();
  return info.default_branch;
}

async function isRemixTemplate(
  name: string,
  useTypeScript: boolean,
  token?: string
): Promise<string | undefined> {
  let response = await fetch(
    `https://api.github.com/repos/remix-run/remix/contents/templates`,
    {
      headers: token
        ? {
            Accept: "application/vnd.github.v3+json",
            Authorization: `token ${token}`,
          }
        : {
            Accept: "application/vnd.github.v3+json",
          },
    }
  );
  if (!response.ok) {
    throw new Error(
      `Error fetching repo: ${response.status} ${response.statusText}`
    );
  }
  let results = await response.json();
  let template = results.find((result: any) => {
    return result.name === name;
  });
  if (!template) return undefined;
  return template.name;
}

async function isRemixExample(name: string, token?: string) {
  let response = await fetch(
    `https://api.github.com/repos/remix-run/remix/contents/examples`,
    {
      headers: {
        Accept: "application/vnd.github.v3+json",
        Authorization: token ? `token ${token}` : "",
      },
    }
  );
  if (!response.ok) {
    throw new Error(
      `Error fetching repo: ${response.status} ${response.statusText}`
    );
  }
  let results = await response.json();
  let example = results.find((result: any) => {
    return result.name === name;
  });
  if (!example) return undefined;
  return example.name;
}

type TemplateType =
  // in the remix repo
  | "template"
  // in the remix repo
  | "example"
  // a github repo
  | "repo"
  // remote tarball url
  | "remoteTarball"
  // local directory
  | "local";

async function detectTemplateType(
  template: string,
  useTypeScript: boolean,
  token?: string
): Promise<TemplateType> {
  if (template.startsWith("file://") || fse.existsSync(template)) {
    return "local";
  }
  if (await isRemixTemplate(template, useTypeScript, token)) {
    return "template";
  }
  if (await isRemixExample(template, token)) {
    return "example";
  }
  if (await getRepoInfo(template, token)) {
    return "repo";
  }
  return "remoteTarball";
}

function convertToJavaScript(
  filename: string,
  source: string,
  projectDir: string
): string {
  let result = babel.transformSync(source, {
    filename,
    presets: [[babelPresetTypeScript, { jsx: "preserve" }]],
    plugins: [babelPluginSyntaxJSX],
    compact: false,
    retainLines: true,
    cwd: projectDir,
  });

  if (!result || !result.code) {
    throw new Error("Could not parse typescript");
  }

  /*
    Babel's `compact` and `retainLines` options are both bad at formatting code.
    Use Prettier for nicer formatting.
  */
  return prettier.format(result.code, { parser: "babel" });
}

async function convertTemplateToJavaScript(projectDir: string) {
  // 1. Convert all .ts files in the template to .js
  let entries = glob.sync("**/*.+(ts|tsx)", {
    cwd: projectDir,
    absolute: true,
  });
  for (let entry of entries) {
    if (entry.endsWith(".d.ts")) {
      fse.removeSync(entry);
      continue;
    }

    let contents = fse.readFileSync(entry, "utf8");
    let filename = path.basename(entry);
    let javascript = convertToJavaScript(filename, contents, projectDir);

    fse.writeFileSync(entry, javascript, "utf8");
    if (entry.endsWith(".tsx")) {
      fse.renameSync(entry, entry.replace(/\.tsx?$/, ".jsx"));
    } else {
      fse.renameSync(entry, entry.replace(/\.ts?$/, ".js"));
    }
  }

  // 2. Rename the tsconfig.json to jsconfig.json
  if (fse.existsSync(path.join(projectDir, "tsconfig.json"))) {
    fse.renameSync(
      path.join(projectDir, "tsconfig.json"),
      path.join(projectDir, "jsconfig.json")
    );
  }

  // 3. Remove @types/* and typescript from package.json
  let packageJson = path.join(projectDir, "package.json");
  if (!fse.existsSync(packageJson)) {
    throw new Error("Could not find package.json");
  }
  let pkg = JSON.parse(fse.readFileSync(packageJson, "utf8"));
  let devDeps = pkg.devDependencies || {};
  let newPackageJson = {
    ...pkg,
    devDependencies: Object.fromEntries(
      Object.entries(devDeps).filter(([name]) => {
        return !name.startsWith("@types/") && name !== "typescript";
      })
    ),
  };
  // 4. Remove typecheck npm script from package.json
  if (pkg.scripts && pkg.scripts.typecheck) {
    delete pkg.scripts.typecheck;
  }
  fse.writeJSONSync(path.join(projectDir, "package.json"), newPackageJson, {
    spaces: 2,
  });
}
