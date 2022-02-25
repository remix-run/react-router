import * as React from "react";
import * as TestRenderer from "react-test-renderer";
import {
  MemoryRouter,
  Routes,
  Route,
  useOutlet,
  useOutletContext,
} from "react-router";

describe("useOutlet", () => {
  describe("when there is no child route", () => {
    it("returns null", () => {
      function Home() {
        return useOutlet();
      }

      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(
          <MemoryRouter initialEntries={["/home"]}>
            <Routes>
              <Route path="/home" element={<Home />} />
            </Routes>
          </MemoryRouter>
        );
      });

      expect(renderer.toJSON()).toBeNull();
    });

    it("renders the fallback", () => {
      function Home() {
        let outlet = useOutlet();
        return <div>{outlet ? "outlet" : "no outlet"}</div>;
      }

      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(
          <MemoryRouter initialEntries={["/home"]}>
            <Routes>
              <Route path="/home" element={<Home />} />
            </Routes>
          </MemoryRouter>
        );
      });

      expect(renderer.toJSON()).toMatchInlineSnapshot(`
        <div>
          no outlet
        </div>
      `);
    });

    it("renders the fallback with context provided", () => {
      function Home() {
        let outlet = useOutlet({ some: "context" });
        return <div>{outlet ? "outlet" : "no outlet"}</div>;
      }

      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(
          <MemoryRouter initialEntries={["/home"]}>
            <Routes>
              <Route path="/home" element={<Home />} />
            </Routes>
          </MemoryRouter>
        );
      });

      expect(renderer.toJSON()).toMatchInlineSnapshot(`
        <div>
          no outlet
        </div>
      `);
    });
  });

  describe("when there is a child route", () => {
    it("returns an element", () => {
      function Users() {
        return useOutlet();
      }

      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(
          <MemoryRouter initialEntries={["/users/profile"]}>
            <Routes>
              <Route path="users" element={<Users />}>
                <Route path="profile" element={<h1>Profile</h1>} />
              </Route>
            </Routes>
          </MemoryRouter>
        );
      });

      expect(renderer.toJSON()).toMatchInlineSnapshot(`
        <h1>
          Profile
        </h1>
      `);
    });

    it("returns an element when no context", () => {
      function Home() {
        let outlet = useOutlet();
        return <div>{outlet ? "outlet" : "no outlet"}</div>;
      }

      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(
          <MemoryRouter initialEntries={["/home"]}>
            <Routes>
              <Route path="/home" element={<Home />}>
                <Route index element={<div>index</div>} />
              </Route>
            </Routes>
          </MemoryRouter>
        );
      });

      expect(renderer.toJSON()).toMatchInlineSnapshot(`
          <div>
            outlet
          </div>
        `);
    });

    it("returns an element when context", () => {
      function Home() {
        let outlet = useOutlet({ some: "context" });
        return <div>{outlet ? "outlet" : "no outlet"}</div>;
      }

      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(
          <MemoryRouter initialEntries={["/home"]}>
            <Routes>
              <Route path="/home" element={<Home />}>
                <Route index element={<div>index</div>} />
              </Route>
            </Routes>
          </MemoryRouter>
        );
      });

      expect(renderer.toJSON()).toMatchInlineSnapshot(`
          <div>
            outlet
          </div>
        `);
    });
  });

  describe("OutletContext when there is no context", () => {
    it("returns null", () => {
      function Users() {
        return useOutlet();
      }

      function Profile() {
        let outletContext = useOutletContext();

        return (
          <div>
            <h1>Profile</h1>
            <pre>{outletContext}</pre>
          </div>
        );
      }

      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(
          <MemoryRouter initialEntries={["/users/profile"]}>
            <Routes>
              <Route path="users" element={<Users />}>
                <Route path="profile" element={<Profile />} />
              </Route>
            </Routes>
          </MemoryRouter>
        );
      });

      expect(renderer.toJSON()).toMatchInlineSnapshot(`
        <div>
          <h1>
            Profile
          </h1>
          <pre />
        </div>
      `);
    });
  });

  describe("OutletContext when there is context", () => {
    it("returns the context", () => {
      function Users() {
        return useOutlet([
          "Mary",
          "Jane",
          "Michael",
          "Bert",
          "Winifred",
          "George",
        ]);
      }

      function Profile() {
        let outletContext = useOutletContext<string[]>();

        return (
          <div>
            <h1>Profile</h1>
            <ul>
              {outletContext.map((name) => (
                <li key={name}>{name}</li>
              ))}
            </ul>
          </div>
        );
      }

      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(
          <MemoryRouter initialEntries={["/users/profile"]}>
            <Routes>
              <Route path="users" element={<Users />}>
                <Route path="profile" element={<Profile />} />
              </Route>
            </Routes>
          </MemoryRouter>
        );
      });

      expect(renderer.toJSON()).toMatchInlineSnapshot(`
        <div>
          <h1>
            Profile
          </h1>
          <ul>
            <li>
              Mary
            </li>
            <li>
              Jane
            </li>
            <li>
              Michael
            </li>
            <li>
              Bert
            </li>
            <li>
              Winifred
            </li>
            <li>
              George
            </li>
          </ul>
        </div>
      `);
    });
  });

  describe("when child route without element prop", () => {
    it("returns nested route element", () => {
      function Layout() {
        return useOutlet();
      }

      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(
          <MemoryRouter initialEntries={["/users/profile"]}>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route path="users">
                  <Route path="profile" element={<h1>Profile</h1>} />
                </Route>
              </Route>
            </Routes>
          </MemoryRouter>
        );
      });

      expect(renderer.toJSON()).toMatchInlineSnapshot(`
        <h1>
          Profile
        </h1>
      `);
    });

    it("returns the context", () => {
      function Layout() {
        return useOutlet(["Mary", "Jane", "Michael"]);
      }

      function Profile() {
        let outletContext = useOutletContext<string[]>();

        return (
          <div>
            <h1>Profile</h1>
            <ul>
              {outletContext.map((name) => (
                <li key={name}>{name}</li>
              ))}
            </ul>
          </div>
        );
      }

      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(
          <MemoryRouter initialEntries={["/users/profile"]}>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route path="users">
                  <Route path="profile" element={<Profile />} />
                </Route>
              </Route>
            </Routes>
          </MemoryRouter>
        );
      });

      expect(renderer.toJSON()).toMatchInlineSnapshot(`
        <div>
          <h1>
            Profile
          </h1>
          <ul>
            <li>
              Mary
            </li>
            <li>
              Jane
            </li>
            <li>
              Michael
            </li>
          </ul>
        </div>
      `);
    });
  });
});
