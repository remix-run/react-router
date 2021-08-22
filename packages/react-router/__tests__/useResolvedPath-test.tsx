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
  it("path string resolves to Path object", () => {
    let path!: Path;
    function Home() {
      path = useResolvedPath("/home?user=mj#welcome");
      return <h1>Home</h1>;
    }

    createTestRenderer(
      <Router initialEntries={["/home"]}>
        <Routes>
          <Route path="/home" element={<Home />} />
        </Routes>
      </Router>
    );

    expect(typeof path).toBe("object");
    expect(path).toMatchObject({
      pathname: "/home",
      search: "?user=mj",
      hash: "#welcome"
    });
  });

  it("partial path object resolves to Path object", () => {
    let path!: Path;
    function Home() {
      path = useResolvedPath({
        pathname: "/home",
        search: new URLSearchParams({ user: "mj" }).toString(),
        hash: "#welcome"
      });
      return <h1>Home</h1>;
    }

    createTestRenderer(
      <Router initialEntries={["/home"]}>
        <Routes>
          <Route path="/home" element={<Home />} />
        </Routes>
      </Router>
    );

    expect(typeof path).toBe("object");
    expect(path).toMatchObject({
      pathname: "/home",
      search: "?user=mj",
      hash: "#welcome"
    });
  });

  describe("given a hash with a ? character", () => {
    it("hash is not parsed as a search string", () => {
      let path!: Path;
      function Home() {
        path = useResolvedPath("/home#welcome?user=mj");
        return <h1>Home</h1>;
      }

      createTestRenderer(
        <Router initialEntries={["/home"]}>
          <Routes>
            <Route path="/home" element={<Home />} />
          </Routes>
        </Router>
      );

      expect(typeof path).toBe("object");
      expect(path).toMatchObject({
        pathname: "/home",
        search: "",
        hash: "#welcome?user=mj"
      });
    });
  });
});
