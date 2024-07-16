import * as React from "react";
import * as TestRenderer from "react-test-renderer";
import type { Path } from "react-router";
import {
  MemoryRouter,
  Routes,
  Route,
  useResolvedPath,
  useLocation,
} from "react-router";
import { prettyDOM, render } from "@testing-library/react";

function ShowResolvedPath({ path }: { path: string | Path }) {
  return <pre>{JSON.stringify(useResolvedPath(path))}</pre>;
}

describe("useResolvedPath", () => {
  it("path string resolves correctly", () => {
    let renderer: TestRenderer.ReactTestRenderer;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(
        <MemoryRouter initialEntries={["/"]}>
          <Routes>
            <Route
              path="/"
              element={<ShowResolvedPath path="/home?user=mj#welcome" />}
            />
          </Routes>
        </MemoryRouter>
      );
    });

    expect(renderer.toJSON()).toMatchInlineSnapshot(`
      <pre>
        {"pathname":"/home","search":"?user=mj","hash":"#welcome"}
      </pre>
    `);
  });

  it("partial path object resolves correctly", () => {
    let renderer: TestRenderer.ReactTestRenderer;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(
        <MemoryRouter initialEntries={["/"]}>
          <Routes>
            <Route
              path="/"
              element={
                <ShowResolvedPath
                  path={{
                    pathname: "/home",
                    search: new URLSearchParams({ user: "mj" }).toString(),
                    hash: "#welcome",
                  }}
                />
              }
            />
          </Routes>
        </MemoryRouter>
      );
    });

    expect(renderer.toJSON()).toMatchInlineSnapshot(`
      <pre>
        {"pathname":"/home","search":"?user=mj","hash":"#welcome"}
      </pre>
    `);
  });

  describe("given a hash with a ? character", () => {
    it("hash is not parsed as a search string", () => {
      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(
          <MemoryRouter initialEntries={["/"]}>
            <Routes>
              <Route
                path="/"
                element={<ShowResolvedPath path="/home#welcome?user=mj" />}
              />
            </Routes>
          </MemoryRouter>
        );
      });

      expect(renderer.toJSON()).toMatchInlineSnapshot(`
        <pre>
          {"pathname":"/home","search":"","hash":"#welcome?user=mj"}
        </pre>
      `);
    });
  });

  describe("in a splat route", () => {
    // Note: This test asserts long-standing buggy behavior fixed by enabling
    // the future.v7_relativeSplatPath flag.  See:
    // https://github.com/remix-run/react-router/issues/11052#issuecomment-1836589329
    it("resolves . to the route path", () => {
      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(
          <MemoryRouter initialEntries={["/users/mj"]}>
            <Routes>
              <Route path="/users">
                <Route path="*" element={<ShowResolvedPath path="." />} />
              </Route>
            </Routes>
          </MemoryRouter>
        );
      });

      expect(renderer.toJSON()).toMatchInlineSnapshot(`
        <pre>
          {"pathname":"/users","search":"","hash":""}
        </pre>
      `);
    });

    it("resolves .. to the parent route path", () => {
      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(
          <MemoryRouter initialEntries={["/users/mj"]}>
            <Routes>
              <Route path="/users">
                <Route path="*" element={<ShowResolvedPath path="." />} />
              </Route>
            </Routes>
          </MemoryRouter>
        );
      });

      expect(renderer.toJSON()).toMatchInlineSnapshot(`
        <pre>
          {"pathname":"/users","search":"","hash":""}
        </pre>
      `);
    });

    it("resolves . to the route path (descendant route)", () => {
      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(
          <MemoryRouter initialEntries={["/users/mj"]}>
            <Routes>
              <Route
                path="/users/*"
                element={
                  <Routes>
                    <Route path="mj" element={<ShowResolvedPath path="." />} />
                  </Routes>
                }
              />
            </Routes>
          </MemoryRouter>
        );
      });

      expect(renderer.toJSON()).toMatchInlineSnapshot(`
        <pre>
          {"pathname":"/users/mj","search":"","hash":""}
        </pre>
      `);
    });

    it("resolves .. to the parent route path (descendant route)", () => {
      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(
          <MemoryRouter initialEntries={["/users/mj"]}>
            <Routes>
              <Route
                path="/users/*"
                element={
                  <Routes>
                    <Route path="mj" element={<ShowResolvedPath path=".." />} />
                  </Routes>
                }
              />
            </Routes>
          </MemoryRouter>
        );
      });

      expect(renderer.toJSON()).toMatchInlineSnapshot(`
        <pre>
          {"pathname":"/users","search":"","hash":""}
        </pre>
      `);
    });
  });

  describe("in a param route", () => {
    it("resolves . to the route path", () => {
      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(
          <MemoryRouter initialEntries={["/users/mj"]}>
            <Routes>
              <Route path="/users">
                <Route path=":name" element={<ShowResolvedPath path="." />} />
              </Route>
            </Routes>
          </MemoryRouter>
        );
      });

      expect(renderer.toJSON()).toMatchInlineSnapshot(`
        <pre>
          {"pathname":"/users/mj","search":"","hash":""}
        </pre>
      `);
    });

    it("resolves .. to the parent route", () => {
      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(
          <MemoryRouter initialEntries={["/users/mj"]}>
            <Routes>
              <Route path="/users">
                <Route path=":name" element={<ShowResolvedPath path=".." />} />
              </Route>
            </Routes>
          </MemoryRouter>
        );
      });

      expect(renderer.toJSON()).toMatchInlineSnapshot(`
        <pre>
          {"pathname":"/users","search":"","hash":""}
        </pre>
      `);
    });
  });

  // See: https://github.com/remix-run/react-router/issues/11052#issuecomment-1836589329
  describe("future.v7_relativeSplatPath", () => {
    function App({ enableFlag }: { enableFlag: boolean }) {
      let routeConfigs = [
        {
          routes: (
            <Route
              path="/foo/bar"
              element={<Component desc='<Route path="/foo/bar" />' />}
            />
          ),
        },
        {
          routes: (
            <Route
              path="/foo/:param"
              element={<Component desc='<Route path="/foo/:param" />' />}
            />
          ),
        },
        {
          routes: (
            <Route path="/foo">
              <Route
                path=":param"
                element={
                  <Component desc='<Route path="/foo"><Route path=":param" />' />
                }
              />
            </Route>
          ),
        },
        {
          routes: (
            <Route
              path="/foo/*"
              element={<Component desc='<Route path="/foo/*" />' />}
            />
          ),
        },
        {
          routes: (
            <Route path="foo">
              <Route
                path="*"
                element={
                  <Component desc='<Route path="/foo"><Route path="*" />' />
                }
              />
            </Route>
          ),
        },
      ];

      return (
        <>
          {routeConfigs.map((config, idx) => (
            <MemoryRouter
              initialEntries={["/foo/bar"]}
              key={idx}
              future={{ v7_relativeSplatPath: enableFlag }}
            >
              <Routes>{config.routes}</Routes>
            </MemoryRouter>
          ))}
        </>
      );
    }

    function Component({ desc }) {
      return (
        <>
          {`--- Routes: ${desc} ---`}
          {`useLocation(): ${useLocation().pathname}`}
          {`useResolvedPath('.'): ${useResolvedPath(".").pathname}`}
          {`useResolvedPath('..'): ${useResolvedPath("..").pathname}`}
          {`useResolvedPath('..', { relative: 'path' }): ${
            useResolvedPath("..", { relative: "path" }).pathname
          }`}
          {`useResolvedPath('baz/qux'): ${useResolvedPath("baz/qux").pathname}`}
          {`useResolvedPath('./baz/qux'): ${
            useResolvedPath("./baz/qux").pathname
          }\n`}
        </>
      );
    }

    it("when disabled, resolves splat route relative paths differently than other routes", async () => {
      let { container } = render(<App enableFlag={false} />);
      let html = getHtml(container);
      html = html ? html.replace(/&lt;/g, "<").replace(/&gt;/g, ">") : html;
      expect(html).toMatchInlineSnapshot(`
        "<div>
          --- Routes: <Route path="/foo/bar" /> ---
          useLocation(): /foo/bar
          useResolvedPath('.'): /foo/bar
          useResolvedPath('..'): /
          useResolvedPath('..', { relative: 'path' }): /foo
          useResolvedPath('baz/qux'): /foo/bar/baz/qux
          useResolvedPath('./baz/qux'): /foo/bar/baz/qux

          --- Routes: <Route path="/foo/:param" /> ---
          useLocation(): /foo/bar
          useResolvedPath('.'): /foo/bar
          useResolvedPath('..'): /
          useResolvedPath('..', { relative: 'path' }): /foo
          useResolvedPath('baz/qux'): /foo/bar/baz/qux
          useResolvedPath('./baz/qux'): /foo/bar/baz/qux

          --- Routes: <Route path="/foo"><Route path=":param" /> ---
          useLocation(): /foo/bar
          useResolvedPath('.'): /foo/bar
          useResolvedPath('..'): /foo
          useResolvedPath('..', { relative: 'path' }): /foo
          useResolvedPath('baz/qux'): /foo/bar/baz/qux
          useResolvedPath('./baz/qux'): /foo/bar/baz/qux

          --- Routes: <Route path="/foo/*" /> ---
          useLocation(): /foo/bar
          useResolvedPath('.'): /foo
          useResolvedPath('..'): /
          useResolvedPath('..', { relative: 'path' }): /
          useResolvedPath('baz/qux'): /foo/baz/qux
          useResolvedPath('./baz/qux'): /foo/baz/qux

          --- Routes: <Route path="/foo"><Route path="*" /> ---
          useLocation(): /foo/bar
          useResolvedPath('.'): /foo
          useResolvedPath('..'): /foo
          useResolvedPath('..', { relative: 'path' }): /
          useResolvedPath('baz/qux'): /foo/baz/qux
          useResolvedPath('./baz/qux'): /foo/baz/qux

        </div>"
      `);
    });

    it("when enabled, resolves splat route relative paths differently than other routes", async () => {
      let { container } = render(<App enableFlag={true} />);
      let html = getHtml(container);
      html = html ? html.replace(/&lt;/g, "<").replace(/&gt;/g, ">") : html;
      expect(html).toMatchInlineSnapshot(`
        "<div>
          --- Routes: <Route path="/foo/bar" /> ---
          useLocation(): /foo/bar
          useResolvedPath('.'): /foo/bar
          useResolvedPath('..'): /
          useResolvedPath('..', { relative: 'path' }): /foo
          useResolvedPath('baz/qux'): /foo/bar/baz/qux
          useResolvedPath('./baz/qux'): /foo/bar/baz/qux

          --- Routes: <Route path="/foo/:param" /> ---
          useLocation(): /foo/bar
          useResolvedPath('.'): /foo/bar
          useResolvedPath('..'): /
          useResolvedPath('..', { relative: 'path' }): /foo
          useResolvedPath('baz/qux'): /foo/bar/baz/qux
          useResolvedPath('./baz/qux'): /foo/bar/baz/qux

          --- Routes: <Route path="/foo"><Route path=":param" /> ---
          useLocation(): /foo/bar
          useResolvedPath('.'): /foo/bar
          useResolvedPath('..'): /foo
          useResolvedPath('..', { relative: 'path' }): /foo
          useResolvedPath('baz/qux'): /foo/bar/baz/qux
          useResolvedPath('./baz/qux'): /foo/bar/baz/qux

          --- Routes: <Route path="/foo/*" /> ---
          useLocation(): /foo/bar
          useResolvedPath('.'): /foo/bar
          useResolvedPath('..'): /
          useResolvedPath('..', { relative: 'path' }): /foo
          useResolvedPath('baz/qux'): /foo/bar/baz/qux
          useResolvedPath('./baz/qux'): /foo/bar/baz/qux

          --- Routes: <Route path="/foo"><Route path="*" /> ---
          useLocation(): /foo/bar
          useResolvedPath('.'): /foo/bar
          useResolvedPath('..'): /foo
          useResolvedPath('..', { relative: 'path' }): /foo
          useResolvedPath('baz/qux'): /foo/bar/baz/qux
          useResolvedPath('./baz/qux'): /foo/bar/baz/qux

        </div>"
      `);
    });

    // gh-issue #11629
    it("when enabled, '.' resolves to the current path including any splat paths nested in pathless routes", () => {
      let { container } = render(
        <MemoryRouter
          initialEntries={["/foo/bar"]}
          future={{ v7_relativeSplatPath: true }}
        >
          <Routes>
            <Route path="foo">
              <Route>
                <Route
                  path="*"
                  element={
                    <Component desc='<Route path="/foo"><Route><Route path="*" /></Route></Route>' />
                  }
                />
              </Route>
            </Route>
          </Routes>
        </MemoryRouter>
      );
      let html = getHtml(container);
      html = html ? html.replace(/&lt;/g, "<").replace(/&gt;/g, ">") : html;
      expect(html).toMatchInlineSnapshot(`
        "<div>
          --- Routes: <Route path="/foo"><Route><Route path="*" /></Route></Route> ---
          useLocation(): /foo/bar
          useResolvedPath('.'): /foo/bar
          useResolvedPath('..'): /foo
          useResolvedPath('..', { relative: 'path' }): /foo
          useResolvedPath('baz/qux'): /foo/bar/baz/qux
          useResolvedPath('./baz/qux'): /foo/bar/baz/qux

        </div>"
      `);
    });
  });
});

function getHtml(container: HTMLElement) {
  return prettyDOM(container, undefined, {
    highlight: false,
  });
}
