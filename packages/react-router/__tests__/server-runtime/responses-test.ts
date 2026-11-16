/**
 * @jest-environment node
 */

import { redirect, redirectDocument, replace } from "../../lib/router/utils";

describe("json", () => {
  it("sets the Content-Type header", () => {
    let response = Response.json({});
    expect(response.headers.get("Content-Type")).toEqual("application/json");
  });

  it("preserves existing headers, including Content-Type", () => {
    let response = Response.json(
      {},
      {
        headers: {
          "Content-Type": "application/json; charset=iso-8859-1",
          "X-Remix": "is awesome",
        },
      },
    );

    expect(response.headers.get("Content-Type")).toEqual(
      "application/json; charset=iso-8859-1",
    );
    expect(response.headers.get("X-Remix")).toEqual("is awesome");
  });

  it("encodes the response body", async () => {
    let response = Response.json({ hello: "remix" });
    expect(await response.json()).toEqual({ hello: "remix" });
  });

  it("accepts status as a second parameter", () => {
    let response = Response.json({}, { status: 201 });
    expect(response.status).toEqual(201);
  });

  it("infers input type", async () => {
    let response = Response.json({ hello: "remix" });
    let result = await response.json();
    expect(result).toMatchObject({ hello: "remix" });
  });

  it("disallows unserializables", () => {
    // @ts-expect-error
    expect(() => Response.json(124n)).toThrow();
    // @ts-expect-error
    expect(() => Response.json({ field: 124n })).toThrow();
  });
});

describe("redirect", () => {
  it("sets the status to 302 by default", () => {
    let response = redirect("/login");
    expect(response.status).toEqual(302);
  });

  it("sets the status to 302 when only headers are given", () => {
    let response = redirect("/login", {
      headers: {
        "X-Remix": "is awesome",
      },
    });
    expect(response.status).toEqual(302);
  });

  it("sets the Location header", () => {
    let response = redirect("/login");
    expect(response.headers.get("Location")).toEqual("/login");
  });

  it("preserves existing headers, but not Location", () => {
    let response = redirect("/login", {
      headers: {
        Location: "/",
        "X-Remix": "is awesome",
      },
    });

    expect(response.headers.get("Location")).toEqual("/login");
    expect(response.headers.get("X-Remix")).toEqual("is awesome");
  });

  it("accepts status as a second parameter", () => {
    let response = redirect("/profile", 301);
    expect(response.status).toEqual(301);
  });
});

describe.each([
  ["redirect", redirect],
  ["redirectDocument", redirectDocument],
  ["replace", replace],
])("%s init", (_name, redirectResponse) => {
  it("does not change a shared init used by another response", () => {
    let headers = new Headers({ "X-Remix": "is awesome" });
    let init = { headers };
    let response = redirectResponse("/login", init);

    expect(response.status).toEqual(302);
    expect(response.headers.get("Location")).toEqual("/login");
    expect(response.headers.get("X-Remix")).toEqual("is awesome");
    expect(new Response(null, init).status).toEqual(200);
    expect(init).toStrictEqual({ headers });
    expect([...headers]).toEqual([["x-remix", "is awesome"]]);
  });

  it("preserves headers from an init prototype getter", () => {
    class CustomResponseInit {
      get headers() {
        return { "X-Remix": "is awesome" };
      }
    }
    let init = new CustomResponseInit();
    let response = redirectResponse("/login", init);

    expect(response.status).toEqual(302);
    expect(response.headers.get("Location")).toEqual("/login");
    expect(response.headers.get("X-Remix")).toEqual("is awesome");
    expect(Object.keys(init)).toEqual([]);
  });

  it.each([undefined, 307])(
    "accepts a frozen init with status %s",
    (status) => {
      let init = Object.freeze({
        status,
        statusText: "Custom status",
        headers: { "X-Remix": "is awesome" },
      });
      let response = redirectResponse("/login", init);

      expect(response.status).toEqual(status ?? 302);
      expect(response.statusText).toEqual("Custom status");
      expect(response.headers.get("Location")).toEqual("/login");
      expect(response.headers.get("X-Remix")).toEqual("is awesome");
      expect(init.status).toEqual(status);
    },
  );
});
