import fs from "fs/promises";
import path from "path";
import setupPuppeteer from "jest-environment-puppeteer/setup";

export const TMP_DIR = path.join(process.cwd(), ".tmp");

// TODO: get rid of React Router `console.warn` when no routes match when testing
console.warn = () => {};

export default async function setup(globalConfig: any) {
  await setupPuppeteer(globalConfig);
  await fs.rm(TMP_DIR, {
    force: true,
    recursive: true,
  });
  await fs.mkdir(TMP_DIR);
}
