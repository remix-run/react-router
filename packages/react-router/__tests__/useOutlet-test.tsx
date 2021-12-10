import * as React from "react";
import * as TestRenderer from "react-test-renderer";
import {
  MemoryRouter,
  Routes,
  Route,
  useOutlet,
  useOutletContext
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
  });

  describe("when there is no context", () => {
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

  describe("when there is context", () => {
    it("returns the context", () => {
      function Users() {
        return useOutlet([
          "Mary",
          "Jane",
          "Michael",
          "Bert",
          "Winifred",
          "George"
        ]);
      }

      function Profile() {
        let outletContext = useOutletContext<string[]>();

        return (
          <div>
            <h1>Profile</h1>
            <ul>
              {outletContext.map(name => (
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
});
