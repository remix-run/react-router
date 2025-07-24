import * as React from "react";
import * as ReactDOM from "react-dom";

import type { RouterProviderProps as BaseRouterProviderProps } from "react-router";
import { RouterProvider as BaseRouterProvider } from "react-router";

// FIXME: We now have two `RouterProviderProps` type, one in `react-router` and
//  one in `react-router/dom`.
export type RouterProviderProps = Omit<BaseRouterProviderProps, "flushSync">;

// FIXME: We now have two `RouterProvider` components, one in `react-router` and
//  one in `react-router/dom`.
export function RouterProvider(props: Omit<RouterProviderProps, "flushSync">) {
  return <BaseRouterProvider flushSync={ReactDOM.flushSync} {...props} />;
}
