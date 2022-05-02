import * as nodePath from "path";
import fsp from "fs/promises";
import invariant from "tiny-invariant";
import type { setupServer } from "msw/node";
import { rest } from "msw";

type RequestHandler = Parameters<typeof setupServer>[0];

async function isDirectory(d: string) {
  try {
    return (await fsp.lstat(d)).isDirectory();
  } catch {
    return false;
  }
}
async function isFile(d: string) {
  try {
    return (await fsp.lstat(d)).isFile();
  } catch {
    return false;
  }
}

type GHContentsDescription = {
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  html_url: string;
  git_url: string;
  download_url: string | null;
  type: "dir" | "file";
  _links: {
    self: string;
    git: string;
    html: string;
  };
};

type GHContent = {
  sha: string;
  node_id: string;
  size: number;
  url: string;
  content: string;
  encoding: "base64";
};

type ResponseResolver = Parameters<typeof rest.get>[1];

let sendTarball: ResponseResolver = async (req, res, ctx) => {
  let { owner, repo } = req.params;
  invariant(typeof owner === "string", "owner must be a string");
  invariant(typeof repo === "string", "repo must be a string");

  let pathToTarball: string;
  if (owner === "remix-run" && repo === "remix") {
    pathToTarball = nodePath.join(__dirname, "fixtures/remix-repo.tar.gz");
  } else if (owner === "fake-remix-tester" && repo === "nested-dir") {
    pathToTarball = nodePath.join(__dirname, "fixtures/nested-dir-repo.tar.gz");
  } else {
    pathToTarball = nodePath.join(__dirname, "fixtures/stack.tar.gz");
  }
  let fileBuffer = await fsp.readFile(pathToTarball);

  return res(
    ctx.body(fileBuffer),
    ctx.set("Content-Type", "application/x-gzip")
  );
};
let githubHandlers: Array<RequestHandler> = [
  rest.head(
    `https://github.com/remix-run/remix/tree/main/:type/:name`,
    async (req, res, ctx) => {
      return res(ctx.status(200));
    }
  ),
  rest.head(
    `https://github.com/error-username/:status`,
    async (req, res, ctx) => {
      return res(ctx.status(Number(req.params.status)));
    }
  ),
  rest.head(`https://github.com/:owner/:repo`, async (req, res, ctx) => {
    return res(ctx.status(200));
  }),
  rest.head(
    `https://github.com/:owner/:repo/tree/:branch/:path*`,
    async (req, res, ctx) => {
      return res(ctx.status(200));
    }
  ),
  rest.get(
    `https://api.github.com/repos/:owner/:repo/contents/:path`,
    async (req, res, ctx) => {
      let { owner, repo } = req.params;
      if (typeof req.params.path !== "string") {
        throw new Error("req.params.path must be a string");
      }
      let path = decodeURIComponent(req.params.path).trim();
      let isMockable = owner === "remix-run" && repo === "remix";

      if (!isMockable) {
        let message = `Attempting to get content description for unmockable resource: ${owner}/${repo}/${path}`;
        console.error(message);
        throw new Error(message);
      }

      let localPath = nodePath.join(__dirname, "../../..", path);
      let isLocalDir = await isDirectory(localPath);
      let isLocalFile = await isFile(localPath);

      if (!isLocalDir && !isLocalFile) {
        return res(
          ctx.status(404),
          ctx.json({
            message: "Not Found",
            documentation_url:
              "https://docs.github.com/rest/reference/repos#get-repository-content",
          })
        );
      }

      if (isLocalFile) {
        let encoding = "base64" as const;
        let content = await fsp.readFile(localPath, { encoding: "utf-8" });
        return res(
          ctx.status(200),
          ctx.json({
            content: Buffer.from(content, "utf-8").toString(encoding),
            encoding,
          })
        );
      }

      let dirList = await fsp.readdir(localPath);

      let contentDescriptions = await Promise.all(
        dirList.map(async (name): Promise<GHContentsDescription> => {
          let relativePath = nodePath.join(path, name);
          // NOTE: this is a cheat-code so we don't have to determine the sha of the file
          // and our sha endpoint handler doesn't have to do a reverse-lookup.
          let sha = relativePath;
          let fullPath = nodePath.join(localPath, name);
          let isDir = await isDirectory(fullPath);
          let size = isDir ? 0 : (await fsp.stat(fullPath)).size;
          return {
            name,
            path: relativePath,
            sha,
            size,
            url: `https://api.github.com/repos/${owner}/${repo}/contents/${path}?${req.url.searchParams}`,
            html_url: `https://github.com/${owner}/${repo}/tree/main/${path}`,
            git_url: `https://api.github.com/repos/${owner}/${repo}/git/trees/${sha}`,
            download_url: null,
            type: isDir ? "dir" : "file",
            _links: {
              self: `https://api.github.com/repos/${owner}/${repo}/contents/${path}${req.url.searchParams}`,
              git: `https://api.github.com/repos/${owner}/${repo}/git/trees/${sha}`,
              html: `https://github.com/${owner}/${repo}/tree/main/${path}`,
            },
          };
        })
      );

      return res(ctx.json(contentDescriptions));
    }
  ),
  rest.get(
    `https://api.github.com/repos/:owner/:repo/git/blobs/:sha`,
    async (req, res, ctx) => {
      let { owner, repo } = req.params;
      if (typeof req.params.sha !== "string") {
        throw new Error("req.params.sha must be a string");
      }
      let sha = decodeURIComponent(req.params.sha).trim();
      // if the sha includes a "/" that means it's not a sha but a relativePath
      // and therefore the client is getting content it got from the local
      // mock environment, not the actual github API.
      if (!sha.includes("/")) {
        let message = `Attempting to get content for sha, but no sha exists locally: ${sha}`;
        console.error(message);
        throw new Error(message);
      }

      // NOTE: we cheat a bit and in the contents/:path handler, we set the sha to the relativePath
      let relativePath = sha;
      let fullPath = nodePath.join(__dirname, "..", relativePath);
      let encoding = "base64" as const;
      let size = (await fsp.stat(fullPath)).size;
      let content = await fsp.readFile(fullPath, { encoding: "utf-8" });

      let resource: GHContent = {
        sha,
        node_id: `${sha}_node_id`,
        size,
        url: `https://api.github.com/repos/${owner}/${repo}/git/blobs/${sha}`,
        content: Buffer.from(content, "utf-8").toString(encoding),
        encoding,
      };

      return res(ctx.json(resource));
    }
  ),
  rest.get(
    `https://api.github.com/repos/:owner/:repo/contents/:path*`,
    async (req, res, ctx) => {
      let { owner, repo } = req.params;

      let relativePath = req.params.path;
      if (typeof relativePath !== "string") {
        throw new Error("req.params.path must be a string");
      }
      let fullPath = nodePath.join(__dirname, "..", relativePath);
      let encoding = "base64" as const;
      let size = (await fsp.stat(fullPath)).size;
      let content = await fsp.readFile(fullPath, { encoding: "utf-8" });
      let sha = `${relativePath}_sha`;

      let resource: GHContent = {
        sha,
        node_id: `${req.params.path}_node_id`,
        size,
        url: `https://api.github.com/repos/${owner}/${repo}/git/blobs/${sha}`,
        content: Buffer.from(content, "utf-8").toString(encoding),
        encoding,
      };

      return res(ctx.json(resource));
    }
  ),
  rest.get(
    `https://codeload.github.com/:owner/:repo/tar.gz/:branch`,
    sendTarball
  ),
  rest.get(`https://api.github.com/repos/:owner/:repo/tarball`, sendTarball),
  rest.get(`https://api.github.com/repos/:repo*`, async (req, res, ctx) => {
    return res(ctx.json({ default_branch: "main" }));
  }),
];

export { githubHandlers };
