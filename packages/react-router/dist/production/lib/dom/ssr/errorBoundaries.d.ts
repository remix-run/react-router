
import { Location } from "../../router/history.js";
import * as React$1 from "react";

//#region lib/dom/ssr/errorBoundaries.d.ts
type RemixErrorBoundaryProps = React$1.PropsWithChildren<{
  location: Location;
  isOutsideRemixApp?: boolean;
  error?: Error;
}>;
type RemixErrorBoundaryState = {
  error: null | Error;
  location: Location;
};
declare class RemixErrorBoundary extends React$1.Component<RemixErrorBoundaryProps, RemixErrorBoundaryState> {
  constructor(props: RemixErrorBoundaryProps);
  static getDerivedStateFromError(error: Error): {
    error: Error;
  };
  static getDerivedStateFromProps(props: RemixErrorBoundaryProps, state: RemixErrorBoundaryState): {
    error: Error | null;
    location: Location<any>;
  };
  render(): string | number | bigint | boolean | Iterable<React$1.ReactNode> | Promise<string | number | bigint | boolean | React$1.ReactPortal | React$1.ReactElement<unknown, string | React$1.JSXElementConstructor<any>> | Iterable<React$1.ReactNode> | null | undefined> | React$1.JSX.Element | null | undefined;
}
//#endregion
export { RemixErrorBoundary };