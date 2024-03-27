/** @type {import('@remix-run/dev').AppConfig} */
export default {
  // appDirectory: "app",
  // assetsBuildDirectory: "public/build",
  // publicPath: "/build/",
  // serverBuildPath: "build/index.js",

  // !!! Don't adjust this without changing the code that overwrites this
  // in createFixtureProject()
  ...global.INJECTED_FIXTURE_REMIX_CONFIG,
};
