/**
 * @jest-environment node
 */

import { redirect } from "../../lib/router/utils";

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
      }
    );

    expect(response.headers.get("Content-Type")).toEqual(
      "application/json; charset=iso-8859-1"
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

  it("handles Unicode characters in URLs", () => {
    let response = redirect("/こんにちは");
    expect(response.headers.get("Location")).toEqual("/%E3%81%93%E3%82%93%E3%81%AB%E3%81%A1%E3%81%AF");
    expect(response.status).toEqual(302);
  });

  it("handles Unicode characters with emoji in URLs", () => {
    let response = redirect("/hello/🌟");
    expect(response.headers.get("Location")).toEqual("/hello/%F0%9F%8C%9F");
    expect(response.status).toEqual(302);
  });
});
