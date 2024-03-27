/** @type {import('@remix-run/dev').AppConfig} */
module.exports = {
  server: "./server.ts",
  serverConditions: ["deno", "worker"],
  serverDependenciesToBundle: "all",
  serverMainFields: ["module", "main"],
  serverModuleFormat: "esm",
  serverPlatform: "neutral",
  // appDirectory: "app",
  // assetsBuildDirectory: "public/build",
  // publicPath: "/build/",
  // serverBuildPath: "build/index.js",

  // !!! Don't adjust this without changing the code that overwrites this
  // in createFixtureProject()
  ...global.INJECTED_FIXTURE_REMIX_CONFIG,
};
