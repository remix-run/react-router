import * as React from "react";
import * as ReactDOM from "react-dom";

import {
  RouterProvider as BaseRouterProvider,
  type RouterProviderProps as BaseRouterProviderProps,
} from "../../index";

export { HydratedRouter } from "./hydrated-router";

export type RouterProviderProps = Omit<BaseRouterProviderProps, "flushSync">;

export function RouterProvider(props: Omit<RouterProviderProps, "flushSync">) {
  return <BaseRouterProvider flushSync={ReactDOM.flushSync} {...props} />;
}
