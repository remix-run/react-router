import { ServerBuild } from "../build";
import { createRequestHandler } from "../server";

describe("actions", () => {
  it("returns a redirect when actions return a string", async () => {
    let location = "/just/a/string";
    let action = async () => location;

    let routeId = "routes/random";
    let build = ({
      routes: {
        [routeId]: {
          id: routeId,
          path: "/random",
          module: { action }
        }
      }
    } as unknown) as ServerBuild;

    let handler = createRequestHandler(build);

    let request = new Request("http://example.com/random", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      }
    });

    let res = await handler(request);
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toBe(location);
  });
});

describe("loaders", () => {
  // so that HTML/Fetch requests are the same, and so redirects don't hang on to
  // this param for no reason
  it("removes _data from request.url", async () => {
    let loader = async ({ request }) => {
      return new URL(request.url).search;
    };

    let routeId = "routes/random";
    let build = ({
      routes: {
        [routeId]: {
          id: routeId,
          path: "/random",
          module: {
            loader
          }
        }
      }
    } as unknown) as ServerBuild;

    let handler = createRequestHandler(build);

    let request = new Request(
      "http://example.com/random?_data=routes/random&foo=bar",
      {
        headers: {
          "Content-Type": "application/json"
        }
      }
    );

    let res = await handler(request);
    expect(await res.json()).toMatchInlineSnapshot(`"?foo=bar"`);
  });
});
