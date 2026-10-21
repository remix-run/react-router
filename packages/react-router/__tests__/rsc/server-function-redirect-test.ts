import {
  matchRSCServerRequest,
  redirect,
  type RSCRouteConfigEntry,
} from "../../lib/rsc/server.rsc";

let routes: RSCRouteConfigEntry[] = [
  { id: "root", path: "/", Component: () => null },
];

function callServerFunction(serverFunction: () => unknown) {
  let headers: Headers | undefined;
  return matchRSCServerRequest({
    createTemporaryReferenceSet: () => ({}),
    decodeReply: async () => [],
    loadServerAction: async () => serverFunction as any,
    request: new Request("https://remix.run/", {
      method: "POST",
      headers: { "rsc-action-id": "action-id", Origin: "https://remix.run" },
      body: "[]",
    }),
    routes,
    generateResponse(match) {
      headers = match.headers;
      return new Response(null, {
        status: match.statusCode,
        headers: match.headers,
      });
    },
  }).then(() => headers!);
}

describe("RSC server function redirects", () => {
  test("sends redirect headers once when redirect() is called without throwing", async () => {
    let headers = await callServerFunction(() => {
      redirect("/", { headers: { "Set-Cookie": "a=b" } });
    });
    expect(headers.getSetCookie()).toEqual(["a=b"]);
  });

  test("sends redirect headers once when the redirect is thrown", async () => {
    let headers = await callServerFunction(() => {
      throw redirect("/", { headers: { "Set-Cookie": "a=b" } });
    });
    expect(headers.getSetCookie()).toEqual(["a=b"]);
  });
});
