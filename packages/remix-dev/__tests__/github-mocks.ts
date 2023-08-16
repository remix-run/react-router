import * as path from "node:path";
import fsp from "node:fs/promises";
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
  if (owner === "remix-run" && repo === "examples") {
    pathToTarball = path.join(__dirname, "fixtures", "examples-main.tar.gz");
  } else if (owner === "remix-run" && repo === "remix") {
    pathToTarball = path.join(__dirname, "fixtures", "remix-repo.tar.gz");
  } else if (owner === "fake-remix-tester" && repo === "nested-dir") {
    pathToTarball = path.join(__dirname, "fixtures", "nested-dir-repo.tar.gz");
  } else {
    pathToTarball = path.join(__dirname, "fixtures", "stack.tar.gz");
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
    async (_req, res, ctx) => {
      return res(ctx.status(200));
    }
  ),
  rest.head(
    `https://github.com/remix-run/examples/tree/main/:type/:name`,
    async (_req, res, ctx) => {
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
    `https://api.github.com/repos/error-username/:status`,
    async (req, res, ctx) => {
      return res(ctx.status(Number(req.params.status)));
    }
  ),
  rest.head(
    `https://api.github.com/repos/private-org/private-repo`,
    async (req, res, ctx) => {
      let status =
        req.headers.get("Authorization") === "token valid-token" ? 200 : 404;
      return res(ctx.status(status));
    }
  ),
  rest.head(
    `https://api.github.com/repos/:owner/:repo`,
    async (req, res, ctx) => {
      return res(ctx.status(200));
    }
  ),
  rest.head(
    `https://github.com/:owner/:repo/tree/:branch/:path*`,
    async (req, res, ctx) => {
      return res(ctx.status(200));
    }
  ),
  rest.get(
    `https://api.github.com/repos/:owner/:repo/git/trees/:branch`,
    async (req, res, ctx) => {
      let { owner, repo } = req.params;

      return res(
        ctx.status(200),
        ctx.json({
          sha: "7d906ff5bbb79401a4a8ec1e1799845ed502c0a1",
          url: `https://api.github.com/repos/${owner}/${repo}/trees/7d906ff5bbb79401a4a8ec1e1799845ed502c0a1`,
          tree: [
            {
              path: "package.json",
              mode: "040000",
              type: "blob",
              sha: "a405cd8355516db9c96e1467fb14b74c97ac0a65",
              size: 138,
              url: `https://api.github.com/repos/${owner}/${repo}/git/blobs/a405cd8355516db9c96e1467fb14b74c97ac0a65`,
            },
            {
              path: "stack",
              mode: "040000",
              type: "tree",
              sha: "3f350a670e8fefd58535a9e1878539dc19afb4b5",
              url: `https://api.github.com/repos/${owner}/${repo}/trees/3f350a670e8fefd58535a9e1878539dc19afb4b5`,
            },
          ],
        })
      );
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

      let localPath = path.join(__dirname, "../../..", path);
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
          let relativePath = path.join(path, name);
          // NOTE: this is a cheat-code so we don't have to determine the sha of the file
          // and our sha endpoint handler doesn't have to do a reverse-lookup.
          let sha = relativePath;
          let fullPath = path.join(localPath, name);
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
      let fullPath = path.join(__dirname, "..", relativePath);
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
      let fullPath = path.join(__dirname, "..", relativePath);
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
    `https://codeload.github.com/private-org/private-repo/tar.gz/:branch`,
    (req, res, ctx) => {
      if (req.headers.get("Authorization") !== "token valid-token") {
        return res(ctx.status(404));
      }
      req.params.owner = "private-org";
      req.params.repo = "private-repo";
      return sendTarball(req, res, ctx);
    }
  ),
  rest.get(
    `https://codeload.github.com/:owner/:repo/tar.gz/:branch`,
    sendTarball
  ),
  rest.get(
    `https://api.github.com/repos/private-org/private-repo/tarball`,
    (req, res, ctx) => {
      if (req.headers.get("Authorization") !== "token valid-token") {
        return res(ctx.status(404));
      }
      req.params.owner = "private-org";
      req.params.repo = "private-repo";

      return sendTarball(req, res, ctx);
    }
  ),
  rest.get(
    `https://api.github.com/repos/private-org/private-repo/releases/tags/:tag`,
    (req, res, ctx) => {
      if (req.headers.get("Authorization") !== "token valid-token") {
        return res(ctx.status(404));
      }
      let { tag } = req.params;
      return res(
        ctx.status(200),
        ctx.json({
          assets: [
            {
              browser_download_url: `https://github.com/private-org/private-repo/releases/download/${tag}/stack.tar.gz`,
              id: "working-asset-id",
            },
          ],
        })
      );
    }
  ),
  rest.get(
    `https://api.github.com/repos/private-org/private-repo/releases/assets/working-asset-id`,
    (req, res, ctx) => {
      if (req.headers.get("Authorization") !== "token valid-token") {
        return res(ctx.status(404));
      }
      req.params.owner = "private-org";
      req.params.repo = "private-repo";
      return sendTarball(req, res, ctx);
    }
  ),
  rest.get(`https://api.github.com/repos/:owner/:repo/tarball`, sendTarball),
  rest.get(`https://api.github.com/repos/:repo*`, async (req, res, ctx) => {
    return res(ctx.json({ default_branch: "main" }));
  }),
];

export { githubHandlers };
