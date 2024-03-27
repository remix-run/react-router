import { promises as fsp } from "node:fs";
import * as path from "node:path";
import type * as esbuild from "esbuild";
import { remarkMdxFrontmatter } from "remark-mdx-frontmatter";

import { getLoaderForFile } from "../utils/loaders";
import { createMatchPath } from "../utils/tsconfig";
import type { Context } from "../context";

export function mdxPlugin({ config }: Pick<Context, "config">): esbuild.Plugin {
  return {
    name: "remix-mdx",
    async setup(build) {
      let [mdx, { default: remarkFrontmatter }] = await Promise.all([
        import("@mdx-js/mdx"),
        import("remark-frontmatter") as any,
      ]);

      build.onResolve({ filter: /\.mdx?$/ }, (args) => {
        let matchPath = createMatchPath(config.tsconfigPath);
        // Resolve paths according to tsconfig paths property
        function resolvePath(id: string) {
          if (!matchPath) {
            return id;
          }
          return (
            matchPath(id, undefined, undefined, [
              ".ts",
              ".tsx",
              ".js",
              ".jsx",
              ".mdx",
              ".md",
            ]) || id
          );
        }

        let resolvedPath = resolvePath(args.path);
        let resolved = path.resolve(args.resolveDir, resolvedPath);

        return {
          path: path.relative(config.appDirectory, resolved),
          namespace: "mdx",
        };
      });

      build.onLoad({ filter: /\.mdx?$/ }, async (args) => {
        let absolutePath = path.join(config.appDirectory, args.path);

        return processMDX(
          mdx,
          remarkFrontmatter,
          config,
          args.path,
          absolutePath
        );
      });
    },
  };
}

export async function processMDX(
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  mdx: typeof import("@mdx-js/mdx"),
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  remarkFrontmatter: typeof import("remark-frontmatter")["default"],
  config: Pick<Context, "config">["config"],
  argsPath: string,
  absolutePath: string
) {
  try {
    let fileContents = await fsp.readFile(absolutePath, "utf-8");

    let rehypePlugins = [];
    let remarkPlugins: any[] = [
      remarkFrontmatter,
      [remarkMdxFrontmatter, { name: "attributes" }],
    ];

    switch (typeof config.mdx) {
      case "object":
        rehypePlugins.push(...(config.mdx.rehypePlugins || []));
        remarkPlugins.push(...(config.mdx.remarkPlugins || []));

        break;
      case "function":
        let mdxConfig = await config.mdx(argsPath);
        rehypePlugins.push(...(mdxConfig?.rehypePlugins || []));
        remarkPlugins.push(...(mdxConfig?.remarkPlugins || []));
        break;
    }

    let remixExports = `
export const filename = ${JSON.stringify(path.basename(argsPath))};
export const headers = typeof attributes !== "undefined" && attributes.headers;
export const meta = typeof attributes !== "undefined" && attributes.meta;
export const handle = typeof attributes !== "undefined" && attributes.handle;
    `;

    let compiled = await mdx.compile(fileContents, {
      jsx: true,
      jsxRuntime: "automatic",
      rehypePlugins,
      remarkPlugins,
    });

    let contents = `
${compiled.value}
${remixExports}`;

    let errors: esbuild.PartialMessage[] = [];
    let warnings: esbuild.PartialMessage[] = [];

    compiled.messages.forEach((message) => {
      let toPush = message.fatal ? errors : warnings;
      toPush.push({
        location:
          message.line || message.column
            ? {
                column:
                  typeof message.column === "number"
                    ? message.column
                    : undefined,
                line:
                  typeof message.line === "number" ? message.line : undefined,
              }
            : undefined,
        text: message.message,
        detail: typeof message.note === "string" ? message.note : undefined,
      });
    });

    return {
      errors: errors.length ? errors : undefined,
      warnings: warnings.length ? warnings : undefined,
      contents,
      resolveDir: path.dirname(absolutePath),
      loader: getLoaderForFile(argsPath),
    };
  } catch (err: any) {
    return {
      errors: [
        {
          text: err.message,
        },
      ],
    };
  }
}
