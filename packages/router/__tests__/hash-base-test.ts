import { JSDOM } from "jsdom";

import type { HashHistory } from "@remix-run/router";
import { createHashHistory } from "@remix-run/router";

describe("a hash history on a page with a <base> tag", () => {
  let history: HashHistory;
  let base: HTMLBaseElement;
  let window: Window;
  let document: Document;

  beforeEach(() => {
    // Need to use our own custom DOM in order to get a working history
    let dom = new JSDOM(`<!DOCTYPE html><p>History Example</p>`, {
      url: "https://example.org/",
    });
    window = dom.window as unknown as Window;
    document = window.document;

    window.history.replaceState(null, "", "#/");

    base = document.createElement("base");
    base.setAttribute("href", "/prefix");
    document.head.appendChild(base);

    history = createHashHistory({ window: dom.window as unknown as Window });
  });

  afterEach(() => {
    document.head.removeChild(base);
  });

  it("knows how to create hrefs", () => {
    const hashIndex = window.location.href.indexOf("#");
    const upToHash =
      hashIndex === -1
        ? window.location.href
        : window.location.href.slice(0, hashIndex);

    const href = history.createHref({
      pathname: "/the/path",
      search: "?the=query",
      hash: "#the-hash",
    });

    expect(href).toEqual(upToHash + "#/the/path?the=query#the-hash");
  });
});
