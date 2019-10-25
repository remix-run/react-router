import React from "react";
import invariant from "tiny-invariant";

import Context from "./RouterContext.js";
import matchPath from "./matchPath.js";

const useContext = React.useContext;
const useTransition = React.useTransition;

export function useHistory() {
  if (__DEV__) {
    invariant(
      typeof useContext === "function",
      "You must use React >= 16.8 in order to use useHistory()"
    );
  }

  return useContext(Context).history;
}

export function useLocation() {
  if (__DEV__) {
    invariant(
      typeof useContext === "function",
      "You must use React >= 16.8 in order to use useLocation()"
    );
  }

  return useContext(Context).location;
}

export function useParams() {
  if (__DEV__) {
    invariant(
      typeof useContext === "function",
      "You must use React >= 16.8 in order to use useParams()"
    );
  }

  const match = useContext(Context).match;
  return match ? match.params : {};
}

export function useRouteMatch(path) {
  if (__DEV__) {
    invariant(
      typeof useContext === "function",
      "You must use React >= 16.8 in order to use useRouteMatch()"
    );
  }

  const location = useLocation();
  const match = useContext(Context).match;

  return path ? matchPath(location.pathname, path) : match;
}

export function useResource() {
  if (__DEV__) {
    invariant(
      typeof useTransition === "function",
      "You must use react@experimental in order to use useResource()"
    );
  }

  return useContext(Context).resource;
}

export function useResourcesPending() {
  if (__DEV__) {
    invariant(
      typeof useTransition === "function",
      "You must use react@experimental in order to use useResource()"
    );
  }

  return useContext(Context).isPending;
}
