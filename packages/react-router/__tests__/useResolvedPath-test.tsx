import * as React from "react";
import { create as createTestRenderer } from "react-test-renderer";
import {
  MemoryRouter as Router,
  Routes,
  Route,
  useResolvedPath
} from "react-router";
import type { Path } from "history";

describe("useResolvedPath", () => {
  it("resolves . to the route path inside a * route", () => {
    let path!: Path;
    function ResolvePath({ path: pathProp }: { path: string }) {
      path = useResolvedPath(pathProp);
      return null;
    }

    createTestRenderer(
      <Router initialEntries={["/users/mj"]}>
        <Routes>
          <Route path="/users">
            <Route path="*" element={<ResolvePath path="." />} />
          </Route>
        </Routes>
      </Router>
    );

    expect(path).toMatchObject({
      pathname: "/users/mj"
    });
  });

  it("path string resolves to Path object", () => {
    let path!: Path;
    function ResolvePath({ path: pathProp }: { path: string }) {
      path = useResolvedPath(pathProp);
      return null;
    }

    createTestRenderer(
      <Router initialEntries={["/"]}>
        <Routes>
          <Route
            path="/"
            element={<ResolvePath path="/home?user=mj#welcome" />}
          />
        </Routes>
      </Router>
    );

    expect(path).toMatchObject({
      pathname: "/home",
      search: "?user=mj",
      hash: "#welcome"
    });
  });

  it("partial path object resolves to Path object", () => {
    let path!: Path;
    function ResolvePath({ path: pathProp }: { path: Path | string }) {
      path = useResolvedPath(pathProp);
      return null;
    }

    createTestRenderer(
      <Router initialEntries={["/"]}>
        <Routes>
          <Route
            path="/"
            element={
              <ResolvePath
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

    expect(path).toMatchObject({
      pathname: "/home",
      search: "?user=mj",
      hash: "#welcome"
    });
  });

  describe("given a hash with a ? character", () => {
    it("hash is not parsed as a search string", () => {
      let path!: Path;
      function ResolvePath({ path: pathProp }: { path: string }) {
        path = useResolvedPath(pathProp);
        return null;
      }

      createTestRenderer(
        <Router initialEntries={["/"]}>
          <Routes>
            <Route
              path="/"
              element={<ResolvePath path="/home#welcome?user=mj" />}
            />
          </Routes>
        </Router>
      );

      expect(path).toMatchObject({
        pathname: "/home",
        search: "",
        hash: "#welcome?user=mj"
      });
    });
  });
});
