import { defineConfig } from "vite";
import { __INTERNAL_DO_NOT_USE_OR_YOU_WILL_GET_A_STRONGLY_WORDED_LETTER__ } from "@react-router/dev/internal";
import rsc from "@vitejs/plugin-rsc";
import mdx from "@mdx-js/rollup";
import remarkFrontmatter from "remark-frontmatter";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";

const { unstable_reactRouterRSC: reactRouterRsc } =
  __INTERNAL_DO_NOT_USE_OR_YOU_WILL_GET_A_STRONGLY_WORDED_LETTER__;

export default defineConfig({
  plugins: [
    mdx({ remarkPlugins: [remarkFrontmatter, remarkMdxFrontmatter] }),
    reactRouterRsc(),
    rsc(),
  ],
});
