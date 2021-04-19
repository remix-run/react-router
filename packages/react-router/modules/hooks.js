import React from "react";
import invariant from "tiny-invariant";

import RouterContext from "./RouterContext.js";
import HistoryContext from "./HistoryContext.js";
import matchPath from "./matchPath.js";

const { useContext, useMemo } = React;

export function useHistory() {
  if (__DEV__) {
    invariant(
      typeof useContext === "function",
      "You must use React >= 16.8 in order to use useHistory()"
    );
  }

  return useContext(HistoryContext);
}

export function useLocation() {
  if (__DEV__) {
    invariant(
      typeof useContext === "function",
      "You must use React >= 16.8 in order to use useLocation()"
    );
  }

  return useContext(RouterContext).location;
}

export function useParams() {
  if (__DEV__) {
    invariant(
      typeof useContext === "function",
      "You must use React >= 16.8 in order to use useParams()"
    );
  }

  const match = useContext(RouterContext).match;
  return match ? match.params : {};
}

export function useRouteMatch(path) {
  if (__DEV__) {
    invariant(
      typeof useContext === "function" && typeof useMemo === "function",
      "You must use React >= 16.8 in order to use useRouteMatch()"
    );
  }

  const location = useLocation();
  const match = useContext(RouterContext).match;
  const pathMatch = useMemo(
    () => (path ? matchPath(location.pathname, path) : null),
    [location.pathname, path]
  );

  return path ? pathMatch : match;
}
