import { promises as fsp } from "fs";
import * as path from "path";
import type * as esbuild from "esbuild";
import { remarkMdxFrontmatter } from "remark-mdx-frontmatter";

import type { RemixConfig } from "../../config";
import { getLoaderForFile } from "../loaders";

export function mdxPlugin(config: RemixConfig): esbuild.Plugin {
  return {
    name: "remix-mdx",
    async setup(build) {
      let [xdm, { default: remarkFrontmatter }] = await Promise.all([
        import("xdm"),
        import("remark-frontmatter") as any
      ]);

      build.onResolve({ filter: /\.mdx?$/ }, args => {
        return {
          path: args.path.startsWith("~/")
            ? path.resolve(config.appDirectory, args.path.replace(/^~\//, ""))
            : path.resolve(args.resolveDir, args.path),
          namespace: "mdx"
        };
      });

      build.onLoad({ filter: /\.mdx?$/ }, async args => {
        try {
          let contents = await fsp.readFile(args.path, "utf-8");

          let rehypePlugins = [];
          let remarkPlugins = [
            remarkFrontmatter,
            [remarkMdxFrontmatter, { name: "attributes" }]
          ];

          switch (typeof config.mdx) {
            case "object":
              rehypePlugins.push(...(config.mdx.rehypePlugins || []));
              remarkPlugins.push(...(config.mdx.remarkPlugins || []));

              break;
            case "function":
              let mdxConfig = await config.mdx(args.path);
              rehypePlugins.push(...(mdxConfig?.rehypePlugins || []));
              remarkPlugins.push(...(mdxConfig?.remarkPlugins || []));
              break;
          }

          let remixExports = `
export const filename = ${JSON.stringify(path.basename(args.path))};
export const headers = typeof attributes !== "undefined" && attributes.headers;
export const meta = typeof attributes !== "undefined" && attributes.meta;
export const links = undefined;
          `;

          let compiled = await xdm.compile(contents, {
            jsx: true,
            jsxRuntime: "classic",
            pragma: "React.createElement",
            pragmaFrag: "React.Fragment",
            rehypePlugins,
            remarkPlugins
          });

          contents = `
${compiled.value}
${remixExports}`;

          let errors: esbuild.PartialMessage[] = [];
          let warnings: esbuild.PartialMessage[] = [];

          compiled.messages.forEach(message => {
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
                        typeof message.line === "number"
                          ? message.line
                          : undefined
                    }
                  : undefined,
              text: message.message,
              detail:
                typeof message.note === "string" ? message.note : undefined
            });
          });

          return {
            errors: errors.length ? errors : undefined,
            warnings: warnings.length ? warnings : undefined,
            contents,
            resolveDir: path.dirname(args.path),
            loader: getLoaderForFile(args.path)
          };
        } catch (err: any) {
          return {
            errors: [
              {
                text: err.message
              }
            ]
          };
        }
      });
    }
  };
}
