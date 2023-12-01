import * as React from "react";
import * as TestRenderer from "react-test-renderer";
import type { Path } from "react-router";
import { MemoryRouter, Routes, Route, useResolvedPath } from "react-router";

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
    it("resolves . to the route path (nested splat)", () => {
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
          {"pathname":"/users/mj","search":"","hash":""}
        </pre>
      `);
    });

    it("resolves .. to the parent route path (nested splat)", () => {
      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(
          <MemoryRouter initialEntries={["/users/mj"]}>
            <Routes>
              <Route path="/users">
                <Route path="*" element={<ShowResolvedPath path=".." />} />
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

    it("resolves . to the route path (inline splat)", () => {
      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(
          <MemoryRouter initialEntries={["/users/name/mj"]}>
            <Routes>
              <Route path="/users">
                <Route path="name/*" element={<ShowResolvedPath path="." />} />
              </Route>
            </Routes>
          </MemoryRouter>
        );
      });

      expect(renderer.toJSON()).toMatchInlineSnapshot(`
        <pre>
          {"pathname":"/users/name/mj","search":"","hash":""}
        </pre>
      `);
    });

    it("resolves .. to the parent route path (inline splat)", () => {
      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(
          <MemoryRouter initialEntries={["/users/name/mj"]}>
            <Routes>
              <Route path="/users">
                <Route path="name/*" element={<ShowResolvedPath path=".." />} />
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
    it("resolves . to the route path (nested param)", () => {
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

    it("resolves .. to the parent route (nested param)", () => {
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

    it("resolves . to the route path (inline param)", () => {
      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(
          <MemoryRouter initialEntries={["/users/name/mj"]}>
            <Routes>
              <Route path="/users">
                <Route
                  path="name/:name"
                  element={<ShowResolvedPath path="." />}
                />
              </Route>
            </Routes>
          </MemoryRouter>
        );
      });

      expect(renderer.toJSON()).toMatchInlineSnapshot(`
        <pre>
          {"pathname":"/users/name/mj","search":"","hash":""}
        </pre>
      `);
    });

    it("resolves .. to the parent route (inline param)", () => {
      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(
          <MemoryRouter initialEntries={["/users/name/mj"]}>
            <Routes>
              <Route path="/users">
                <Route
                  path="name/:name"
                  element={<ShowResolvedPath path=".." />}
                />
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
});
