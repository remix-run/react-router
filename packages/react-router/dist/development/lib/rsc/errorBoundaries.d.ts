
import React from "react";

//#region lib/rsc/errorBoundaries.d.ts
declare function RSCDefaultRootErrorBoundary({
  hasRootLayout
}: {
  hasRootLayout: boolean;
}): React.JSX.Element;
//#endregion
export { RSCDefaultRootErrorBoundary };