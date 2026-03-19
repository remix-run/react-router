import path from "node:path";
import { createRequire } from "node:module";

const nodeRequire = createRequire(import.meta.url);
const jestEnvironmentJsdomDir = path.dirname(
  nodeRequire.resolve("jest-environment-jsdom/package.json"),
);
const { JSDOM } = nodeRequire(path.join(
  jestEnvironmentJsdomDir,
  "../jsdom",
)) as typeof import("jsdom");

export default function getWindow(initialUrl: string, isHash = false): Window {
  // Need to use our own custom DOM in order to get a working history
  const dom = new JSDOM(`<!DOCTYPE html>`, { url: "http://localhost/" });
  dom.window.history.replaceState(null, "", (isHash ? "#" : "") + initialUrl);
  return dom.window as unknown as Window;
}
