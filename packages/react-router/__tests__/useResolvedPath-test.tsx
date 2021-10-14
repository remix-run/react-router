import * as React from "react";
import { create as createTestRenderer } from "react-test-renderer";
import type { Path } from "history";
import {
  MemoryRouter as Router,
  Routes,
  Route,
  useResolvedPath
} from "react-router";

function ShowResolvedPath({ path }: { path: string | Path }) {
  return <pre>{JSON.stringify(useResolvedPath(path))}</pre>;
}

describe("useResolvedPath", () => {
  it("path string resolves correctly", () => {
    let renderer = createTestRenderer(
      <Router initialEntries={["/"]}>
        <Routes>
          <Route
            path="/"
            element={<ShowResolvedPath path="/home?user=mj#welcome" />}
          />
        </Routes>
      </Router>
    );

    expect(renderer.toJSON()).toMatchInlineSnapshot(`
      <pre>
        {"pathname":"/home","search":"?user=mj","hash":"#welcome"}
      </pre>
    `);
  });

  it("partial path object resolves correctly", () => {
    let renderer = createTestRenderer(
      <Router initialEntries={["/"]}>
        <Routes>
          <Route
            path="/"
            element={
              <ShowResolvedPath
                path={{
                  pathname: "/home",
                  search: new URLSearchParams({ user: "mj" }).toString(),
                  hash: "#welcome"
                }}
              />
            }
          />
        </Routes>
      </Router>
    );

    expect(renderer.toJSON()).toMatchInlineSnapshot(`
      <pre>
        {"pathname":"/home","search":"?user=mj","hash":"#welcome"}
      </pre>
    `);
  });

  describe("given a hash with a ? character", () => {
    it("hash is not parsed as a search string", () => {
      let renderer = createTestRenderer(
        <Router initialEntries={["/"]}>
          <Routes>
            <Route
              path="/"
              element={<ShowResolvedPath path="/home#welcome?user=mj" />}
            />
          </Routes>
        </Router>
      );

      expect(renderer.toJSON()).toMatchInlineSnapshot(`
        <pre>
          {"pathname":"/home","search":"","hash":"#welcome?user=mj"}
        </pre>
      `);
    });
  });

  describe("in a splat route", () => {
    it("resolves . to the route path", () => {
      let renderer = createTestRenderer(
        <Router initialEntries={["/users/mj"]}>
          <Routes>
            <Route path="/users">
              <Route path="*" element={<ShowResolvedPath path="." />} />
            </Route>
          </Routes>
        </Router>
      );

      expect(renderer.toJSON()).toMatchInlineSnapshot(`
        <pre>
          {"pathname":"/users","search":"","hash":""}
        </pre>
      `);
    });
  });
});
