
import { RouterState } from "../../router/router.js";

//#region lib/dom/ssr/errors.d.ts
declare function deserializeErrors(errors: RouterState["errors"]): RouterState["errors"];
//#endregion
export { deserializeErrors };