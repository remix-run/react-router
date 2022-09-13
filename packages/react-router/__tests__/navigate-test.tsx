import * as React from "react";
import * as TestRenderer from "react-test-renderer";
import {
  MemoryRouter,
  Navigate,
  Outlet,
  Routes,
  Route,
  RouterProvider,
  createMemoryRouter,
  useLocation,
} from "react-router";
import { prettyDOM, render, screen, waitFor } from "@testing-library/react";

describe("<Navigate>", () => {
  describe("with an absolute href", () => {
    it("navigates to the correct URL", () => {
      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(
          <MemoryRouter initialEntries={["/home"]}>
            <Routes>
              <Route path="home" element={<Navigate to="/about" />} />
              <Route path="about" element={<h1>About</h1>} />
            </Routes>
          </MemoryRouter>
        );
      });

      expect(renderer.toJSON()).toMatchInlineSnapshot(`
        <h1>
          About
        </h1>
      `);
    });
  });

  describe("with a relative href (relative=route)", () => {
    it("navigates to the correct URL", () => {
      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(
          <MemoryRouter initialEntries={["/home"]}>
            <Routes>
              <Route path="home" element={<Navigate to="../about" />} />
              <Route path="about" element={<h1>About</h1>} />
            </Routes>
          </MemoryRouter>
        );
      });

      expect(renderer.toJSON()).toMatchInlineSnapshot(`
        <h1>
          About
        </h1>
      `);
    });

    it("handles upward navigation from an index routes", () => {
      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(
          <MemoryRouter initialEntries={["/home"]}>
            <Routes>
              <Route path="home">
                <Route index element={<Navigate to="../about" />} />
              </Route>
              <Route path="about" element={<h1>About</h1>} />
            </Routes>
          </MemoryRouter>
        );
      });

      expect(renderer.toJSON()).toMatchInlineSnapshot(`
        <h1>
          About
        </h1>
      `);
    });

    it("handles upward navigation from inside a pathless layout route", () => {
      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(
          <MemoryRouter initialEntries={["/home"]}>
            <Routes>
              <Route element={<Outlet />}>
                <Route path="home" element={<Navigate to="../about" />} />
              </Route>
              <Route path="about" element={<h1>About</h1>} />
            </Routes>
          </MemoryRouter>
        );
      });

      expect(renderer.toJSON()).toMatchInlineSnapshot(`
        <h1>
          About
        </h1>
      `);
    });

    it("handles upward navigation from inside multiple pathless layout routes + index route", () => {
      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(
          <MemoryRouter initialEntries={["/home"]}>
            <Routes>
              <Route path="home">
                <Route element={<Outlet />}>
                  <Route element={<Outlet />}>
                    <Route element={<Outlet />}>
                      <Route index element={<Navigate to="../about" />} />
                    </Route>
                  </Route>
                </Route>
              </Route>
              <Route path="about" element={<h1>About</h1>} />
            </Routes>
          </MemoryRouter>
        );
      });

      expect(renderer.toJSON()).toMatchInlineSnapshot(`
        <h1>
          About
        </h1>
      `);
    });

    it("handles upward navigation from inside multiple pathless layout routes + path route", () => {
      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(
          <MemoryRouter initialEntries={["/home/page"]}>
            <Routes>
              <Route path="home" element={<Outlet />}>
                <Route element={<Outlet />}>
                  <Route element={<Outlet />}>
                    <Route element={<Outlet />}>
                      <Route
                        path="page"
                        element={<Navigate to="../../about" />}
                      />
                    </Route>
                  </Route>
                </Route>
              </Route>
              <Route path="about" element={<h1>About</h1>} />
            </Routes>
          </MemoryRouter>
        );
      });

      expect(renderer.toJSON()).toMatchInlineSnapshot(`
        <h1>
          About
        </h1>
      `);
    });

    it("handles parent navigation from inside multiple pathless layout routes", () => {
      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(
          <MemoryRouter initialEntries={["/home/page"]}>
            <Routes>
              <Route
                path="home"
                element={
                  <>
                    <h1>Home</h1>
                    <Outlet />
                  </>
                }
              >
                <Route element={<Outlet />}>
                  <Route element={<Outlet />}>
                    <Route element={<Outlet />}>
                      <Route
                        path="page"
                        element={
                          <>
                            <h2>Page</h2>
                            <Navigate to=".." />
                          </>
                        }
                      />
                    </Route>
                  </Route>
                </Route>
              </Route>
              <Route path="about" element={<h1>About</h1>} />
            </Routes>
          </MemoryRouter>
        );
      });

      expect(renderer.toJSON()).toMatchInlineSnapshot(`
        <h1>
          Home
        </h1>
      `);
    });

    it("handles relative navigation from nested index route", () => {
      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(
          <MemoryRouter initialEntries={["/layout/thing"]}>
            <Routes>
              <Route path="layout">
                <Route path=":param">
                  {/* redirect /layout/:param/ index routes to /layout/:param/dest */}
                  <Route index element={<Navigate to="dest" />} />
                  <Route path="dest" element={<h1>Destination</h1>} />
                </Route>
              </Route>
            </Routes>
          </MemoryRouter>
        );
      });

      expect(renderer.toJSON()).toMatchInlineSnapshot(`
        <h1>
          Destination
        </h1>
      `);
    });
  });

  describe("with a relative href (relative=path)", () => {
    it("navigates to the correct URL", () => {
      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(
          <MemoryRouter initialEntries={["/contacts/1"]}>
            <Routes>
              <Route path="contacts" element={<h1>Contacts</h1>} />
              <Route
                path="contacts/:id"
                element={<Navigate to=".." relative="path" />}
              />
            </Routes>
          </MemoryRouter>
        );
      });

      expect(renderer.toJSON()).toMatchInlineSnapshot(`
        <h1>
          Contacts
        </h1>
      `);
    });

    it("handles upward navigation from an index routes", () => {
      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(
          <MemoryRouter initialEntries={["/contacts/1"]}>
            <Routes>
              <Route path="contacts" element={<h1>Contacts</h1>} />
              <Route path="contacts/:id">
                <Route index element={<Navigate to=".." relative="path" />} />
              </Route>
            </Routes>
          </MemoryRouter>
        );
      });

      expect(renderer.toJSON()).toMatchInlineSnapshot(`
        <h1>
          Contacts
        </h1>
      `);
    });

    it("handles upward navigation from inside a pathless layout route", () => {
      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(
          <MemoryRouter initialEntries={["/contacts/1"]}>
            <Routes>
              <Route path="contacts" element={<h1>Contacts</h1>} />
              <Route element={<Outlet />}>
                <Route
                  path="contacts/:id"
                  element={<Navigate to=".." relative="path" />}
                />
              </Route>
            </Routes>
          </MemoryRouter>
        );
      });

      expect(renderer.toJSON()).toMatchInlineSnapshot(`
        <h1>
          Contacts
        </h1>
      `);
    });

    it("handles upward navigation from inside multiple pathless layout routes + index route", () => {
      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(
          <MemoryRouter initialEntries={["/contacts/1"]}>
            <Routes>
              <Route path="contacts" element={<h1>Contacts</h1>} />
              <Route path="contacts/:id">
                <Route element={<Outlet />}>
                  <Route element={<Outlet />}>
                    <Route element={<Outlet />}>
                      <Route
                        index
                        element={<Navigate to=".." relative="path" />}
                      />
                    </Route>
                  </Route>
                </Route>
              </Route>
            </Routes>
          </MemoryRouter>
        );
      });

      expect(renderer.toJSON()).toMatchInlineSnapshot(`
        <h1>
          Contacts
        </h1>
      `);
    });

    it("handles upward navigation from inside multiple pathless layout routes + path route", () => {
      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(
          <MemoryRouter initialEntries={["/contacts/1"]}>
            <Routes>
              <Route path="contacts" element={<Outlet />}>
                <Route index element={<h1>Contacts</h1>} />
                <Route element={<Outlet />}>
                  <Route element={<Outlet />}>
                    <Route element={<Outlet />}>
                      <Route
                        path=":id"
                        element={<Navigate to=".." relative="path" />}
                      />
                    </Route>
                  </Route>
                </Route>
              </Route>
            </Routes>
          </MemoryRouter>
        );
      });

      expect(renderer.toJSON()).toMatchInlineSnapshot(`
        <h1>
          Contacts
        </h1>
      `);
    });

    it("handles relative navigation from nested index route", () => {
      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(
          <MemoryRouter initialEntries={["/layout/thing"]}>
            <Routes>
              <Route path="layout">
                <Route path=":param">
                  {/* redirect /layout/:param/ index routes to /layout/:param/dest */}
                  <Route
                    index
                    element={<Navigate to="dest" relative="path" />}
                  />
                  <Route path="dest" element={<h1>Destination</h1>} />
                </Route>
              </Route>
            </Routes>
          </MemoryRouter>
        );
      });

      expect(renderer.toJSON()).toMatchInlineSnapshot(`
        <h1>
          Destination
        </h1>
      `);
    });

    it("preserves search params and hash", () => {
      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(
          <MemoryRouter initialEntries={["/contacts/1"]}>
            <Routes>
              <Route path="contacts" element={<Contacts />} />
              <Route
                path="contacts/:id"
                element={<Navigate to="..?foo=bar#hash" relative="path" />}
              />
            </Routes>
          </MemoryRouter>
        );
      });

      function Contacts() {
        let { search, hash } = useLocation();
        return (
          <>
            <h1>Contacts</h1>
            <p>
              {search}
              {hash}
            </p>
          </>
        );
      }

      expect(renderer.toJSON()).toMatchInlineSnapshot(`
        Array [
          <h1>
            Contacts
          </h1>,
          <p>
            ?foo=bar
            #hash
          </p>,
        ]
      `);
    });
  });

  it("does not cause navigation loops in data routers", async () => {
    // Note this is not the idiomatic way to do these redirects, they should
    // be done with loaders in data routers, but this is a likely scenario to
    // encounter while migrating to a data router
    let router = createMemoryRouter(
      [
        {
          path: "home",
          element: <Navigate to="/about" />,
        },
        {
          path: "about",
          element: <h1>About</h1>,
          loader: () => new Promise((r) => setTimeout(() => r("ok"), 10)),
        },
      ],
      {
        initialEntries: ["/home"],
      }
    );

    let { container } = render(
      <React.StrictMode>
        <RouterProvider router={router} />
      </React.StrictMode>
    );

    await waitFor(() => screen.getByText("About"));

    expect(getHtml(container)).toMatchInlineSnapshot(`
      "<div>
        <h1>
          About
        </h1>
      </div>"
    `);
  });
});

function getHtml(container: HTMLElement) {
  return prettyDOM(container, undefined, {
    highlight: false,
  });
}
