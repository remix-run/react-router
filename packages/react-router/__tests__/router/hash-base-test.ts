import type { HashHistory } from "../../lib/router/history";
import { createHashHistory } from "../../lib/router/history";
import getWindow from "../utils/getWindow";

describe("a hash history on a page with a <base> tag", () => {
  let history: HashHistory;
  let base: HTMLBaseElement;
  let testWindow: Window;

  beforeEach(() => {
    // Need to use our own custom DOM in order to get a working history
    testWindow = getWindow("/", true);
    base = testWindow.document.createElement("base");
    base.setAttribute("href", "/prefix");
    testWindow.document.head.appendChild(base);

    history = createHashHistory({ window: testWindow });
  });

  afterEach(() => {
    testWindow.document.head.removeChild(base);
  });

  it("knows how to create hrefs", () => {
    const hashIndex = testWindow.location.href.indexOf("#");
    const upToHash =
      hashIndex === -1
        ? testWindow.location.href
        : testWindow.location.href.slice(0, hashIndex);

    const href = history.createHref({
      pathname: "/the/path",
      search: "?the=query",
      hash: "#the-hash",
    });

    expect(href).toEqual(upToHash + "#/the/path?the=query#the-hash");
  });
});
