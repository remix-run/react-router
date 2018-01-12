import React from "react";
import ReactDOM from "react-dom";
import MemoryRouter from "react-router/MemoryRouter";
import HashRouter from "../HashRouter";
import Link from "../Link";

describe("A <Link>", () => {
  it('accepts a location "to" prop', () => {
    const location = {
      pathname: "/the/path",
      search: "the=query",
      hash: "#the-hash"
    };
    const node = document.createElement("div");

    ReactDOM.render(
      <MemoryRouter>
        <Link to={location}>link</Link>
      </MemoryRouter>,
      node
    );

    const href = node.querySelector("a").getAttribute("href");

    expect(href).toEqual("/the/path?the=query#the-hash");
  });

  describe("to as a string", () => {
    it("resolves to with no pathname using current location", () => {
      const node = document.createElement("div");

      ReactDOM.render(
        <MemoryRouter initialEntries={["/somewhere"]}>
          <Link to="?rendersWithPathname=true">link</Link>
        </MemoryRouter>,
        node
      );

      const href = node.querySelector("a").getAttribute("href");

      expect(href).toEqual("/somewhere?rendersWithPathname=true");
    });
  });

  it("throws with no <Router>", () => {
    const node = document.createElement("div");

    spyOn(console, "error");

    expect(() => {
      ReactDOM.render(<Link to="/">link</Link>, node);
    }).toThrow(/You should not use <Link> outside a <Router>/);

    expect(console.error.calls.count()).toBe(2);
    expect(console.error.calls.argsFor(0)[0]).toContain(
      "The context `router` is marked as required in `Link`"
    );
  });

  it('throws with no "to" prop', () => {
    const node = document.createElement("div");

    spyOn(console, "error");

    expect(() => {
      ReactDOM.render(
        <MemoryRouter>
          <Link>link</Link>
        </MemoryRouter>,
        node
      );
    }).toThrow(/You must specify the "to" property/);

    expect(console.error.calls.count()).toBe(2);
    expect(console.error.calls.argsFor(0)[0]).toContain(
      "The prop `to` is marked as required in `Link`"
    );
  });

  it("exposes its ref via an innerRef prop", done => {
    const node = document.createElement("div");

    const refCallback = n => {
      expect(n.tagName).toEqual("A");
      done();
    };

    ReactDOM.render(
      <MemoryRouter>
        <Link to="/" innerRef={refCallback}>
          link
        </Link>
      </MemoryRouter>,
      node
    );
  });
});

describe("When a <Link> is clicked", () => {
  it("calls its onClick handler");

  it("changes the location");

  describe("and the onClick handler calls event.preventDefault()", () => {
    it("does not change the location");
  });
});

describe("A <Link> underneath a <HashRouter>", () => {
  const node = document.createElement("div");

  afterEach(() => {
    ReactDOM.unmountComponentAtNode(node);
    window.history.replaceState(null, "", "#");
  });

  const createLinkNode = (hashType, to) => {
    ReactDOM.render(
      <HashRouter hashType={hashType}>
        <Link to={to} />
      </HashRouter>,
      node
    );

    return node.querySelector("a");
  };

  describe('with the "slash" hashType', () => {
    it("has the correct href", () => {
      const linkNode = createLinkNode("slash", "/foo");
      expect(linkNode.getAttribute("href")).toEqual("#/foo");
    });

    it("has the correct href with a leading slash if it is missing", () => {
      const linkNode = createLinkNode("slash", "foo");
      expect(linkNode.getAttribute("href")).toEqual("#/foo");
    });
  });

  describe('with the "hashbang" hashType', () => {
    it("has the correct href", () => {
      const linkNode = createLinkNode("hashbang", "/foo");
      expect(linkNode.getAttribute("href")).toEqual("#!/foo");
    });

    it("has the correct href with a leading slash if it is missing", () => {
      const linkNode = createLinkNode("hashbang", "foo");
      expect(linkNode.getAttribute("href")).toEqual("#!/foo");
    });
  });

  describe('with the "noslash" hashType', () => {
    it("has the correct href", () => {
      const linkNode = createLinkNode("noslash", "foo");
      expect(linkNode.getAttribute("href")).toEqual("#foo");
    });

    it("has the correct href and removes the leading slash", () => {
      const linkNode = createLinkNode("noslash", "/foo");
      expect(linkNode.getAttribute("href")).toEqual("#foo");
    });
  });
});
