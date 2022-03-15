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

import packageJson from "./package.json";

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
  useTypeScript,
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
    replacer: null,
  });

  if (!useTypeScript) {
    // TODO:
    // 1. Convert all .ts files in the template to .js
    // 2. Rename the tsconfig.json to jsconfig.json
    // 3. Remove @types/* and typescript from package.json
    // 4. Remove typecheck npm script from package.json
  }

  if (installDeps) {
    // TODO: use yarn/pnpm/npm
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
    type === "templates"
      ? "https://codeload.github.com/remix-run/remix/tar.gz/logan/support-remote-repos-in-create-remix"
      : "https://codeload.github.com/remix-run/remix/tar.gz/main",
    options.token
      ? { headers: { Authorization: `token ${options.token}` } }
      : {}
  );

  if (response.status !== 200) {
    throw new Error(`Error fetching repo: ${response.status}`);
  }

  let cwd = path.dirname(projectDir);
  let desiredDir = path.basename(projectDir);
  let exampleOrTemplateName =
    type === "templates" && options.useTypeScript ? `${name}-ts` : name;
  let templateDir = path.join(desiredDir, type, exampleOrTemplateName);
  await pipeline(
    response.body.pipe(gunzip()),
    tar.extract(cwd, {
      map(header) {
        let originalDirName = header.name.split("/")[0];
        header.name = header.name.replace(originalDirName, desiredDir);
        if (!header.name.startsWith(templateDir + path.sep)) {
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
  let cwd = path.dirname(projectDir);

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
      strip: options.filePath ? options.filePath.split("/").length + 1 : 1,
      ignore(name) {
        if (options.filePath) {
          return !name.startsWith(path.join(cwd, options.filePath));
        } else {
          return false;
        }
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
    let filePath = file.join("/");

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
  let promise = await fetch(
    `https://api.github.com/repos/remix-run/remix/contents/templates`,
    {
      headers: {
        Accept: "application/vnd.github.v3+json",
        Authorization: token ? `token ${token}` : "",
      },
    }
  );
  if (!promise.ok) {
    throw new Error(
      `Error fetching repo: ${promise.status} ${promise.statusText}`
    );
  }
  let results = await promise.json();
  let possibleTemplateName = useTypeScript ? `${name}-ts` : name;
  let template = results.find((result: any) => {
    return result.name === possibleTemplateName;
  });
  if (!template) return undefined;
  return template.name;
}

async function isRemixExample(name: string, token?: string) {
  let promise = await fetch(
    `https://api.github.com/repos/remix-run/remix/contents/examples`,
    {
      headers: {
        Accept: "application/vnd.github.v3+json",
        Authorization: token ? `token ${token}` : "",
      },
    }
  );
  if (!promise.ok) {
    throw new Error(
      `Error fetching repo: ${promise.status} ${promise.statusText}`
    );
  }
  let results = await promise.json();
  let example = results.find((result: any) => result.name === name);
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
  if (await getRepoInfo(template, token)) {
    return "repo";
  }
  if (await isRemixTemplate(template, useTypeScript, token)) {
    return "template";
  }
  if (await isRemixExample(template, token)) {
    return "example";
  }
  return "remoteTarball";
}
