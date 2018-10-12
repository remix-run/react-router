import React from "react";
import ReactDOM from "react-dom";

import { MemoryRouter, HashRouter, Link } from "react-router-dom";

describe("A <Link>", () => {
  const node = document.createElement("div");

  afterEach(() => {
    ReactDOM.unmountComponentAtNode(node);
  });

  describe("with no <Router>", () => {
    it("throws an error", () => {
      spyOn(console, "error");

      expect(() => {
        ReactDOM.render(<Link to="/">link</Link>, node);
      }).toThrow(/You should not use <Link> outside a <Router>/);

      expect(console.error.calls.count()).toBe(2);
    });
  });

  describe("with no `to` prop", () => {
    it("logs an error to the console", () => {
      spyOn(console, "error");

      ReactDOM.render(
        <MemoryRouter>
          <Link>link</Link>
        </MemoryRouter>,
        node
      );

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining("The prop `to` is marked as required in `Link`")
      );
    });
  });

  it("accepts a string `to` prop", () => {
    const to = "/the/path?the=query#the-hash";

    ReactDOM.render(
      <MemoryRouter>
        <Link to={to}>link</Link>
      </MemoryRouter>,
      node
    );

    const a = node.querySelector("a");

    expect(a.getAttribute("href")).toEqual("/the/path?the=query#the-hash");
  });

  it("accepts an object `to` prop", () => {
    const to = {
      pathname: "/the/path",
      search: "the=query",
      hash: "#the-hash"
    };

    ReactDOM.render(
      <MemoryRouter>
        <Link to={to}>link</Link>
      </MemoryRouter>,
      node
    );

    const a = node.querySelector("a");

    expect(a.getAttribute("href")).toEqual("/the/path?the=query#the-hash");
  });

  describe("with no pathname", () => {
    it("resolves using the current location", () => {
      ReactDOM.render(
        <MemoryRouter initialEntries={["/somewhere"]}>
          <Link to="?rendersWithPathname=true">link</Link>
        </MemoryRouter>,
        node
      );

      const a = node.querySelector("a");

      expect(a.getAttribute("href")).toEqual(
        "/somewhere?rendersWithPathname=true"
      );
    });
  });

  it("exposes its ref via an innerRef prop", done => {
    function refCallback(n) {
      if (n) {
        expect(n.tagName).toEqual("A");
        done();
      }
    }

    ReactDOM.render(
      <MemoryRouter>
        <Link to="/" innerRef={refCallback}>
          link
        </Link>
      </MemoryRouter>,
      node
    );
  });

  describe("with a <HashRouter>", () => {
    afterEach(() => {
      window.history.replaceState(null, "", "#");
    });

    function createLinkNode(hashType, to) {
      ReactDOM.render(
        <HashRouter hashType={hashType}>
          <Link to={to} />
        </HashRouter>,
        node
      );

      return node.querySelector("a");
    }

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
});
