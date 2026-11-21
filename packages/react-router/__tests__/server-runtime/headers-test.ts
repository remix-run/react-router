/**
 * @jest-environment node
 */

import { getDocumentHeadersImpl } from "../../lib/server-runtime/headers";
import type { StaticHandlerContext } from "../../lib/router/router";

describe("getDocumentHeadersImpl", () => {
  it("uses own-property checks for errors, actionData, and loaderData", () => {
    let errorHeaders = new Headers({ "X-Error": "1" });
    let nullProtoActionData = Object.create(null);
    let nullProtoLoaderData = Object.create(null);

    let context = {
      matches: [
        { route: { id: "toString" } },
        { route: { id: "child" } },
      ],
      errors: { child: new Error("boom") },
      actionHeaders: { child: errorHeaders },
      actionData: nullProtoActionData,
      loaderHeaders: {},
      loaderData: nullProtoLoaderData,
    } as unknown as StaticHandlerContext;

    let headers = getDocumentHeadersImpl(context, (match) => {
      if (match.route.id === "child") {
        return ({ errorHeaders: eh }) => eh || new Headers();
      }
      return undefined;
    });

    expect(headers.get("X-Error")).toBe("1");
  });
});
