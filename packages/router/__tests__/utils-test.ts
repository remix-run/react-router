/**
 * @jest-environment node
 */

import { redirect } from "../index";

describe("utils", () => {
  it("redirects default to 302", async () => {
    let response = redirect("http://test.com");
    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe("http://test.com");
  });

  it("redirects accept a ResponseInit as a number", async () => {
    let response = redirect("http://test.com", 301);
    expect(response.status).toBe(301);
    expect(response.headers.get("Location")).toBe("http://test.com");
  });

  it("redirects accept a ResponseInit as an object", async () => {
    let response = redirect("http://test.com", {
      status: 301,
      statusText: "jawn",
    });
    expect(response.status).toBe(301);
    expect(response.statusText).toBe("jawn");
    expect(response.headers.get("Location")).toBe("http://test.com");
  });

  it("redirects include an HTML body and content length", async () => {
    let response = redirect("http://test.com");
    expect(response.headers.get("Content-Type")).toBe(
      "text/html; charset=UTF-8"
    );
    expect(await response.text()).toBe(
      "<html>" +
        "<head>" +
        '<meta http-equiv="content-type" content="text/html;charset=utf-8">' +
        "<title>302 Moved</title>" +
        "</head>" +
        "<body>" +
        "<h1>302 Moved</h1>" +
        'The document has moved <a href="http://test.com">here</a>.' +
        "</body>" +
        "</html>"
    );
    expect(response.headers.get("Content-Length")).toBe("205");
  });
});
