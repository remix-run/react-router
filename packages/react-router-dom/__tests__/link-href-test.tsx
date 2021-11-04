import * as React from "react";
import * as TestRenderer from "react-test-renderer";
import { MemoryRouter, Routes, Route, Link, Outlet } from "react-router-dom";

describe("<Link> href", () => {
  describe("in a static route", () => {
    test("absolute <Link to> resolves relative to the root URL", () => {
      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(
          <MemoryRouter initialEntries={["/inbox"]}>
            <Routes>
              <Route path="inbox" element={<Link to="/about" />} />
            </Routes>
          </MemoryRouter>
        );
      });

      expect(renderer.root.findByType("a").props.href).toEqual("/about");
    });

    test('<Link to="."> resolves relative to the current route', () => {
      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(
          <MemoryRouter initialEntries={["/inbox"]}>
            <Routes>
              <Route path="inbox" element={<Link to="." />} />
            </Routes>
          </MemoryRouter>
        );
      });

      expect(renderer.root.findByType("a").props.href).toEqual("/inbox");
    });

    test('<Link to=".."> resolves relative to the parent route', () => {
      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(
          <MemoryRouter initialEntries={["/inbox/messages"]}>
            <Routes>
              <Route path="inbox">
                <Route path="messages" element={<Link to=".." />} />
              </Route>
            </Routes>
          </MemoryRouter>
        );
      });

      expect(renderer.root.findByType("a").props.href).toEqual("/inbox");
    });

    test('<Link to=".."> with more .. segments than parent routes resolves to the root URL', () => {
      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(
          <MemoryRouter initialEntries={["/inbox/messages"]}>
            <Routes>
              <Route path="inbox">
                <Route path="messages" element={<Link to="../../about" />} />
              </Route>
            </Routes>
          </MemoryRouter>
        );
      });

      expect(renderer.root.findByType("a").props.href).toEqual("/about");
    });
  });

  describe("in a dynamic route", () => {
    test("absolute <Link to> resolves relative to the root URL", () => {
      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(
          <MemoryRouter initialEntries={["/inbox/messages/abc"]}>
            <Routes>
              <Route path="inbox">
                <Route path="messages/:id" element={<Link to="/about" />} />
              </Route>
            </Routes>
          </MemoryRouter>
        );
      });

      expect(renderer.root.findByType("a").props.href).toEqual("/about");
    });

    test('<Link to="."> resolves relative to the current route', () => {
      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(
          <MemoryRouter initialEntries={["/inbox/messages/abc"]}>
            <Routes>
              <Route path="inbox">
                <Route path="messages/:id" element={<Link to="." />} />
              </Route>
            </Routes>
          </MemoryRouter>
        );
      });

      expect(renderer.root.findByType("a").props.href).toEqual(
        "/inbox/messages/abc"
      );
    });

    test('<Link to=".."> resolves relative to the parent route', () => {
      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(
          <MemoryRouter initialEntries={["/inbox/messages/abc"]}>
            <Routes>
              <Route path="inbox">
                <Route path="messages/:id" element={<Link to=".." />} />
              </Route>
            </Routes>
          </MemoryRouter>
        );
      });

      expect(renderer.root.findByType("a").props.href).toEqual("/inbox");
    });

    test('<Link to=".."> with more .. segments than parent routes resolves to the root URL', () => {
      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(
          <MemoryRouter initialEntries={["/inbox/messages/abc"]}>
            <Routes>
              <Route path="inbox">
                <Route
                  path="messages/:id"
                  element={<Link to="../../about" />}
                />
              </Route>
            </Routes>
          </MemoryRouter>
        );
      });

      expect(renderer.root.findByType("a").props.href).toEqual("/about");
    });
  });

  describe("in an index route", () => {
    test("absolute <Link to> resolves relative to the root URL", () => {
      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(
          <MemoryRouter initialEntries={["/inbox"]}>
            <Routes>
              <Route path="inbox">
                <Route index element={<Link to="/home" />} />
              </Route>
            </Routes>
          </MemoryRouter>
        );
      });

      expect(renderer.root.findByType("a").props.href).toEqual("/home");
    });

    test('<Link to="."> resolves relative to the current route', () => {
      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(
          <MemoryRouter initialEntries={["/inbox"]}>
            <Routes>
              <Route path="inbox">
                <Route index element={<Link to="." />} />
              </Route>
            </Routes>
          </MemoryRouter>
        );
      });

      expect(renderer.root.findByType("a").props.href).toEqual("/inbox");
    });

    test('<Link to=".."> resolves relative to the parent route', () => {
      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(
          <MemoryRouter initialEntries={["/inbox"]}>
            <Routes>
              <Route path="inbox">
                <Route index element={<Link to=".." />} />
              </Route>
            </Routes>
          </MemoryRouter>
        );
      });

      expect(renderer.root.findByType("a").props.href).toEqual("/inbox");
    });

    test('<Link to=".."> with more .. segments than parent routes resolves to the root URL', () => {
      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(
          <MemoryRouter initialEntries={["/inbox"]}>
            <Routes>
              <Route path="inbox">
                <Route index element={<Link to="../../about" />} />
              </Route>
            </Routes>
          </MemoryRouter>
        );
      });

      expect(renderer.root.findByType("a").props.href).toEqual("/about");
    });
  });

  describe("in a layout route", () => {
    function MessagesLayout({ link }: { link: React.ReactElement }) {
      return (
        <div>
          {link}
          <Outlet />
        </div>
      );
    }

    test("absolute <Link to> resolves relative to the root URL", () => {
      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(
          <MemoryRouter initialEntries={["/inbox/messages"]}>
            <Routes>
              <Route path="inbox">
                <Route element={<MessagesLayout link={<Link to="/home" />} />}>
                  <Route path="messages" element={<h1>Messages</h1>} />
                </Route>
              </Route>
            </Routes>
          </MemoryRouter>
        );
      });

      expect(renderer.root.findByType("a").props.href).toEqual("/home");
    });

    test('<Link to="."> resolves relative to the current route', () => {
      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(
          <MemoryRouter initialEntries={["/inbox/messages"]}>
            <Routes>
              <Route path="inbox">
                <Route element={<MessagesLayout link={<Link to="." />} />}>
                  <Route path="messages" element={<h1>Messages</h1>} />
                </Route>
              </Route>
            </Routes>
          </MemoryRouter>
        );
      });

      expect(renderer.root.findByType("a").props.href).toEqual("/inbox");
    });

    test('<Link to=".."> resolves relative to the parent route', () => {
      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(
          <MemoryRouter initialEntries={["/inbox/messages"]}>
            <Routes>
              <Route path="inbox">
                <Route element={<MessagesLayout link={<Link to=".." />} />}>
                  <Route path="messages" element={<h1>Messages</h1>} />
                </Route>
              </Route>
            </Routes>
          </MemoryRouter>
        );
      });

      expect(renderer.root.findByType("a").props.href).toEqual("/inbox");
    });

    test('<Link to=".."> with more .. segments than parent routes resolves to the root URL', () => {
      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(
          <MemoryRouter initialEntries={["/inbox/messages"]}>
            <Routes>
              <Route path="inbox">
                <Route
                  element={<MessagesLayout link={<Link to="../../about" />} />}
                >
                  <Route path="messages" element={<h1>Messages</h1>} />
                </Route>
              </Route>
            </Routes>
          </MemoryRouter>
        );
      });

      expect(renderer.root.findByType("a").props.href).toEqual("/about");
    });
  });

  describe("in a splat route", () => {
    test("absolute <Link to> resolves relative to the root URL", () => {
      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(
          <MemoryRouter initialEntries={["/inbox/messages/123"]}>
            <Routes>
              <Route path="inbox">
                <Route path="messages/*" element={<Link to="/about" />} />
              </Route>
            </Routes>
          </MemoryRouter>
        );
      });

      expect(renderer.root.findByType("a").props.href).toEqual("/about");
    });

    test('<Link to="."> resolves relative to the current route', () => {
      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(
          <MemoryRouter initialEntries={["/inbox/messages/abc"]}>
            <Routes>
              <Route path="inbox">
                <Route path="messages/*" element={<Link to="." />} />
              </Route>
            </Routes>
          </MemoryRouter>
        );
      });

      expect(renderer.root.findByType("a").props.href).toEqual(
        "/inbox/messages"
      );
    });

    test('<Link to=".."> resolves relative to the parent route', () => {
      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(
          <MemoryRouter initialEntries={["/inbox/messages/abc"]}>
            <Routes>
              <Route path="inbox">
                <Route path="messages/*" element={<Link to=".." />} />
              </Route>
            </Routes>
          </MemoryRouter>
        );
      });

      expect(renderer.root.findByType("a").props.href).toEqual("/inbox");
    });

    test("<Link to> pointing to a sibling route resolves relative to its parent route", () => {
      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(
          <MemoryRouter initialEntries={["/inbox/messages/abc"]}>
            <Routes>
              <Route path="inbox">
                <Route
                  path="messages/*"
                  element={<Link to="../messages/def" />}
                />
              </Route>
            </Routes>
          </MemoryRouter>
        );
      });

      expect(renderer.root.findByType("a").props.href).toEqual(
        "/inbox/messages/def"
      );
    });

    test('<Link to=".."> with more .. segments than parent routes resolves to the root URL', () => {
      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(
          <MemoryRouter initialEntries={["/inbox/messages"]}>
            <Routes>
              <Route path="inbox">
                <Route
                  path="messages/*"
                  element={<Link to="../../../about" />}
                />
              </Route>
            </Routes>
          </MemoryRouter>
        );
      });

      expect(renderer.root.findByType("a").props.href).toEqual("/about");
    });
  });

  describe("under a <Router basename>", () => {
    test("absolute <Link to> resolves relative to the basename", () => {
      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(
          <MemoryRouter basename="/app" initialEntries={["/app/inbox"]}>
            <Routes>
              <Route path="inbox" element={<Link to="/about" />} />
            </Routes>
          </MemoryRouter>
        );
      });

      expect(renderer.root.findByType("a").props.href).toEqual("/app/about");
    });

    test('<Link to="."> resolves relative to the current route', () => {
      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(
          <MemoryRouter basename="/app" initialEntries={["/app/inbox"]}>
            <Routes>
              <Route path="inbox" element={<Link to="." />} />
            </Routes>
          </MemoryRouter>
        );
      });

      expect(renderer.root.findByType("a").props.href).toEqual("/app/inbox");
    });

    test('<Link to=".."> with no parent route resolves relative to the basename', () => {
      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(
          <MemoryRouter basename="/app" initialEntries={["/app/inbox"]}>
            <Routes>
              <Route path="inbox" element={<Link to="../about" />} />
            </Routes>
          </MemoryRouter>
        );
      });

      expect(renderer.root.findByType("a").props.href).toEqual("/app/about");
    });
  });

  describe("in a descendant <Routes>", () => {
    test("absolute <Link to> resolves relative to the root URL", () => {
      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(
          <MemoryRouter initialEntries={["/auth/login"]}>
            <Routes>
              <Route
                path="auth/*"
                element={
                  <Routes>
                    <Route
                      path="login"
                      element={<Link to="/auth/forgot-password" />}
                    />
                  </Routes>
                }
              />
            </Routes>
          </MemoryRouter>
        );
      });

      expect(renderer.root.findByType("a").props.href).toEqual(
        "/auth/forgot-password"
      );
    });

    test('<Link to="."> resolves relative to the current route', () => {
      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(
          <MemoryRouter initialEntries={["/auth/login"]}>
            <Routes>
              <Route
                path="auth/*"
                element={
                  <Routes>
                    <Route path="login" element={<Link to="." />} />
                  </Routes>
                }
              />
            </Routes>
          </MemoryRouter>
        );
      });

      expect(renderer.root.findByType("a").props.href).toEqual("/auth/login");
    });

    test('<Link to=".."> resolves relative to the ancestor route', () => {
      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(
          <MemoryRouter initialEntries={["/auth/login"]}>
            <Routes>
              <Route
                path="auth/*"
                element={
                  <Routes>
                    <Route path="login" element={<Link to=".." />} />
                  </Routes>
                }
              />
            </Routes>
          </MemoryRouter>
        );
      });

      expect(renderer.root.findByType("a").props.href).toEqual("/auth");
    });

    test('<Link to=".."> with more .. segments than ancestor routes resolves relative to the root URL', () => {
      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(
          <MemoryRouter initialEntries={["/auth/login"]}>
            <Routes>
              <Route
                path="auth/*"
                element={
                  <Routes>
                    <Route
                      path="login"
                      element={<Link to="../../../about" />}
                    />
                  </Routes>
                }
              />
            </Routes>
          </MemoryRouter>
        );
      });

      expect(renderer.root.findByType("a").props.href).toEqual("/about");
    });
  });
});
