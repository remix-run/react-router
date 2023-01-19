/* eslint-disable jest/expect-expect */

import { JSDOM } from "jsdom";
import * as React from "react";
import {
  cleanup,
  render,
  fireEvent,
  waitFor,
  screen,
} from "@testing-library/react";
import type { Location, Params } from "react-router-dom";
import {
  BrowserRouter,
  HashRouter,
  MemoryRouter,
  Link,
  Routes,
  Route,
  RouterProvider,
  createBrowserRouter,
  createHashRouter,
  createMemoryRouter,
  createRoutesFromElements,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";

/**
 * Here's all the special characters we want to test against.  This list was
 * generated using the following utility in the Chrome DevTools console for
 * maximum accuracy.  This is instead of programmatically generating during
 * these tests where JSDOM or a bad URL polyfill might not be trustworthy.
 *
 * function generateCharDef(char) {
 *   return {
 *       char,
 *       pathChar: new URL('/' + char, window.location.origin).pathname.replace(/^\//, ''),
 *       searchChar: new URL('/?=' + char, window.location.origin).search.replace(/^\?=/, ''),
 *       hashChar: new URL('/#' + char, window.location.origin).hash.replace(/^#/, ''),
 *   };
 * }
 */

let specialChars = [
  // This set of characters never gets encoded by window.location
  { char: "x", pathChar: "x", searchChar: "x", hashChar: "x" },
  { char: "X", pathChar: "X", searchChar: "X", hashChar: "X" },
  { char: "~", pathChar: "~", searchChar: "~", hashChar: "~" },
  { char: "!", pathChar: "!", searchChar: "!", hashChar: "!" },
  { char: "@", pathChar: "@", searchChar: "@", hashChar: "@" },
  { char: "$", pathChar: "$", searchChar: "$", hashChar: "$" },
  { char: "*", pathChar: "*", searchChar: "*", hashChar: "*" },
  { char: "(", pathChar: "(", searchChar: "(", hashChar: "(" },
  { char: ")", pathChar: ")", searchChar: ")", hashChar: ")" },
  { char: "_", pathChar: "_", searchChar: "_", hashChar: "_" },
  { char: "-", pathChar: "-", searchChar: "-", hashChar: "-" },
  { char: "+", pathChar: "+", searchChar: "+", hashChar: "+" },
  { char: "=", pathChar: "=", searchChar: "=", hashChar: "=" },
  { char: "[", pathChar: "[", searchChar: "[", hashChar: "[" },
  { char: "]", pathChar: "]", searchChar: "]", hashChar: "]" },
  { char: ":", pathChar: ":", searchChar: ":", hashChar: ":" },
  { char: ";", pathChar: ";", searchChar: ";", hashChar: ";" },
  { char: ",", pathChar: ",", searchChar: ",", hashChar: "," },

  // These chars should only get encoded when in the pathname, but JSDOM
  // seems to have a bug as it does not encode them, so don't test this
  // case for now
  // { char: "^", pathChar: "%5E", searchChar: "^", hashChar: "^" },
  // { char: "|", pathChar: "%7C", searchChar: "|", hashChar: "|" },

  // These chars get conditionally encoded based on what portion of the
  // URL they occur in
  { char: "{", pathChar: "%7B", searchChar: "{", hashChar: "{" },
  { char: "}", pathChar: "%7D", searchChar: "}", hashChar: "}" },
  { char: "`", pathChar: "%60", searchChar: "`", hashChar: "%60" },
  { char: "'", pathChar: "'", searchChar: "%27", hashChar: "'" },
  { char: '"', pathChar: "%22", searchChar: "%22", hashChar: "%22" },
  { char: "<", pathChar: "%3C", searchChar: "%3C", hashChar: "%3C" },
  { char: ">", pathChar: "%3E", searchChar: "%3E", hashChar: "%3E" },

  // These chars get encoded in all portions of the URL
  {
    char: "🤯",
    pathChar: "%F0%9F%A4%AF",
    searchChar: "%F0%9F%A4%AF",
    hashChar: "%F0%9F%A4%AF",
  },
  {
    char: "✅",
    pathChar: "%E2%9C%85",
    searchChar: "%E2%9C%85",
    hashChar: "%E2%9C%85",
  },
  {
    char: "🔥",
    pathChar: "%F0%9F%94%A5",
    searchChar: "%F0%9F%94%A5",
    hashChar: "%F0%9F%94%A5",
  },
  { char: "ä", pathChar: "%C3%A4", searchChar: "%C3%A4", hashChar: "%C3%A4" },
  { char: "Ä", pathChar: "%C3%84", searchChar: "%C3%84", hashChar: "%C3%84" },
  { char: "ø", pathChar: "%C3%B8", searchChar: "%C3%B8", hashChar: "%C3%B8" },
  {
    char: "山",
    pathChar: "%E5%B1%B1",
    searchChar: "%E5%B1%B1",
    hashChar: "%E5%B1%B1",
  },
  {
    char: "人",
    pathChar: "%E4%BA%BA",
    searchChar: "%E4%BA%BA",
    hashChar: "%E4%BA%BA",
  },
  {
    char: "口",
    pathChar: "%E5%8F%A3",
    searchChar: "%E5%8F%A3",
    hashChar: "%E5%8F%A3",
  },
  {
    char: "刀",
    pathChar: "%E5%88%80",
    searchChar: "%E5%88%80",
    hashChar: "%E5%88%80",
  },
  {
    char: "木",
    pathChar: "%E6%9C%A8",
    searchChar: "%E6%9C%A8",
    hashChar: "%E6%9C%A8",
  },

  // Add a few multi-char space use cases for good measure
  { char: "a b", pathChar: "a%20b", searchChar: "a%20b", hashChar: "a%20b" },
  { char: "a+b", pathChar: "a+b", searchChar: "a+b", hashChar: "a+b" },
];

describe("special character tests", () => {
  // Mutable vars we'll use to capture the useLocation/useParams values during
  // the render pass.  this avoids stringifying them into the DOM and parsing
  // them back out which can mess with the encoding
  let renderedUseLocation: Omit<Location, "state" | "key"> | null = null;
  let renderedParams: Params<string> | null = null;

  function CaptureLocation() {
    let location = {
      ...useLocation(),
      state: undefined,
      key: undefined,
    };
    let params = useParams();
    renderedUseLocation = {
      pathname: location.pathname,
      search: location.search,
      hash: location.hash,
    };
    renderedParams = params;
    return (
      <>
        <p>{location.pathname}</p>
        <Link to="/reset">Link to reset</Link>
      </>
    );
  }

  beforeEach(() => {
    renderedUseLocation = null;
    renderedParams = null;
  });

  describe("when matching as param values", () => {
    async function testParamValues(
      navigatePath: string,
      expectedHeading: string,
      expectedLocation: Omit<Location, "state" | "key">,
      expectedParams = {}
    ) {
      // Need to use our own custom DOM in order to get a working history
      const dom = new JSDOM(`<!DOCTYPE html><html><body></body></html>`, {
        url: "https://remix.run/",
      });
      let testWindow = dom.window as unknown as Window;
      testWindow.history.replaceState(null, "", navigatePath);

      function Comp({ heading }) {
        return (
          <>
            <h1>{heading}</h1>
            <CaptureLocation></CaptureLocation>
          </>
        );
      }

      let routeElements = (
        <>
          <Route path="/path" element={<Comp heading="Static Route" />} />
          <Route
            path="/inline-param/:slug"
            element={<Comp heading="Inline Nested Param Route" />}
          />
          <Route path="/param">
            <Route
              path=":slug"
              element={<Comp heading="Parent Nested Param Route" />}
            />
          </Route>
          <Route
            path="/inline-splat/*"
            element={<Comp heading="Inline Nested Splat Route" />}
          />
          <Route path="/splat">
            <Route
              path="*"
              element={<Comp heading="Parent Nested Splat Route" />}
            />
          </Route>
          <Route
            path="/reset"
            element={<Link to={navigatePath}>Link to path</Link>}
          />
          <Route
            path="/descendant/:param/*"
            element={
              <Routes>
                <Route
                  path="match"
                  element={<Comp heading="Descendant Route" />}
                />
              </Routes>
            }
          />
          <Route path="/*" element={<Comp heading="Root Splat Route" />} />
        </>
      );

      // Render BrowserRouter at the initialized location and confirm we get
      // the right route match, window.location, useLocation(), and useParams()
      // values
      let ctx = render(
        <BrowserRouter window={testWindow}>
          <Routes>{routeElements}</Routes>
        </BrowserRouter>
      );

      expect(ctx.container.querySelector("h1")?.innerHTML).toBe(
        expectedHeading
      );

      let windowLocation = {
        pathname: testWindow.location.pathname,
        search: testWindow.location.search,
        hash: testWindow.location.hash,
      };
      expect(windowLocation).toEqual(expectedLocation);
      expect(renderedUseLocation).toEqual(expectedLocation);
      expect(renderedParams).toEqual(expectedParams);

      // Now client side away to a /reset route and back to the original path to confirm that
      // client-side history.push calls also match the same expectations
      await fireEvent.click(screen.getByText("Link to reset"));
      await waitFor(() => screen.getByText(/Link to path/));
      await fireEvent.click(screen.getByText("Link to path"));
      await waitFor(() => screen.getByText(/Link to reset/));

      expect(ctx.container.querySelector("h1")?.innerHTML).toBe(
        expectedHeading
      );

      windowLocation = {
        pathname: testWindow.location.pathname,
        search: testWindow.location.search,
        hash: testWindow.location.hash,
      };
      expect(windowLocation).toEqual(expectedLocation);
      expect(renderedUseLocation).toEqual(expectedLocation);
      expect(renderedParams).toEqual(expectedParams);

      // Reset state
      ctx.unmount();
      cleanup();
      renderedUseLocation = null;
      renderedParams = null;

      // Now run the same initialized-location render through a data router
      // and confirm all the same assertions
      let routes = createRoutesFromElements(routeElements);
      let router = createBrowserRouter(routes, { window: testWindow });
      ctx = render(<RouterProvider router={router} />);

      expect(ctx.container.querySelector("h1")?.innerHTML).toBe(
        expectedHeading
      );

      windowLocation = {
        pathname: testWindow.location.pathname,
        search: testWindow.location.search,
        hash: testWindow.location.hash,
      };
      // Assert both window.location and useLocation() match what we expect
      expect(windowLocation).toEqual(expectedLocation);
      expect(renderedUseLocation).toEqual(expectedLocation);
      expect(renderedParams).toEqual(expectedParams);

      // Now client side away to a /reset route and back to the original path to confirm that
      // client-side router.navigate calls also match the same expectations
      await fireEvent.click(screen.getByText("Link to reset"));
      await waitFor(() => screen.getByText(/Link to path/));
      await fireEvent.click(screen.getByText("Link to path"));
      await waitFor(() => screen.getByText(/Link to reset/));

      expect(ctx.container.querySelector("h1")!.innerHTML).toBe(
        expectedHeading
      );

      windowLocation = {
        pathname: testWindow.location.pathname,
        search: testWindow.location.search,
        hash: testWindow.location.hash,
      };
      // Assert both window.location and useLocation() match what we expect
      expect(windowLocation).toEqual(expectedLocation);
      expect(renderedUseLocation).toEqual(expectedLocation);
      expect(renderedParams).toEqual(expectedParams);

      ctx.unmount();
      cleanup();
      renderedUseLocation = null;
      renderedParams = null;
    }

    it("handles special chars in inline nested param route paths", async () => {
      for (let charDef of specialChars) {
        let { char, pathChar } = charDef;
        await testParamValues(
          `/inline-param/${char}`,
          "Inline Nested Param Route",
          {
            pathname: `/inline-param/${pathChar}`,
            search: "",
            hash: "",
          },
          { slug: char }
        );

        await testParamValues(
          `/inline-param/foo${char}bar`,
          "Inline Nested Param Route",
          {
            pathname: `/inline-param/foo${pathChar}bar`,
            search: "",
            hash: "",
          },
          { slug: `foo${char}bar` }
        );
      }
    });

    it("handles special chars in parent nested param route paths", async () => {
      for (let charDef of specialChars) {
        let { char, pathChar } = charDef;
        await testParamValues(
          `/param/${char}`,
          "Parent Nested Param Route",
          {
            pathname: `/param/${pathChar}`,
            search: "",
            hash: "",
          },
          { slug: char }
        );

        await testParamValues(
          `/param/foo${char}bar`,
          "Parent Nested Param Route",
          {
            pathname: `/param/foo${pathChar}bar`,
            search: "",
            hash: "",
          },
          { slug: `foo${char}bar` }
        );
      }
    });

    it("handles special chars in inline nested splat routes", async () => {
      for (let charDef of specialChars) {
        let { char, pathChar } = charDef;
        await testParamValues(
          `/inline-splat/${char}`,
          "Inline Nested Splat Route",
          {
            pathname: `/inline-splat/${pathChar}`,
            search: "",
            hash: "",
          },
          { "*": char }
        );

        await testParamValues(
          `/inline-splat/foo${char}bar`,
          "Inline Nested Splat Route",
          {
            pathname: `/inline-splat/foo${pathChar}bar`,
            search: "",
            hash: "",
          },
          { "*": `foo${char}bar` }
        );
      }
    });

    it("handles special chars in nested splat routes", async () => {
      for (let charDef of specialChars) {
        let { char, pathChar } = charDef;
        await testParamValues(
          `/splat/${char}`,
          "Parent Nested Splat Route",
          {
            pathname: `/splat/${pathChar}`,
            search: "",
            hash: "",
          },
          { "*": char }
        );

        await testParamValues(
          `/splat/foo${char}bar`,
          "Parent Nested Splat Route",
          {
            pathname: `/splat/foo${pathChar}bar`,
            search: "",
            hash: "",
          },
          { "*": `foo${char}bar` }
        );
      }
    });

    it("handles special chars in nested splat routes with separators", async () => {
      for (let charDef of specialChars) {
        let { char, pathChar } = charDef;
        await testParamValues(
          `/splat/foo/bar${char}`,
          "Parent Nested Splat Route",
          {
            pathname: `/splat/foo/bar${pathChar}`,
            search: "",
            hash: "",
          },
          { "*": `foo/bar${char}` }
        );
      }
    });

    it("handles special chars in root splat routes", async () => {
      for (let charDef of specialChars) {
        let { char, pathChar } = charDef;
        await testParamValues(
          `/${char}`,
          "Root Splat Route",
          {
            pathname: `/${pathChar}`,
            search: "",
            hash: "",
          },
          { "*": char }
        );

        await testParamValues(
          `/foo${char}bar`,
          "Root Splat Route",
          {
            pathname: `/foo${pathChar}bar`,
            search: "",
            hash: "",
          },
          { "*": `foo${char}bar` }
        );
      }
    });

    it("handles special chars in root splat routes with separators", async () => {
      for (let charDef of specialChars) {
        let { char, pathChar } = charDef;
        await testParamValues(
          `/foo/bar${char}`,
          "Root Splat Route",
          {
            pathname: `/foo/bar${pathChar}`,
            search: "",
            hash: "",
          },
          { "*": `foo/bar${char}` }
        );
      }
    });

    it("handles special chars in descendant routes paths", async () => {
      for (let charDef of specialChars) {
        let { char, pathChar } = charDef;

        await testParamValues(
          `/descendant/${char}/match`,
          "Descendant Route",
          {
            pathname: `/descendant/${pathChar}/match`,
            search: "",
            hash: "",
          },
          { param: char, "*": "match" }
        );

        await testParamValues(
          `/descendant/foo${char}bar/match`,
          "Descendant Route",
          {
            pathname: `/descendant/foo${pathChar}bar/match`,
            search: "",
            hash: "",
          },
          { param: `foo${char}bar`, "*": "match" }
        );
      }
    });

    it("handles special chars in search params", async () => {
      for (let charDef of specialChars) {
        let { char, searchChar } = charDef;
        await testParamValues(`/path?key=${char}`, "Static Route", {
          pathname: `/path`,
          search: `?key=${searchChar}`,
          hash: "",
        });
      }
    });

    it("handles special chars in hash values", async () => {
      for (let charDef of specialChars) {
        let { char, hashChar } = charDef;
        await testParamValues(`/path#hash-${char}`, "Static Route", {
          pathname: `/path`,
          search: "",
          hash: `#hash-${hashChar}`,
        });
      }
    });
  });

  describe("when matching as part of the defined route path", () => {
    async function assertRouteMatch(
      char,
      path: string,
      expectedHeading: string,
      expectedLocation: Omit<Location, "state" | "key">,
      expectedParams = {}
    ) {
      // Need to use our own custom DOM in order to get a working history
      const dom = new JSDOM(`<!DOCTYPE html><html><body></body></html>`, {
        url: "https://remix.run/",
      });
      let testWindow = dom.window as unknown as Window;
      testWindow.history.replaceState(null, "", path);

      let renderedUseLocation: Omit<Location, "state" | "key"> | null = null;
      let renderedParams: Params<string> | null = null;

      function CaptureLocation() {
        let location = {
          ...useLocation(),
          state: undefined,
          key: undefined,
        };
        let params = useParams();
        renderedUseLocation = location;
        renderedParams = params;
        return (
          <>
            <p>{location.pathname}</p>
            <Link to="/reset">Link to reset</Link>
          </>
        );
      }

      function Root() {
        return (
          <>
            <h1>Matched Root</h1>
            <CaptureLocation />
          </>
        );
      }

      function StaticNested() {
        return (
          <>
            <h1>Matched Static Nested</h1>
            <CaptureLocation />
          </>
        );
      }

      function ParamNested() {
        return (
          <>
            <h1>Matched Param Nested</h1>
            <CaptureLocation />
          </>
        );
      }

      let routeElements = (
        <>
          <Route path={`/${char}`} element={<Root />} />
          <Route path="/nested">
            <Route path={char} element={<StaticNested />} />
          </Route>
          <Route path="/:param">
            <Route path={char} element={<ParamNested />} />
          </Route>
          <Route path="/reset" element={<Link to={path}>Link to path</Link>} />
          <Route path="*" element={<h1>Not Found</h1>} />
        </>
      );

      // Render BrowserRouter at the initialized location and confirm we get
      // the right route match, window.location, useLocation(), and useParams()
      // values
      let ctx = render(
        <BrowserRouter window={testWindow}>
          <Routes>{routeElements}</Routes>
        </BrowserRouter>
      );

      expect(ctx.container.querySelector("h1")!.innerHTML).toBe(
        expectedHeading
      );
      let windowLocation = {
        pathname: testWindow.location.pathname,
        search: testWindow.location.search,
        hash: testWindow.location.hash,
      };
      expect(windowLocation).toEqual(expectedLocation);
      expect(renderedUseLocation).toEqual(expectedLocation);
      expect(renderedParams).toEqual(expectedParams);

      // Reset state
      ctx.unmount();
      cleanup();
      renderedUseLocation = null;
      renderedParams = null;

      // Now run the same initialized-location render through a data router
      // and confirm all the same assertions
      let routes = createRoutesFromElements(routeElements);
      let router = createBrowserRouter(routes, { window: testWindow });
      ctx = render(<RouterProvider router={router} />);

      expect(ctx.container.querySelector("h1")!.innerHTML).toBe(
        expectedHeading
      );
      windowLocation = {
        pathname: testWindow.location.pathname,
        search: testWindow.location.search,
        hash: testWindow.location.hash,
      };
      expect(windowLocation).toEqual(expectedLocation);
      expect(renderedUseLocation).toEqual(expectedLocation);
      expect(renderedParams).toEqual(expectedParams);

      // Now client side away to a /reset route and back to the original path to confirm that
      // client-side router.navigate calls also match the same expectations
      await fireEvent.click(screen.getByText("Link to reset"));
      await waitFor(() => screen.getByText(/Link to path/));
      await fireEvent.click(screen.getByText("Link to path"));
      await waitFor(() => screen.getByText(/Link to reset/));

      expect(ctx.container.querySelector("h1")!.innerHTML).toBe(
        expectedHeading
      );
      windowLocation = {
        pathname: testWindow.location.pathname,
        search: testWindow.location.search,
        hash: testWindow.location.hash,
      };
      expect(windowLocation).toEqual(expectedLocation);
      expect(renderedUseLocation).toEqual(expectedLocation);
      expect(renderedParams).toEqual(expectedParams);

      ctx.unmount();
      cleanup();
      renderedUseLocation = null;
      renderedParams = null;
    }

    it("handles special chars in root route paths", async () => {
      for (let charDef of specialChars) {
        let { char, pathChar } = charDef;
        // Skip * which is just a splat route
        if (char === "*") {
          continue;
        }
        await assertRouteMatch(char, `/${char}`, "Matched Root", {
          pathname: `/${pathChar}`,
          search: "",
          hash: "",
        });
      }
    });

    it("handles special chars in static nested route paths", async () => {
      for (let charDef of specialChars) {
        let { char, pathChar } = charDef;
        // Skip * which is just a splat route
        if (char === "*") {
          continue;
        }
        await assertRouteMatch(
          char,
          `/nested/${char}`,
          "Matched Static Nested",
          {
            pathname: `/nested/${pathChar}`,
            search: "",
            hash: "",
          }
        );
      }
    });

    it("handles special chars in nested param route paths", async () => {
      for (let charDef of specialChars) {
        let { char, pathChar } = charDef;
        // Skip * which is just a splat route
        if (char === "*") {
          continue;
        }
        await assertRouteMatch(
          char,
          `/foo/${char}`,
          "Matched Param Nested",
          {
            pathname: `/foo/${pathChar}`,
            search: "",
            hash: "",
          },
          {
            param: "foo",
          }
        );
      }
    });
  });

  describe("encodes characters based on history implementation", () => {
    function ShowPath() {
      let { pathname, search, hash } = useLocation();
      return <pre>{JSON.stringify({ pathname, search, hash })}</pre>;
    }

    describe("memory routers", () => {
      it("does not encode characters in MemoryRouter", () => {
        let ctx = render(
          <MemoryRouter initialEntries={["/with space"]}>
            <Routes>
              <Route path="/with space" element={<ShowPath />} />
            </Routes>
          </MemoryRouter>
        );

        expect(ctx.container.innerHTML).toMatchInlineSnapshot(
          `"<pre>{"pathname":"/with space","search":"","hash":""}</pre>"`
        );
      });

      it("does not encode characters in MemoryRouter (navigate)", () => {
        function Start() {
          let navigate = useNavigate();
          // eslint-disable-next-line react-hooks/exhaustive-deps
          React.useEffect(() => navigate("/with space"), []);
          return null;
        }
        let ctx = render(
          <MemoryRouter>
            <Routes>
              <Route path="/" element={<Start />} />
              <Route path="/with space" element={<ShowPath />} />
            </Routes>
          </MemoryRouter>
        );

        expect(ctx.container.innerHTML).toMatchInlineSnapshot(
          `"<pre>{"pathname":"/with space","search":"","hash":""}</pre>"`
        );
      });

      it("does not encode characters in createMemoryRouter", () => {
        let router = createMemoryRouter(
          [{ path: "/with space", element: <ShowPath /> }],
          { initialEntries: ["/with space"] }
        );
        let ctx = render(<RouterProvider router={router} />);

        expect(ctx.container.innerHTML).toMatchInlineSnapshot(
          `"<pre>{"pathname":"/with space","search":"","hash":""}</pre>"`
        );
      });

      it("does not encode characters in createMemoryRouter (navigate)", () => {
        function Start() {
          let navigate = useNavigate();
          // eslint-disable-next-line react-hooks/exhaustive-deps
          React.useEffect(() => navigate("/with space"), []);
          return null;
        }
        let router = createMemoryRouter([
          { path: "/", element: <Start /> },
          { path: "/with space", element: <ShowPath /> },
        ]);
        let ctx = render(<RouterProvider router={router} />);

        expect(ctx.container.innerHTML).toMatchInlineSnapshot(
          `"<pre>{"pathname":"/with space","search":"","hash":""}</pre>"`
        );
      });
    });

    describe("browser routers", () => {
      let testWindow: Window;

      beforeEach(() => {
        // Need to use our own custom DOM in order to get a working history
        const dom = new JSDOM(`<!DOCTYPE html><html><body></body></html>`, {
          url: "https://remix.run/",
        });
        testWindow = dom.window as unknown as Window;
        testWindow.history.pushState({}, "", "/");
      });

      it("encodes characters in BrowserRouter", () => {
        testWindow.history.replaceState(null, "", "/with space");

        let ctx = render(
          <BrowserRouter window={testWindow}>
            <Routes>
              <Route path="/with space" element={<ShowPath />} />
            </Routes>
          </BrowserRouter>
        );

        expect(testWindow.location.pathname).toBe("/with%20space");
        expect(ctx.container.innerHTML).toMatchInlineSnapshot(
          `"<pre>{"pathname":"/with%20space","search":"","hash":""}</pre>"`
        );
      });

      it("encodes characters in BrowserRouter (navigate)", () => {
        testWindow.history.replaceState(null, "", "/");

        function Start() {
          let navigate = useNavigate();
          // eslint-disable-next-line react-hooks/exhaustive-deps
          React.useEffect(() => navigate("/with space"), []);
          return null;
        }

        let ctx = render(
          <BrowserRouter window={testWindow}>
            <Routes>
              <Route path="/" element={<Start />} />
              <Route path="/with space" element={<ShowPath />} />
            </Routes>
          </BrowserRouter>
        );

        expect(testWindow.location.pathname).toBe("/with%20space");
        expect(ctx.container.innerHTML).toMatchInlineSnapshot(
          `"<pre>{"pathname":"/with%20space","search":"","hash":""}</pre>"`
        );
      });

      it("encodes characters in createBrowserRouter", () => {
        testWindow.history.replaceState(null, "", "/with space");

        let router = createBrowserRouter(
          [{ path: "/with space", element: <ShowPath /> }],
          { window: testWindow }
        );
        let ctx = render(<RouterProvider router={router} />);

        expect(testWindow.location.pathname).toBe("/with%20space");
        expect(ctx.container.innerHTML).toMatchInlineSnapshot(
          `"<pre>{"pathname":"/with%20space","search":"","hash":""}</pre>"`
        );
      });

      it("encodes characters in createBrowserRouter (navigate)", () => {
        testWindow.history.replaceState(null, "", "/with space");

        function Start() {
          let navigate = useNavigate();
          // eslint-disable-next-line react-hooks/exhaustive-deps
          React.useEffect(() => navigate("/with space"), []);
          return null;
        }

        let router = createBrowserRouter(
          [
            { path: "/", element: <Start /> },
            { path: "/with space", element: <ShowPath /> },
          ],
          { window: testWindow }
        );
        let ctx = render(<RouterProvider router={router} />);

        expect(testWindow.location.pathname).toBe("/with%20space");
        expect(ctx.container.innerHTML).toMatchInlineSnapshot(
          `"<pre>{"pathname":"/with%20space","search":"","hash":""}</pre>"`
        );
      });
    });

    describe("hash routers", () => {
      let testWindow: Window;

      beforeEach(() => {
        // Need to use our own custom DOM in order to get a working history
        const dom = new JSDOM(`<!DOCTYPE html><html><body></body></html>`, {
          url: "https://remix.run/",
        });
        testWindow = dom.window as unknown as Window;
        testWindow.history.pushState({}, "", "/");
      });

      it("encodes characters in HashRouter", () => {
        testWindow.history.replaceState(null, "", "/#/with space");

        let ctx = render(
          <HashRouter window={testWindow}>
            <Routes>
              <Route path="/with space" element={<ShowPath />} />
            </Routes>
          </HashRouter>
        );

        expect(testWindow.location.pathname).toBe("/");
        expect(testWindow.location.hash).toBe("#/with%20space");
        expect(ctx.container.innerHTML).toMatchInlineSnapshot(
          `"<pre>{"pathname":"/with%20space","search":"","hash":""}</pre>"`
        );
      });

      it("encodes characters in HashRouter (navigate)", () => {
        testWindow.history.replaceState(null, "", "/");

        function Start() {
          let navigate = useNavigate();
          // eslint-disable-next-line react-hooks/exhaustive-deps
          React.useEffect(() => navigate("/with space"), []);
          return null;
        }

        let ctx = render(
          <HashRouter window={testWindow}>
            <Routes>
              <Route path="/" element={<Start />} />
              <Route path="/with space" element={<ShowPath />} />
            </Routes>
          </HashRouter>
        );

        expect(testWindow.location.pathname).toBe("/");
        expect(testWindow.location.hash).toBe("#/with%20space");
        expect(ctx.container.innerHTML).toMatchInlineSnapshot(
          `"<pre>{"pathname":"/with%20space","search":"","hash":""}</pre>"`
        );
      });

      it("encodes characters in createHashRouter", () => {
        testWindow.history.replaceState(null, "", "/#/with space");

        let router = createHashRouter(
          [{ path: "/with space", element: <ShowPath /> }],
          { window: testWindow }
        );
        let ctx = render(<RouterProvider router={router} />);

        expect(testWindow.location.pathname).toBe("/");
        expect(testWindow.location.hash).toBe("#/with%20space");
        expect(ctx.container.innerHTML).toMatchInlineSnapshot(
          `"<pre>{"pathname":"/with%20space","search":"","hash":""}</pre>"`
        );
      });

      it("encodes characters in createHashRouter (navigate)", () => {
        testWindow.history.replaceState(null, "", "/");

        function Start() {
          let navigate = useNavigate();
          // eslint-disable-next-line react-hooks/exhaustive-deps
          React.useEffect(() => navigate("/with space"), []);
          return null;
        }

        let router = createHashRouter(
          [
            { path: "/", element: <Start /> },
            { path: "/with space", element: <ShowPath /> },
          ],
          { window: testWindow }
        );
        let ctx = render(<RouterProvider router={router} />);

        expect(testWindow.location.pathname).toBe("/");
        expect(testWindow.location.hash).toBe("#/with%20space");
        expect(ctx.container.innerHTML).toMatchInlineSnapshot(
          `"<pre>{"pathname":"/with%20space","search":"","hash":""}</pre>"`
        );
      });
    });
  });
});
