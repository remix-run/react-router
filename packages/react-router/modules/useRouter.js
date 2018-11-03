import React, { useContext } from "react";
import invariant from "tiny-invariant";

import RouterContext from "./RouterContext";
import matchPath from "./matchPath";

export default function useRouter(options = {}) {
  invariant(
    typeof useContext === "function",
    "The useRouter hook requires React 16.7 or greater"
  );

  let context = useContext(RouterContext);
  let location = options.location || context.location;
  let match = options.path
    ? matchPath(location.pathname, options)
    : context.match;

  return { ...context, location, match };
}
