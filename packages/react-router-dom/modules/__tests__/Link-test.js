import React from "react";
import ReactDOM from "react-dom";
import { MemoryRouter, HashRouter, Link } from "react-router-dom";

import renderStrict from "./utils/renderStrict.js";

describe("A <Link>", () => {
  const node = document.createElement("div");

  afterEach(() => {
    ReactDOM.unmountComponentAtNode(node);
  });

  describe("with no `to` prop", () => {
    it("logs an error to the console", () => {
      jest.spyOn(console, "error").mockImplementation(() => {});

      renderStrict(
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

    renderStrict(
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

    renderStrict(
      <MemoryRouter>
        <Link to={to}>link</Link>
      </MemoryRouter>,
      node
    );

    const a = node.querySelector("a");

    expect(a.getAttribute("href")).toEqual("/the/path?the=query#the-hash");
  });

  it("accepts an object returning function `to` prop", () => {
    const to = location => ({ ...location, search: "foo=bar" });

    renderStrict(
      <MemoryRouter initialEntries={["/hello"]}>
        <Link to={to}>link</Link>
      </MemoryRouter>,
      node
    );

    const a = node.querySelector("a");
    expect(a.getAttribute("href")).toEqual("/hello?foo=bar");
  });

  it("accepts a string returning function `to` prop", () => {
    const to = location => `${location.pathname}?foo=bar`;

    ReactDOM.render(
      <MemoryRouter initialEntries={["/hello"]}>
        <Link to={to}>link</Link>
      </MemoryRouter>,
      node
    );

    const a = node.querySelector("a");
    expect(a.getAttribute("href")).toEqual("/hello?foo=bar");
  });

  describe("with no pathname", () => {
    it("resolves using the current location", () => {
      renderStrict(
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

  it("forwards a ref", () => {
    let refNode;
    function refCallback(n) {
      refNode = n;
    }

    renderStrict(
      <MemoryRouter>
        <Link to="/" ref={refCallback}>
          link
        </Link>
      </MemoryRouter>,
      node
    );

    expect(refNode).not.toBe(undefined);
    expect(refNode.tagName).toEqual("A");
  });

  it("exposes its ref via an innerRef callback prop", () => {
    let refNode;
    function refCallback(n) {
      refNode = n;
    }

    renderStrict(
      <MemoryRouter>
        <Link to="/" innerRef={refCallback}>
          link
        </Link>
      </MemoryRouter>,
      node
    );

    expect(refNode).not.toBe(undefined);
    expect(refNode.tagName).toEqual("A");
  });

  it("prefers forwardRef over innerRef", () => {
    let refNode;
    function refCallback(n) {
      refNode = n;
    }

    renderStrict(
      <MemoryRouter>
        <Link
          to="/"
          ref={refCallback}
          innerRef={() => {
            throw new Error("wrong ref, champ");
          }}
        >
          link
        </Link>
      </MemoryRouter>,
      node
    );

    expect(refNode).not.toBe(undefined);
    expect(refNode.tagName).toEqual("A");
  });

  it("uses a custom component prop", () => {
    let linkProps;
    function MyComponent(p) {
      linkProps = p;
      return null;
    }

    renderStrict(
      <MemoryRouter>
        <Link component={MyComponent} to="/">
          link
        </Link>
      </MemoryRouter>,
      node
    );

    expect(linkProps).not.toBe(undefined);
    expect(typeof linkProps.href).toBe("string");
    expect(typeof linkProps.navigate).toBe("function");
  });

  it("exposes its ref via an innerRef RefObject prop", done => {
    const refObject = {
      get current() {
        return null;
      },
      set current(n) {
        if (n) {
          expect(n.tagName).toEqual("A");
          done();
        }
      }
    };

    renderStrict(
      <MemoryRouter>
        <Link to="/" innerRef={refObject}>
          link
        </Link>
      </MemoryRouter>,
      node
    );
  });

  describe("with no <Router>", () => {
    it("throws an error", () => {
      jest.spyOn(console, "error").mockImplementation(() => {});

      expect(() => {
        renderStrict(<Link to="/">link</Link>, node);
      }).toThrow(/You should not use <Link> outside a <Router>/);

      expect(console.error).toHaveBeenCalledTimes(2);
    });
  });

  describe("inside a <HashRouter>", () => {
    afterEach(() => {
      window.history.replaceState(null, "", "#");
    });

    function createLinkNode(hashType, to) {
      renderStrict(
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
