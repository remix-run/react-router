import React from "react";
import ReactDOM from "react-dom";
import { MemoryRouter, Router, HashRouter, Link } from "react-router-dom";
import { createMemoryHistory } from "history";
import renderStrict from "./utils/renderStrict";
import ReactTestUtils from "react-dom/test-utils";

describe("A <Link>", () => {
  const node = document.createElement("div");

  afterEach(() => {
    ReactDOM.unmountComponentAtNode(node);
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

  it("exposes its ref via an innerRef callbar prop", () => {
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

  describe("with a <HashRouter>", () => {
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

  describe("on click events", () => {
    const memoryHistory = createMemoryHistory();
    memoryHistory.push = jest.fn();

    beforeEach(() => {
      memoryHistory.push.mockReset();
    });

    it("calls onClick eventhandler and history.push", () => {
      const clickHandler = jest.fn();
      const to = "/the/path?the=query#the-hash";

      renderStrict(
        <Router history={memoryHistory}>
          <Link to={to} onClick={clickHandler}>
            link
          </Link>
        </Router>,
        node
      );

      const a = node.querySelector("a");
      ReactTestUtils.Simulate.click(a, {
        defaultPrevented: false,
        button: 0
      });

      expect(clickHandler).toBeCalledTimes(1);
      expect(memoryHistory.push).toBeCalledTimes(1);
      expect(memoryHistory.push).toBeCalledWith(to);
    });

    it("calls onClick eventhandler and history.push with function `to` prop", () => {
      const memoryHistoryFoo = createMemoryHistory({
        initialEntries: ["/foo"]
      });
      memoryHistoryFoo.push = jest.fn();
      const clickHandler = jest.fn();
      let to = null;
      const toFn = location => {
        to = {
          ...location,
          pathname: "hello",
          search: "world"
        };
        return to;
      };

      renderStrict(
        <Router history={memoryHistoryFoo}>
          <Link to={toFn} onClick={clickHandler}>
            link
          </Link>
        </Router>,
        node
      );

      const a = node.querySelector("a");
      ReactTestUtils.Simulate.click(a, {
        defaultPrevented: false,
        button: 0
      });

      expect(clickHandler).toBeCalledTimes(1);
      expect(memoryHistoryFoo.push).toBeCalledTimes(1);
      expect(memoryHistoryFoo.push).toBeCalledWith(to);
    });

    it("does not call history.push on right click", () => {
      const to = "/the/path?the=query#the-hash";

      renderStrict(
        <Router history={memoryHistory}>
          <Link to={to}>link</Link>
        </Router>,
        node
      );

      const a = node.querySelector("a");
      ReactTestUtils.Simulate.click(a, {
        defaultPrevented: false,
        button: 1
      });

      expect(memoryHistory.push).toBeCalledTimes(0);
    });

    it("does not call history.push on prevented event.", () => {
      const to = "/the/path?the=query#the-hash";

      renderStrict(
        <Router history={memoryHistory}>
          <Link to={to}>link</Link>
        </Router>,
        node
      );

      const a = node.querySelector("a");
      ReactTestUtils.Simulate.click(a, {
        defaultPrevented: true,
        button: 0
      });

      expect(memoryHistory.push).toBeCalledTimes(0);
    });

    it("does not call history.push target not specifying 'self'", () => {
      const to = "/the/path?the=query#the-hash";

      renderStrict(
        <Router history={memoryHistory}>
          <Link to={to} target="_blank">
            link
          </Link>
        </Router>,
        node
      );

      const a = node.querySelector("a");
      ReactTestUtils.Simulate.click(a, {
        defaultPrevented: false,
        button: 0
      });

      expect(memoryHistory.push).toBeCalledTimes(0);
    });

    it("prevents the default event handler if an error occurs", () => {
      const memoryHistory = createMemoryHistory();
      memoryHistory.push = jest.fn();
      const error = new Error();
      const clickHandler = () => {
        throw error;
      };
      const mockPreventDefault = jest.fn();
      const to = "/the/path?the=query#the-hash";

      renderStrict(
        <Router history={memoryHistory}>
          <Link to={to} onClick={clickHandler}>
            link
          </Link>
        </Router>,
        node
      );

      console.error = jest.fn(); // keep console clean. Dunno why the catch doesn't do the job correctly.
      try {
        const a = node.querySelector("a");
        ReactTestUtils.Simulate.click(a, {
          defaultPrevented: false,
          preventDefault: mockPreventDefault,
          button: 1
        });
      } catch (e) {
        expect(e).toBe(error);
      }

      console.error.mockRestore();
      expect(clickHandler).toThrow(error);
      expect(mockPreventDefault).toHaveBeenCalled();
      expect(memoryHistory.push).toBeCalledTimes(0);
    });
  });
});
