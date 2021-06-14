import { ServerBuild } from "../build";
import { createRequestHandler } from "../server";

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
