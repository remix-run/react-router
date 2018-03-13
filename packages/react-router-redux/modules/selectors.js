import { matchPath } from "react-router";

export const getLocation = state => state.router.location;
export const getAction = state => state.router.action;

export const createMatchSelector = path => {
  let lastPathname = null;
  let lastMatch = null;
  return state => {
    const { pathname } = getLocation(state) || {};
    if (pathname === lastPathname) {
      return lastMatch;
    }
    lastPathname = pathname;
    const match = matchPath(pathname, path);
    if (!match || !lastMatch || match.url !== lastMatch.url) {
      lastMatch = match;
    }
    return lastMatch;
  };
};
