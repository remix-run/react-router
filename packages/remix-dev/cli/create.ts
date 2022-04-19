import stream from "stream";
import { promisify } from "util";
import path from "path";
import fse from "fs-extra";
import fetch from "node-fetch";
import ora from "ora";
import gunzip from "gunzip-maybe";
import tar from "tar-fs";
import * as semver from "semver";
import { fileURLToPath } from "url";
import { execSync } from "child_process";
import sortPackageJSON from "sort-package-json";

import * as colors from "../colors";
import packageJson from "../package.json";
import { convertTemplateToJavaScript } from "./convert-to-javascript";

const remixDevPackageVersion = packageJson.version;

interface CreateAppArgs {
  appTemplate: string;
  projectDir: string;
  remixVersion?: string;
  installDeps: boolean;
  packageManager: "npm" | "yarn" | "pnpm";
  useTypeScript: boolean;
  githubToken?: string;
  debug?: boolean;
}

export async function createApp({
  appTemplate,
  projectDir,
  remixVersion = remixDevPackageVersion,
  installDeps,
  packageManager,
  useTypeScript = true,
  githubToken = process.env.GITHUB_TOKEN,
  debug,
}: CreateAppArgs) {
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

  let templateType = detectTemplateType(appTemplate);
  let options = { useTypeScript, token: githubToken };
  switch (templateType) {
    case "local": {
      if (debug) {
        console.log(
          colors.warning(` 🔍  Using local template: ${appTemplate}`)
        );
      }

      let filepath = appTemplate.startsWith("file://")
        ? fileURLToPath(appTemplate)
        : appTemplate;

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
      if (debug) {
        console.log(
          colors.warning(
            ` 🔍  Using template from remote tarball: ${appTemplate}`
          )
        );
      }

      await downloadAndExtractTarball(projectDir, appTemplate, options);
      break;
    }
    case "repoTemplate": {
      let owner = "remix-run";
      let name = appTemplate.split("/").slice(-1)[0];

      if (debug) {
        console.log(
          colors.warning(
            ` 🔍  Using template from the ${`${owner}/${name}`} repo`
          )
        );
      }

      await downloadAndExtractRepoTarball(
        projectDir,
        getRepoInfo(`${owner}/${name}`),
        options
      );
      break;
    }
    case "example": {
      let name = appTemplate.split("/").slice(-1)[0];
      if (debug) {
        console.log(
          colors.warning(
            ` 🔍  Using the ${name} example template from the remix-run/remix repo`
          )
        );
      }

      await downloadAndExtractRepoTarball(
        projectDir,
        getRepoInfo(
          `https://github.com/remix-run/remix/tree/main/examples/${name}`
        ),
        options
      );
      break;
    }
    case "template": {
      if (debug) {
        console.log(
          colors.warning(
            ` 🔍  Using the ${appTemplate} template from the remix-run/remix repo`
          )
        );
      }

      await downloadAndExtractRepoTarball(
        projectDir,
        getRepoInfo(
          `https://github.com/remix-run/remix/tree/main/templates/${appTemplate}`
        ),
        options
      );
      break;
    }
    case "repo": {
      let repoInfo = getRepoInfo(appTemplate);
      if (debug) {
        console.log(
          colors.warning(
            ` 🔍  Using the ${`${repoInfo.owner}/${repoInfo.name}`} repo as a template.`
          )
        );
      }

      await downloadAndExtractRepoTarball(projectDir, repoInfo, options);
      break;
    }

    case null: {
      console.error(
        `🚨  Could not find a template for "${appTemplate}". Please open an issue at https://github.com/remix-run/remix/issues to report the bug.`
      );
      if (debug) {
        throw Error(`Invalid template "${appTemplate}"`);
      } else {
        process.exit(1);
      }
    }
  }

  // Update remix deps
  let pkgJsonPath = path.join(projectDir, "package.json");
  let appPkg: any;
  try {
    appPkg = require(pkgJsonPath);
  } catch (err) {
    throw Error(
      "🚨 The provided template must be a Remix project with a `package.json` " +
        `file, but that file does not exist in ${pkgJsonPath}.`
    );
  }

  ["dependencies", "devDependencies"].forEach((pkgKey) => {
    for (let dependency in appPkg[pkgKey]) {
      let version = appPkg[pkgKey][dependency];
      if (version === "*") {
        appPkg[pkgKey][dependency] = semver.prerelease(remixVersion)
          ? // Templates created from prereleases should pin to a specific version
            remixVersion
          : "^" + remixVersion;
      }
    }
  });
  appPkg = sortPackageJSON(appPkg);
  await fse.writeJSON(pkgJsonPath, appPkg, { spaces: 2 });

  if (!useTypeScript) {
    await convertTemplateToJavaScript(projectDir);
  }

  if (installDeps) {
    let npmConfig = execSync(
      `${packageManager} config get @remix-run:registry`,
      {
        encoding: "utf8",
      }
    );
    if (npmConfig?.startsWith("https://npm.remix.run")) {
      throw Error(
        "🚨 Oops! You still have the private Remix registry configured. Please " +
          `run \`${packageManager} config delete @remix-run:registry\` or edit your .npmrc file ` +
          "to remove it."
      );
    }

    execSync(`${packageManager} install`, {
      stdio: "inherit",
      cwd: projectDir,
    });
  }
}

// this is natively a promise in node 15+ stream/promises
const pipeline = promisify(stream.pipeline);

async function extractLocalTarball(
  projectDir: string,
  filePath: string
): Promise<void> {
  try {
    await pipeline(
      fse.createReadStream(filePath),
      gunzip(),
      tar.extract(projectDir, { strip: 1 })
    );
  } catch (err) {
    throw Error(
      "🚨 There was a problem extracting the file from the provided template.\n\n" +
        `  Template filepath: \`${filePath}\`\n` +
        `  Destination directory: \`${projectDir}\``
    );
  }
}

async function downloadAndExtractRepoTarball(
  projectDir: string,
  repo: RepoInfo,
  options: {
    token?: string;
    filePath?: string | null | undefined;
  }
) {
  // If we have a direct file path we will also have the branch. We can skip the
  // redirect and get the tarball URL directly.
  if (repo.branch && repo.filePath) {
    let { filePath, tarballURL } = getTarballUrl(repo);
    return await downloadAndExtractTarball(projectDir, tarballURL, {
      ...options,
      filePath,
    });
  }

  // If we don't know the branch, the GitHub API will figure out the default and
  // redirect the request to the tarball.
  // https://docs.github.com/en/rest/reference/repos#download-a-repository-archive-tar
  let url = `https://api.github.com/repos/${repo.owner}/${repo.name}/tarball`;
  if (repo.branch) {
    url += `/${repo.branch}`;
  }

  return await downloadAndExtractTarball(projectDir, url, {
    ...options,
    filePath: null,
  });
}

async function downloadAndExtractTarball(
  projectDir: string,
  url: string,
  {
    token,
    filePath,
  }: {
    token?: string;
    filePath?: string | null;
  }
): Promise<void> {
  let response = await fetch(
    url,
    token ? { headers: { Authorization: `token ${token}` } } : {}
  );

  if (response.status !== 200) {
    throw Error(
      "🚨 There was a problem fetching the file from GitHub. The request " +
        `responded with a ${response.status} status. Please try again later.`
    );
  }

  // file paths returned from github are always unix style
  if (filePath) {
    filePath = filePath.split(path.sep).join(path.posix.sep)
  }

  try {
    await pipeline(
      response.body.pipe(gunzip()),
      tar.extract(projectDir, {
        map(header) {
          let originalDirName = header.name.split("/")[0];
          header.name = header.name.replace(`${originalDirName}/`, "");

          if (filePath) {
            if (header.name.startsWith(filePath)) {
              header.name = header.name.replace(filePath, "");
            } else {
              header.name = "__IGNORE__";
            }
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
  } catch (_) {
    throw Error(
      "🚨 There was a problem extracting the file from the provided template.\n\n" +
        `  Template URL: \`${url}\`\n` +
        `  Destination directory: \`${projectDir}\``
    );
  }
}

function getTarballUrl(repoInfo: RepoInfo): {
  tarballURL: string;
  filePath: string;
} {
  return {
    tarballURL: `https://codeload.github.com/${repoInfo.owner}/${repoInfo.name}/tar.gz/${repoInfo.branch}`,
    filePath: repoInfo.filePath || "/",
  };
}

interface RepoInfoWithBranch {
  url: string;
  owner: string;
  name: string;
  branch: string;
  filePath: string | null;
}

interface RepoInfoWithoutBranch {
  url: string;
  owner: string;
  name: string;
  branch: null;
  filePath: null;
}

type RepoInfo = RepoInfoWithBranch | RepoInfoWithoutBranch;

function isGithubRepoShorthand(value: string) {
  return /^[\w-]+\/[\w-]+$/.test(value);
}

function getGithubUrl(info: Omit<RepoInfo, "url">) {
  let url = `https://github.com/${info.owner}/${info.name}`;
  if (info.branch) {
    url += `/${info.branch}`;
    if (info.filePath && info.filePath !== "/") {
      url += `/${info.filePath}`;
    }
  }
  return url;
}

function getRepoInfo(validatedGithubUrl: string): RepoInfo {
  if (isGithubRepoShorthand(validatedGithubUrl)) {
    let [owner, name] = validatedGithubUrl.split("/");
    return {
      url: getGithubUrl({ owner, name, branch: null, filePath: null }),
      owner,
      name,
      branch: null,
      filePath: null,
    };
  }

  let url = new URL(validatedGithubUrl);
  let [, owner, name, tree, branch, ...file] = url.pathname.split("/") as [
    _: string,
    Owner: string,
    Name: string,
    Tree: string | undefined,
    Branch: string | undefined,
    FileInfo: string | undefined
  ];
  let filePath = file.join("/");

  if (tree === undefined) {
    return {
      url: validatedGithubUrl,
      owner,
      name,
      branch: null,
      filePath: null,
    };
  }

  return {
    url: validatedGithubUrl,
    owner,
    name,
    // If we've validated the GitHub URL and there is a tree, there will also be
    // a branch
    branch: branch!,
    filePath: filePath === "" || filePath === "/" ? null : filePath,
  };
}

export async function validateNewProjectPath(input: string): Promise<void> {
  let cwd = process.cwd();
  let projectDir = path.resolve(cwd, input);
  if (
    (await fse.pathExists(projectDir)) &&
    (await fse.stat(projectDir)).isDirectory()
  ) {
    if ((await fse.readdir(projectDir)).length > 0) {
      throw Error(
        "🚨 The current directory must be empty to create a new project. Please " +
          "clear the contents of the directory or choose a different path."
      );
    } else {
      throw Error(
        "🚨 The directory provided already exists. Please try again with a " +
          "different directory."
      );
    }
  }
}

function isRemixStack(input: string) {
  return [
    "remix-run/blues-stack",
    "remix-run/indie-stack",
    "remix-run/grunge-stack",
    "blues-stack",
    "indie-stack",
    "grunge-stack",
  ].includes(input);
}

function isRemixTemplate(input: string) {
  return [
    "remix",
    "express",
    "arc",
    "fly",
    "netlify",
    "vercel",
    "cloudflare-pages",
    "cloudflare-workers",
  ].includes(input);
}

export async function validateTemplate(input: string) {
  // If a template string matches one of the choices in our interactive prompt,
  // we can skip all fetching and manual validation.
  if (isRemixStack(input)) {
    return;
  }
  if (isRemixTemplate(input)) {
    return;
  }

  let templateType = detectTemplateType(input);
  switch (templateType) {
    case "local": {
      if (input.startsWith("file://")) {
        input = fileURLToPath(input);
      }
      if (!(await fse.pathExists(input))) {
        throw Error(`🚨 Oops, the file \`${input}\` does not exist.`);
      }
      return;
    }
    case "remoteTarball": {
      let spinner = ora("Validating the template file…").start();
      try {
        let response = await fetch(input, { method: "HEAD" });
        spinner.stop();
        switch (response.status) {
          case 200:
            return;
          case 404:
            throw Error(
              "🚨 The template file could not be verified. Please double check " +
                "the URL and try again."
            );
          default:
            throw Error(
              "🚨 The template file could not be verified. The server returned " +
                `a response with a ${response.status} status. Please double ` +
                "check the URL and try again."
            );
        }
      } catch (err) {
        spinner.stop();
        throw Error(
          "🚨 There was a problem verifying the template file. Please ensure " +
            "you are connected to the internet and try again later."
        );
      }
    }
    case "repo": {
      let spinner = ora("Validating the template repo…").start();
      let { url, filePath } = getRepoInfo(input);
      try {
        let response = await fetch(url, { method: "HEAD" });
        spinner.stop();
        switch (response.status) {
          case 200:
            return;
          case 403:
            throw Error(
              "🚨 The template could not be verified because you do not have " +
                "access to the repository. Please double check the access " +
                "rights of this repo and try again."
            );
          case 404:
            throw Error(
              "🚨 The template could not be verified. Please double check that " +
                "the template is a valid GitHub repository" +
                (filePath && filePath !== "/"
                  ? " and that the filepath points to a directory in the repo"
                  : "") +
                " and try again."
            );
          default:
            throw Error(
              "🚨 The template could not be verified. The server returned a " +
                `response with a ${response.status} status. Please double check ` +
                "that the template is a valid GitHub repository  and try again."
            );
        }
      } catch (_) {
        spinner.stop();
        throw Error(
          "🚨 There was a problem verifying the template. Please ensure you " +
            "are connected to the internet and try again later."
        );
      }
    }
    case "example":
    case "template": {
      let spinner = ora("Validating the template…").start();
      let name = input;
      if (templateType === "example") {
        name = name.split("/")[1];
      }
      let typeDir = templateType + "s";
      let templateUrl = `https://github.com/remix-run/remix/tree/main/${typeDir}/${name}`;
      try {
        let response = await fetch(templateUrl, { method: "HEAD" });
        spinner.stop();
        switch (response.status) {
          case 200:
            return;
          case 404:
            throw Error(
              "🚨 The template could not be verified. Please double check that " +
                "the template is a valid project directory in " +
                `https://github.com/remix-run/remix/tree/main/${typeDir} and ` +
                "try again."
            );
          default:
            throw Error(
              "🚨 The template could not be verified. The server returned a " +
                `response with a ${response.status} status. Please double ` +
                "check that the template is a valid project directory in " +
                `https://github.com/remix-run/remix/tree/main/${typeDir} and ` +
                "try again."
            );
        }
      } catch (_) {
        spinner.stop();
        throw Error(
          "🚨 There was a problem verifying the template. Please ensure you are " +
            "connected to the internet and try again later."
        );
      }
    }
  }

  throw Error("🚨 Invalid template selected. Please try again.");
}

export type TemplateType =
  // in the remix repo
  | "template"
  // in the remix repo
  | "example"
  // a github repo
  | "repo"
  // a remix repo template (like "remix-run/blues-stack" or "indie-stack")
  | "repoTemplate"
  // remote tarball url
  | "remoteTarball"
  // local directory
  | "local";

export function detectTemplateType(template: string): TemplateType | null {
  // 1. Prioritize Remix templates and stacks first. This ensures that inputs
  //    like `--template remix` always pull from our templates, which is almost
  //    always the desired behavior. If users maintain a fork either locally or
  //    in another repo they can pass the repo shorthand, URL or path instead.
  //    This also ensures that our interactive CLI always works as expected even
  //    if the user has another directory with the same name.
  //    https://github.com/remix-run/remix/issues/2491
  if (isRemixTemplate(template)) {
    return "template";
  }

  if (isRemixStack(template)) {
    return "repoTemplate";
  }

  // 2. Check if the user passed a local file. If they hand us an explicit file
  //    URL, we'll validate it first. Otherwise we just ping the filesystem to
  //    see if the string references a filepath and, if not, move on.
  if (template.startsWith("file://")) {
    return "local";
  }

  // 3. Check if it's a path to a local directory.
  try {
    if (
      fse.existsSync(
        path.isAbsolute(template)
          ? template
          : path.resolve(process.cwd(), template)
      )
    ) {
      return "local";
    }
  } catch (_) {
    // ignore FS errors and move on
  }

  // 4. examples/<template> will use an example folder in the Remix repo
  if (/^examples?\/[\w-]+$/.test(template)) {
    return "example";
  }

  // 5. Handle GitHub repos (URLs or :org/:repo shorthand)
  if (isValidGithubUrl(template) || isGithubRepoShorthand(template)) {
    return "repo";
  }

  // 6. Any other valid URL should be treated as a tarball.
  if (isUrl(template)) {
    return "remoteTarball";
  }

  return null;
}

function isUrl(value: string) {
  try {
    new URL(value);
    return true;
  } catch (_) {
    return false;
  }
}

type GithubUrlString =
  | `https://github.com/${string}/${string}`
  | `https://www.github.com/${string}/${string}`;

function isValidGithubUrl(value: string | URL): value is URL | GithubUrlString {
  try {
    let url = typeof value === "string" ? new URL(value) : value;
    let pathSegments = url.pathname.slice(1).split("/");

    return (
      url.protocol === "https:" &&
      url.hostname === "github.com" &&
      // The pathname must have at least 2 segments. If it has more than 2, the
      // third must be "tree" and it must have at least 4 segments.
      // https://github.com/remix-run/remix
      // https://github.com/remix-run/remix/tree/dev
      pathSegments.length >= 2 &&
      (pathSegments.length > 2
        ? pathSegments[2] === "tree" && pathSegments.length >= 4
        : true)
    );
  } catch (_) {
    return false;
  }
}
