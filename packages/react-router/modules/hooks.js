// 绝对路径/根路径 分块儿
import React from "react";
import invariant from "tiny-invariant";

// 相对路径 分块儿
import RouterContext from "./RouterContext.js";
import HistoryContext from "./HistoryContext.js";
import matchPath from "./matchPath.js";

// 透传数据，跨多文件获取 react provider 数据
const useContext = React.useContext;

// DONE: 自定义 hooks
export function useHistory() {
  if (__DEV__) {
    // 兼容抛错 api/插件
    invariant(
      typeof useContext === "function",
      "You must use React >= 16.8 in order to use useHistory()"
    );
  }

  return useContext(HistoryContext);
}

// DONE: 自定义 hooks
export function useLocation() {
  if (__DEV__) {
    invariant(
      typeof useContext === "function",
      "You must use React >= 16.8 in order to use useLocation()"
    );
  }

  return useContext(RouterContext).location;
}

// DONE: 自定义 hooks
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
      typeof useContext === "function",
      "You must use React >= 16.8 in order to use useRouteMatch()"
    );
  }

  const location = useLocation();
  const match = useContext(RouterContext).match;
  return path ? matchPath(location.pathname, path) : match;
}