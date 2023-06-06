/** @type {import('@remix-run/dev').AppConfig} */
module.exports = {
  /*
  If live reload causes page to re-render without changes (live reload is too fast),
  increase the dev server broadcast delay.

  If live reload seems slow, try to decrease the dev server broadcast delay.
  */
  devServerBroadcastDelay: 300,
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
