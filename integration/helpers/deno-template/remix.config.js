/** @type {import('@remix-run/dev').AppConfig} */
export default {
  ignoredRouteFiles: ["**/.*"],
  server: "./server.ts",
  serverConditions: ["deno", "worker"],
  serverDependenciesToBundle: "all",
  serverMainFields: ["module", "main"],
  serverModuleFormat: "esm",
  serverPlatform: "neutral",
  // appDirectory: "app",
  // assetsBuildDirectory: "public/build",
  // serverBuildPath: "build/index.js",
  // publicPath: "/build/",

  // !!! Don't adust this without changing the code that overwrites this
  // in createFixtureProject()
  ...global.INJECTED_FIXTURE_REMIX_CONFIG,
};
