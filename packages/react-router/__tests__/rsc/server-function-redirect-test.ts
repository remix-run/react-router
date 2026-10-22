import {
  matchRSCServerRequest,
  redirect,
  type RSCMatch,
  type RSCRouteConfigEntry,
} from "../../lib/rsc/server.rsc";
import { routeRSCServerRequest } from "../../lib/rsc/server.ssr";

let routes: RSCRouteConfigEntry[] = [
  { id: "root", path: "/", Component: () => null },
];

async function callServerFunction(
  serverFunction: () => unknown,
  requestType: "enhanced" | "form" = "enhanced",
) {
  let match: RSCMatch | undefined;
  let request = new Request("https://remix.run/", {
    method: "POST",
    headers: {
      Origin: "https://remix.run",
      ...(requestType === "enhanced"
        ? { "rsc-action-id": "action-id" }
        : { "Content-Type": "application/x-www-form-urlencoded" }),
    },
    body: requestType === "enhanced" ? "[]" : "$ACTION_ID_action-id=",
  });
  let serverResponse = await matchRSCServerRequest({
    createTemporaryReferenceSet: () => ({}),
    decodeReply: async () => [],
    loadServerAction: async () => serverFunction,
    decodeAction: async () => async () => serverFunction(),
    request,
    routes,
    generateResponse(nextMatch) {
      match = nextMatch;
      return new Response("Encoded Flight", {
        status: nextMatch.statusCode,
        headers: nextMatch.headers,
      });
    },
  });
  let response = await routeRSCServerRequest({
    request,
    serverResponse,
    createFromReadableStream: async () => match?.payload,
    renderHTML() {
      throw new Error("Redirect responses should not render HTML");
    },
  });

  return { response, match };
}

describe("RSC server function redirects", () => {
  test("sends redirect headers once when redirect() is called without throwing", async () => {
    let { response, match } = await callServerFunction(() => {
      redirect("/", { headers: { "Set-Cookie": "a=b" } });
    });
    expect(match?.payload).toMatchObject({ type: "redirect", location: "/" });
    expect(response.headers.getSetCookie()).toEqual(["a=b"]);
  });

  test("sends redirect headers once when the redirect is thrown", async () => {
    let { response, match } = await callServerFunction(() => {
      throw redirect("/", { headers: { "Set-Cookie": "a=b" } });
    });
    expect(match?.payload).toMatchObject({ type: "redirect", location: "/" });
    expect(response.headers.getSetCookie()).toEqual(["a=b"]);
  });

  describe.each(["enhanced", "form"] as const)("%s requests", (requestType) => {
    test("sends headers once when an async server function throws redirect", async () => {
      let { response, match } = await callServerFunction(async () => {
        throw redirect("/target", {
          headers: [
            ["Set-Cookie", "a=b"],
            ["Set-Cookie", "c=d"],
            ["X-Test", "test"],
          ],
        });
      }, requestType);

      expect(match?.payload).toMatchObject({
        type: "redirect",
        location: "/target",
        status: 302,
        reload: false,
        replace: false,
      });
      expect(response.status).toBe(requestType === "enhanced" ? 202 : 302);
      expect(response.headers.getSetCookie()).toEqual(["a=b", "c=d"]);
      expect(response.headers.get("X-Test")).toBe("test");
      expect(response.headers.get("Location")).toBe(
        requestType === "enhanced" ? null : "/target",
      );
    });

    test("preserves headers from an async side-effect redirect", async () => {
      let { response, match } = await callServerFunction(async () => {
        redirect("/target", { headers: { "Set-Cookie": "a=b" } });
      }, requestType);

      expect(match?.payload).toMatchObject({
        type: "redirect",
        location: "/target",
      });
      expect(response.headers.getSetCookie()).toEqual(["a=b"]);
    });

    test("preserves headers from distinct side-effect and thrown redirects", async () => {
      let { response, match } = await callServerFunction(async () => {
        redirect("/side-effect", { headers: { "Set-Cookie": "a=b" } });
        throw new Response(null, {
          status: 302,
          headers: { Location: "/target", "Set-Cookie": "c=d" },
        });
      }, requestType);

      expect(match?.payload).toMatchObject({
        type: "redirect",
        location: "/target",
      });
      expect(response.headers.getSetCookie()).toEqual(["a=b", "c=d"]);
    });
  });
});
