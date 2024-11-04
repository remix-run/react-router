import process from "node:process";
import url from "node:url";
import fs from "node:fs";
import path from "node:path";
import stream from "node:stream";
import { promisify } from "node:util";
import { fetch } from "@remix-run/web-fetch";
import gunzip from "gunzip-maybe";
import tar from "tar-fs";
import { ProxyAgent } from "proxy-agent";

import { color, isUrl } from "./utils";

const defaultAgent = new ProxyAgent();
const httpsAgent = new ProxyAgent();
httpsAgent.protocol = "https:";
function agent(url: string) {
  return new URL(url).protocol === "https:" ? httpsAgent : defaultAgent;
}

export async function copyTemplate(
  template: string,
  destPath: string,
  options: CopyTemplateOptions
): Promise<{ localTemplateDirectory: string } | undefined> {
  let { log = () => {} } = options;

  /**
   * Valid templates are:
   * - local file or directory on disk
   * - GitHub owner/repo shorthand
   * - GitHub owner/repo/directory shorthand
   * - full GitHub repo URL
   * - any tarball URL
   */

  try {
    if (isLocalFilePath(template)) {
      log(`Using the template from local file at "${template}"`);
      let filepath = template.startsWith("file://")
        ? url.fileURLToPath(template)
        : template;
      let isLocalDir = await copyTemplateFromLocalFilePath(filepath, destPath);
      return isLocalDir ? { localTemplateDirectory: filepath } : undefined;
    }

    if (isGithubRepoShorthand(template)) {
      log(`Using the template from the "${template}" repo`);
      await copyTemplateFromGithubRepoShorthand(template, destPath, options);
      return;
    }

    if (isValidGithubRepoUrl(template)) {
      log(`Using the template from "${template}"`);
      await copyTemplateFromGithubRepoUrl(template, destPath, options);
      return;
    }

    if (isUrl(template)) {
      log(`Using the template from "${template}"`);
      await copyTemplateFromGenericUrl(template, destPath, options);
      return;
    }

    throw new CopyTemplateError(
      `"${color.bold(template)}" is an invalid template. Run ${color.bold(
        "create-react-router --help"
      )} to see supported template formats.`
    );
  } catch (error) {
    await options.onError(error);
  }
}

interface CopyTemplateOptions {
  debug?: boolean;
  token?: string;
  onError(error: unknown): any;
  log?(message: string): any;
}

function isLocalFilePath(input: string): boolean {
  try {
    return (
      input.startsWith("file://") ||
      fs.existsSync(
        path.isAbsolute(input) ? input : path.resolve(process.cwd(), input)
      )
    );
  } catch (_) {
    return false;
  }
}

async function copyTemplateFromRemoteTarball(
  url: string,
  destPath: string,
  options: CopyTemplateOptions
) {
  return await downloadAndExtractTarball(destPath, url, options);
}

async function copyTemplateFromGithubRepoShorthand(
  repoShorthand: string,
  destPath: string,
  options: CopyTemplateOptions
) {
  let [owner, name, ...path] = repoShorthand.split("/");
  let filePath = path.length ? path.join("/") : null;

  await downloadAndExtractRepoTarball(
    { owner, name, filePath },
    destPath,
    options
  );
}

async function copyTemplateFromGithubRepoUrl(
  repoUrl: string,
  destPath: string,
  options: CopyTemplateOptions
) {
  await downloadAndExtractRepoTarball(getRepoInfo(repoUrl), destPath, options);
}

async function copyTemplateFromGenericUrl(
  url: string,
  destPath: string,
  options: CopyTemplateOptions
) {
  await copyTemplateFromRemoteTarball(url, destPath, options);
}

async function copyTemplateFromLocalFilePath(
  filePath: string,
  destPath: string
): Promise<boolean> {
  if (filePath.endsWith(".tar.gz") || filePath.endsWith(".tgz")) {
    await extractLocalTarball(filePath, destPath);
    return false;
  }
  if (fs.statSync(filePath).isDirectory()) {
    // If our template is just a directory on disk, return true here, and we'll
    // just copy directly from there instead of "extracting" to a temp
    // directory first
    return true;
  }
  throw new CopyTemplateError(
    "The provided template is not a valid local directory or tarball."
  );
}

const pipeline = promisify(stream.pipeline);

async function extractLocalTarball(
  tarballPath: string,
  destPath: string
): Promise<void> {
  try {
    await pipeline(
      fs.createReadStream(tarballPath),
      gunzip(),
      tar.extract(destPath, { strip: 1 })
    );
  } catch (error: unknown) {
    throw new CopyTemplateError(
      "There was a problem extracting the file from the provided template." +
        `  Template filepath: \`${tarballPath}\`` +
        `  Destination directory: \`${destPath}\`` +
        `  ${error}`
    );
  }
}

interface TarballDownloadOptions {
  debug?: boolean;
  filePath?: string | null;
  token?: string;
}

async function downloadAndExtractRepoTarball(
  repo: RepoInfo,
  destPath: string,
  options: TarballDownloadOptions
) {
  // If we have a direct file path we will also have the branch. We can skip the
  // redirect and get the tarball URL directly.
  if (repo.branch && repo.filePath) {
    let tarballURL = `https://codeload.github.com/${repo.owner}/${repo.name}/tar.gz/${repo.branch}`;
    return await downloadAndExtractTarball(destPath, tarballURL, {
      ...options,
      filePath: repo.filePath,
    });
  }

  // If we don't know the branch, the GitHub API will figure out the default and
  // redirect the request to the tarball.
  // https://docs.github.com/en/rest/reference/repos#download-a-repository-archive-tar
  let url = `https://api.github.com/repos/${repo.owner}/${repo.name}/tarball`;
  if (repo.branch) {
    url += `/${repo.branch}`;
  }

  return await downloadAndExtractTarball(destPath, url, {
    ...options,
    filePath: repo.filePath ?? null,
  });
}

interface DownloadAndExtractTarballOptions {
  token?: string;
  filePath?: string | null;
}

async function downloadAndExtractTarball(
  downloadPath: string,
  tarballUrl: string,
  { token, filePath }: DownloadAndExtractTarballOptions
): Promise<void> {
  let resourceUrl = tarballUrl;
  let headers: HeadersInit = {};
  let isGithubUrl = new URL(tarballUrl).host.endsWith("github.com");
  if (token && isGithubUrl) {
    headers.Authorization = `token ${token}`;
  }
  if (isGithubReleaseAssetUrl(tarballUrl)) {
    // We can download the asset via the GitHub api, but first we need to look
    // up the asset id
    let info = getGithubReleaseAssetInfo(tarballUrl);
    headers.Accept = "application/vnd.github.v3+json";

    let releaseUrl =
      info.tag === "latest"
        ? `https://api.github.com/repos/${info.owner}/${info.name}/releases/latest`
        : `https://api.github.com/repos/${info.owner}/${info.name}/releases/tags/${info.tag}`;

    let response = await fetch(releaseUrl, {
      agent: agent("https://api.github.com"),
      headers,
    });

    if (response.status !== 200) {
      throw new CopyTemplateError(
        "There was a problem fetching the file from GitHub. The request " +
          `responded with a ${response.status} status. Please try again later.`
      );
    }

    let body = (await response.json()) as { assets: GitHubApiReleaseAsset[] };
    if (
      !body ||
      typeof body !== "object" ||
      !body.assets ||
      !Array.isArray(body.assets)
    ) {
      throw new CopyTemplateError(
        "There was a problem fetching the file from GitHub. No asset was " +
          "found at that url. Please try again later."
      );
    }

    let assetId = body.assets.find((asset) => {
      // If the release is "latest", the url won't match the download url
      return info.tag === "latest"
        ? asset?.browser_download_url?.includes(info.asset)
        : asset?.browser_download_url === tarballUrl;
    })?.id;
    if (assetId == null) {
      throw new CopyTemplateError(
        "There was a problem fetching the file from GitHub. No asset was " +
          "found at that url. Please try again later."
      );
    }
    resourceUrl = `https://api.github.com/repos/${info.owner}/${info.name}/releases/assets/${assetId}`;
    headers.Accept = "application/octet-stream";
  }
  let response = await fetch(resourceUrl, {
    agent: agent(resourceUrl),
    headers,
  });

  if (!response.body || response.status !== 200) {
    if (token) {
      throw new CopyTemplateError(
        `There was a problem fetching the file${
          isGithubUrl ? " from GitHub" : ""
        }. The request ` +
          `responded with a ${response.status} status. Perhaps your \`--token\`` +
          "is expired or invalid."
      );
    }
    throw new CopyTemplateError(
      `There was a problem fetching the file${
        isGithubUrl ? " from GitHub" : ""
      }. The request ` +
        `responded with a ${response.status} status. Please try again later.`
    );
  }

  // file paths returned from GitHub are always unix style
  if (filePath) {
    filePath = filePath.split(path.sep).join(path.posix.sep);
  }

  let filePathHasFiles = false;

  try {
    let input = new stream.PassThrough();
    // Start reading stream into passthrough, don't await to avoid buffering
    writeReadableStreamToWritable(response.body, input);
    await pipeline(
      input,
      gunzip(),
      tar.extract(downloadPath, {
        map(header) {
          let originalDirName = header.name.split("/")[0];
          header.name = header.name.replace(`${originalDirName}/`, "");

          if (filePath) {
            // Include trailing slash on startsWith when filePath doesn't include
            // it so something like `templates/basic` doesn't inadvertently
            // include `templates/basic-javascript/*` files
            if (
              (filePath.endsWith(path.posix.sep) &&
                header.name.startsWith(filePath)) ||
              (!filePath.endsWith(path.posix.sep) &&
                header.name.startsWith(filePath + path.posix.sep))
            ) {
              filePathHasFiles = true;
              header.name = header.name.replace(filePath, "");
            } else {
              header.name = "__IGNORE__";
            }
          }

          return header;
        },
        ignore(_filename, header) {
          if (!header) {
            throw Error("Header is undefined");
          }
          return header.name === "__IGNORE__";
        },
      })
    );
  } catch (_) {
    throw new CopyTemplateError(
      "There was a problem extracting the file from the provided template." +
        `  Template URL: \`${tarballUrl}\`` +
        `  Destination directory: \`${downloadPath}\``
    );
  }

  if (filePath && !filePathHasFiles) {
    throw new CopyTemplateError(
      `The path "${filePath}" was not found in this ${
        isGithubUrl ? "GitHub repo." : "tarball."
      }`
    );
  }
}

// Copied from react-router-node/stream.ts
async function writeReadableStreamToWritable(
  stream: ReadableStream,
  writable: stream.Writable
) {
  let reader = stream.getReader();
  let flushable = writable as { flush?: Function };

  try {
    while (true) {
      let { done, value } = await reader.read();

      if (done) {
        writable.end();
        break;
      }

      writable.write(value);
      if (typeof flushable.flush === "function") {
        flushable.flush();
      }
    }
  } catch (error: unknown) {
    writable.destroy(error as Error);
    throw error;
  }
}

function isValidGithubRepoUrl(
  input: string | URL
): input is URL | GithubUrlString {
  if (!isUrl(input)) {
    return false;
  }
  try {
    let url = new URL(input);
    let pathSegments = url.pathname.slice(1).split("/");

    return (
      url.protocol === "https:" &&
      url.hostname === "github.com" &&
      // The pathname must have at least 2 segments. If it has more than 2, the
      // third must be "tree" and it must have at least 4 segments.
      // https://github.com/:owner/:repo
      // https://github.com/:owner/:repo/tree/:ref
      pathSegments.length >= 2 &&
      (pathSegments.length > 2
        ? pathSegments[2] === "tree" && pathSegments.length >= 4
        : true)
    );
  } catch (_) {
    return false;
  }
}

function isGithubRepoShorthand(value: string) {
  if (isUrl(value)) {
    return false;
  }
  // This supports :owner/:repo and :owner/:repo/nested/path, e.g.
  // remix-run/react-router
  // remix-run/react-router/examples/basic
  return /^[\w-]+\/[\w-.]+(\/[\w-.]+)*$/.test(value);
}

function isGithubReleaseAssetUrl(url: string) {
  /**
   * Accounts for the following formats:
   * https://github.com/owner/repository/releases/download/v0.0.1/template.tar.gz
   * ~or~
   * https://github.com/owner/repository/releases/latest/download/template.tar.gz
   */
  return (
    url.startsWith("https://github.com") &&
    (url.includes("/releases/download/") ||
      url.includes("/releases/latest/download/"))
  );
}

function getGithubReleaseAssetInfo(browserUrl: string): ReleaseAssetInfo {
  /**
   * https://github.com/owner/repository/releases/download/v0.0.1/template.tar.gz
   * ~or~
   * https://github.com/owner/repository/releases/latest/download/template.tar.gz
   */

  let url = new URL(browserUrl);
  let [, owner, name, , downloadOrLatest, tag, asset] = url.pathname.split("/");

  if (downloadOrLatest === "latest" && tag === "download") {
    // handle the GitHub URL quirk for latest releases
    tag = "latest";
  }

  return {
    browserUrl,
    owner,
    name,
    asset,
    tag,
  };
}

function getRepoInfo(validatedGithubUrl: string): RepoInfo {
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
      owner,
      name,
      branch: null,
      filePath: null,
    };
  }

  return {
    owner,
    name,
    // If we've validated the GitHub URL and there is a tree, there will also be
    // a branch
    branch: branch!,
    filePath: filePath === "" || filePath === "/" ? null : filePath,
  };
}

export class CopyTemplateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CopyTemplateError";
  }
}

interface RepoInfo {
  owner: string;
  name: string;
  branch?: string | null;
  filePath?: string | null;
}

// https://docs.github.com/en/rest/releases/assets?apiVersion=2022-11-28#get-a-release-asset
interface GitHubApiReleaseAsset {
  url: string;
  browser_download_url: string;
  id: number;
  node_id: string;
  name: string;
  label: string;
  state: "uploaded" | "open";
  content_type: string;
  size: number;
  download_count: number;
  created_at: string;
  updated_at: string;
  uploader: null | GitHubApiUploader;
}

interface GitHubApiUploader {
  name: string | null;
  email: string | null;
  login: string;
  id: number;
  node_id: string;
  avatar_url: string;
  gravatar_id: string | null;
  url: string;
  html_url: string;
  followers_url: string;
  following_url: string;
  gists_url: string;
  starred_url: string;
  subscriptions_url: string;
  organizations_url: string;
  repos_url: string;
  events_url: string;
  received_events_url: string;
  type: string;
  site_admin: boolean;
  starred_at: string;
}

interface ReleaseAssetInfo {
  browserUrl: string;
  owner: string;
  name: string;
  asset: string;
  tag: string;
}

type GithubUrlString =
  | `https://github.com/${string}/${string}`
  | `https://www.github.com/${string}/${string}`;
