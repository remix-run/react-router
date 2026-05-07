import { defineConfig } from "vite";
import { unstable_reactRouterRSC as reactRouterRSC } from "@react-router/dev/vite";
import rsc from "@vitejs/plugin-rsc";
import mdx from "@mdx-js/rollup";
import remarkFrontmatter from "remark-frontmatter";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";
import react from "@vitejs/plugin-react";

export default defineConfig({
  build: {
    minify: false,
  },
  plugins: [
    { enforce: "pre", ...mdx({ remarkPlugins: [remarkFrontmatter, remarkMdxFrontmatter] })},
    // @ts-ignore
    reactRouterRSC({ __runningWithinTheReactRouterMonoRepo: true }),
    react(),
    rsc(),
  ],
});
