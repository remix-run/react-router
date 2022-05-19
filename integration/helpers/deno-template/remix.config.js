module.exports = {
  serverBuildTarget: "deno",
  server: "./server.ts",
  /*
  If live reload causes page to re-render without changes (live reload is too fast),
  increase the dev server broadcast delay.

  If live reload seems slow, try to decrease the dev server broadcast delay.
  */
  devServerBroadcastDelay: 300,
  ignoredRouteFiles: ["**/.*"],
  // appDirectory: "app",
  // assetsBuildDirectory: "public/build",
  // serverBuildPath: "build/index.js",
  // publicPath: "/build/",
};
