
import * as React$1 from "react";
import { RouterProviderProps } from "react-router";

//#region lib/dom-export/dom-router-provider.d.ts
type RouterProviderProps$1 = Omit<RouterProviderProps, "flushSync">;
declare function RouterProvider$1(props: RouterProviderProps$1): React$1.JSX.Element;
//#endregion
export { RouterProvider$1 as RouterProvider, RouterProviderProps$1 as RouterProviderProps };