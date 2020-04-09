if (__DEV__) {
  if (typeof window !== "undefined") {
    const global = window;
    const key = "__react_router_build__";
    const buildNames = { cjs: "CommonJS", esm: "ES modules", umd: "UMD" };

    if (global[key] && global[key] !== process.env.BUILD_FORMAT) {
      const initialBuildName = buildNames[global[key]];
      const secondaryBuildName = buildNames[process.env.BUILD_FORMAT];

      // TODO: Add link to article that explains in detail how to avoid
      // loading 2 different builds.

      // Some extra clarification when we have "esm" react-router embedded in "umd" react-router-dom
      const umdEsm =
        "esm" === process.env.BUILD_FORMAT && global[key] === "umd"
          ? " As you are using UMD, you only need to load react-router-dom which contains react-router." +
            " If using a loader, you should map react-router to react-router-dom."
          : "";
      throw new Error(
        `You are loading the ${secondaryBuildName} build of React Router ` +
          `on a page that is already running the ${initialBuildName} ` +
          `build, so things won't work right.${umdEsm}`
      );
    }

    global[key] = process.env.BUILD_FORMAT;
  }
}

export { default as MemoryRouter } from "./MemoryRouter.js";
export { default as Prompt } from "./Prompt.js";
export { default as Redirect } from "./Redirect.js";
export { default as Route } from "./Route.js";
export { default as Router } from "./Router.js";
export { default as StaticRouter } from "./StaticRouter.js";
export { default as Switch } from "./Switch.js";
export { default as generatePath } from "./generatePath.js";
export { default as matchPath } from "./matchPath.js";
export { default as withRouter } from "./withRouter.js";

import { useHistory, useLocation, useParams, useRouteMatch } from "./hooks.js";
export { useHistory, useLocation, useParams, useRouteMatch };

export { default as __RouterContext } from "./RouterContext.js";
