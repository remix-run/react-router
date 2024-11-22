import * as React from "react";
import * as ReactDOM from "react-dom";

import type { RouterProviderProps as BaseRouterProviderProps } from "react-router";
import { RouterProvider as BaseRouterProvider } from "react-router";

export type RouterProviderProps = Omit<BaseRouterProviderProps, "flushSync">;

export function RouterProvider(props: Omit<RouterProviderProps, "flushSync">) {
  return <BaseRouterProvider flushSync={ReactDOM.flushSync} {...props} />;
}
