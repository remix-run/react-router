/**
 * @jest-environment ./__tests__/custom-environment.js
 */

import { render, fireEvent, waitFor, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { JSDOM } from "jsdom";
import * as React from "react";
import * as TestRenderer from "react-test-renderer";
import {
  MemoryRouter,
  Routes,
  Route,
  NavLink,
  Outlet,
  DataBrowserRouter,
} from "react-router-dom";
import { _resetModuleScope } from "react-router/lib/components";

describe("NavLink", () => {
  describe("when it does not match", () => {
    it("does not apply an 'active' className to the underlying <a>", () => {
      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(
          <MemoryRouter initialEntries={["/home"]}>
            <Routes>
              <Route
                path="/home"
                element={<NavLink to="somewhere-else">Somewhere else</NavLink>}
              />
            </Routes>
          </MemoryRouter>
        );
      });

      let anchor = renderer.root.findByType("a");

      expect(anchor.props.className).not.toMatch("active");
    });

    it("does not change the content inside the <a>", () => {
      let renderer = TestRenderer.create(
        <MemoryRouter initialEntries={["/home"]}>
          <Routes>
            <Route
              path="/home"
              element={
                <NavLink to="somewhere-else">
                  {({ isActive }) => (isActive ? "Current" : "Somewhere else")}
                </NavLink>
              }
            />
          </Routes>
        </MemoryRouter>
      );

      let anchor = renderer.root.findByType("a");

      expect(anchor.children[0]).toMatch("Somewhere else");
    });

    it("applies an 'undefined' className to the underlying <a>", () => {
      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(
          <MemoryRouter initialEntries={["/home"]}>
            <Routes>
              <Route
                path="/home"
                element={
                  <NavLink
                    to="somewhere-else"
                    className={({ isActive }) =>
                      isActive ? "some-active-classname" : undefined
                    }
                  >
                    Home
                  </NavLink>
                }
              />
            </Routes>
          </MemoryRouter>
        );
      });

      let anchor = renderer.root.findByType("a");

      expect(anchor.props.className).toBeUndefined();
    });
  });

  describe("when it matches to the end", () => {
    it("applies the default 'active' className to the underlying <a>", () => {
      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(
          <MemoryRouter initialEntries={["/home"]}>
            <Routes>
              <Route path="/home" element={<NavLink to=".">Home</NavLink>} />
            </Routes>
          </MemoryRouter>
        );
      });

      let anchor = renderer.root.findByType("a");

      expect(anchor.props.className).toMatch("active");
    });

    it("applies its className correctly when provided as a function", () => {
      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(
          <MemoryRouter initialEntries={["/home"]}>
            <Routes>
              <Route
                path="/home"
                element={
                  <NavLink
                    to="."
                    className={({ isActive }) =>
                      "nav-link" + (isActive ? " highlighted" : " plain")
                    }
                  >
                    Home
                  </NavLink>
                }
              />
            </Routes>
          </MemoryRouter>
        );
      });

      let anchor = renderer.root.findByType("a");

      expect(anchor.props.className.includes("nav-link")).toBe(true);
      expect(anchor.props.className.includes("highlighted")).toBe(true);
      expect(anchor.props.className.includes("plain")).toBe(false);
    });

    it("applies its style correctly when provided as a function", () => {
      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(
          <MemoryRouter initialEntries={["/home"]}>
            <Routes>
              <Route
                path="/home"
                element={
                  <NavLink
                    to="."
                    style={({ isActive }) =>
                      isActive ? { textTransform: "uppercase" } : {}
                    }
                  >
                    Home
                  </NavLink>
                }
              />
            </Routes>
          </MemoryRouter>
        );
      });

      let anchor = renderer.root.findByType("a");

      expect(anchor.props.style).toMatchObject({ textTransform: "uppercase" });
    });

    it("applies its children correctly when provided as a function", () => {
      let renderer = TestRenderer.create(
        <MemoryRouter initialEntries={["/home"]}>
          <Routes>
            <Route
              path="/home"
              element={
                <NavLink to=".">
                  {({ isActive }) => (isActive ? "Home (current)" : "Home")}
                </NavLink>
              }
            />
          </Routes>
        </MemoryRouter>
      );

      let anchor = renderer.root.findByType("a");

      expect(anchor.children[0]).toMatch("Home (current)");
    });
  });

  describe("when it matches a partial URL segment", () => {
    it("does not apply the 'active' className to the underlying <a>", () => {
      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(
          <MemoryRouter initialEntries={["/home/children"]}>
            <Routes>
              <Route
                path="home"
                element={
                  <div>
                    <NavLink to="child">Home</NavLink>
                    <Outlet />
                  </div>
                }
              >
                <Route path="children" element={<div>Child</div>} />
              </Route>
            </Routes>
          </MemoryRouter>
        );
      });

      let anchor = renderer.root.findByType("a");

      expect(anchor.props.className).not.toMatch("active");
    });
  });

  describe("when it matches just the beginning but not to the end", () => {
    it("applies the default 'active' className to the underlying <a>", () => {
      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(
          <MemoryRouter initialEntries={["/home/child"]}>
            <Routes>
              <Route
                path="home"
                element={
                  <div>
                    <NavLink to=".">Home</NavLink>
                    <Outlet />
                  </div>
                }
              >
                <Route path="child" element={<div>Child</div>} />
              </Route>
            </Routes>
          </MemoryRouter>
        );
      });

      let anchor = renderer.root.findByType("a");

      expect(anchor.props.className).toMatch("active");
    });

    describe("when end=true", () => {
      it("does not apply the default 'active' className to the underlying <a>", () => {
        let renderer: TestRenderer.ReactTestRenderer;
        TestRenderer.act(() => {
          renderer = TestRenderer.create(
            <MemoryRouter initialEntries={["/home/child"]}>
              <Routes>
                <Route
                  path="home"
                  element={
                    <div>
                      <NavLink to="." end={true}>
                        Home
                      </NavLink>
                      <Outlet />
                    </div>
                  }
                >
                  <Route path="child" element={<div>Child</div>} />
                </Route>
              </Routes>
            </MemoryRouter>
          );
        });

        let anchor = renderer.root.findByType("a");

        expect(anchor.props.className).not.toMatch("active");
      });
    });
  });

  describe("when it matches without matching case", () => {
    it("applies the default 'active' className to the underlying <a>", () => {
      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(
          <MemoryRouter initialEntries={["/Home"]}>
            <Routes>
              <Route path="home" element={<NavLink to=".">Home</NavLink>} />
            </Routes>
          </MemoryRouter>
        );
      });

      let anchor = renderer.root.findByType("a");

      expect(anchor.props.className).toMatch("active");
    });

    describe("when caseSensitive=true", () => {
      it("does not apply the default 'active' className to the underlying <a>", () => {
        let renderer: TestRenderer.ReactTestRenderer;
        TestRenderer.act(() => {
          renderer = TestRenderer.create(
            <MemoryRouter initialEntries={["/Home"]}>
              <Routes>
                <Route
                  path="home"
                  element={
                    <NavLink to="/home" caseSensitive={true}>
                      Home
                    </NavLink>
                  }
                />
              </Routes>
            </MemoryRouter>
          );
        });

        let anchor = renderer.root.findByType("a");

        expect(anchor.props.className).not.toMatch("active");
      });
    });
  });
});

describe("NavLink using a data router", () => {
  afterEach(() => {
    _resetModuleScope();
  });

  it("applies the default 'active'/'pending' classNames to the underlying <a>", async () => {
    let deferred = defer();
    render(
      <DataBrowserRouter window={getWindow("/foo")} hydrationData={{}}>
        <Route path="/" element={<Layout />}>
          <Route path="foo" element={<p>Foo page</p>} />
          <Route
            path="bar"
            loader={() => deferred.promise}
            element={<p>Bar page</p>}
          />
        </Route>
      </DataBrowserRouter>
    );

    function Layout() {
      return (
        <>
          <NavLink to="/foo">Link to Foo</NavLink>
          <NavLink to="/bar">Link to Bar</NavLink>
          <Outlet />
        </>
      );
    }

    expect(screen.getByText("Link to Bar").className).toBe("");

    fireEvent.click(screen.getByText("Link to Bar"));
    expect(screen.getByText("Link to Bar").className).toBe("pending");

    deferred.resolve();
    await waitFor(() => screen.getByText("Bar page"));
    expect(screen.getByText("Link to Bar").className).toBe("active");
  });

  it("applies its className correctly when provided as a function", async () => {
    let deferred = defer();
    render(
      <DataBrowserRouter window={getWindow("/foo")} hydrationData={{}}>
        <Route path="/" element={<Layout />}>
          <Route path="foo" element={<p>Foo page</p>} />
          <Route
            path="bar"
            loader={() => deferred.promise}
            element={<p>Bar page</p>}
          />
        </Route>
      </DataBrowserRouter>
    );

    function Layout() {
      return (
        <>
          <NavLink to="/foo">Link to Foo</NavLink>
          <NavLink
            to="/bar"
            className={({ isActive, isPending }) =>
              isPending
                ? "some-pending-classname"
                : isActive
                ? "some-active-classname"
                : undefined
            }
          >
            Link to Bar
          </NavLink>

          <Outlet />
        </>
      );
    }

    expect(screen.getByText("Link to Bar").className).toBe("");

    fireEvent.click(screen.getByText("Link to Bar"));
    expect(screen.getByText("Link to Bar").className).toBe(
      "some-pending-classname"
    );

    deferred.resolve();
    await waitFor(() => screen.getByText("Bar page"));
    expect(screen.getByText("Link to Bar").className).toBe(
      "some-active-classname"
    );
  });

  it("applies its style correctly when provided as a function", async () => {
    let deferred = defer();
    render(
      <DataBrowserRouter window={getWindow("/foo")} hydrationData={{}}>
        <Route path="/" element={<Layout />}>
          <Route path="foo" element={<p>Foo page</p>} />
          <Route
            path="bar"
            loader={() => deferred.promise}
            element={<p>Bar page</p>}
          />
        </Route>
      </DataBrowserRouter>
    );

    function Layout() {
      return (
        <>
          <NavLink to="/foo">Link to Foo</NavLink>
          <NavLink
            to="/bar"
            style={({ isActive, isPending }) =>
              isPending
                ? { textTransform: "lowercase" }
                : isActive
                ? { textTransform: "uppercase" }
                : undefined
            }
          >
            Link to Bar
          </NavLink>

          <Outlet />
        </>
      );
    }

    expect(screen.getByText("Link to Bar").style.textTransform).toBe("");

    fireEvent.click(screen.getByText("Link to Bar"));
    expect(screen.getByText("Link to Bar").style.textTransform).toBe(
      "lowercase"
    );

    deferred.resolve();
    await waitFor(() => screen.getByText("Bar page"));
    expect(screen.getByText("Link to Bar").style.textTransform).toBe(
      "uppercase"
    );
  });

  it("applies its children correctly when provided as a function", async () => {
    let deferred = defer();
    render(
      <DataBrowserRouter window={getWindow("/foo")} hydrationData={{}}>
        <Route path="/" element={<Layout />}>
          <Route path="foo" element={<p>Foo page</p>} />
          <Route
            path="bar"
            loader={() => deferred.promise}
            element={<p>Bar page</p>}
          />
        </Route>
      </DataBrowserRouter>
    );

    function Layout() {
      return (
        <>
          <NavLink to="/foo">Link to Foo</NavLink>
          <NavLink to="/bar">
            {({ isActive, isPending }) =>
              isPending
                ? "Link to Bar (loading...)"
                : isActive
                ? "Link to Bar (current)"
                : "Link to Bar (idle)"
            }
          </NavLink>

          <Outlet />
        </>
      );
    }

    expect(screen.getByText("Link to Bar (idle)")).toBeDefined();

    fireEvent.click(screen.getByText("Link to Bar (idle)"));
    expect(screen.getByText("Link to Bar (loading...)")).toBeDefined();

    deferred.resolve();
    await waitFor(() => screen.getByText("Bar page"));
    expect(screen.getByText("Link to Bar (current)")).toBeDefined();
  });

  it("does not apply during transitions to non-matching locations", async () => {
    let deferred = defer();
    render(
      <DataBrowserRouter window={getWindow("/foo")} hydrationData={{}}>
        <Route path="/" element={<Layout />}>
          <Route path="foo" element={<p>Foo page</p>} />
          <Route path="bar" element={<p>Bar page</p>} />
          <Route
            path="baz"
            loader={() => deferred.promise}
            element={<p>Baz page</p>}
          />
        </Route>
      </DataBrowserRouter>
    );

    function Layout() {
      return (
        <>
          <NavLink to="/foo">Link to Foo</NavLink>
          <NavLink to="/bar">Link to Bar</NavLink>
          <NavLink to="/baz">Link to Baz</NavLink>
          <Outlet />
        </>
      );
    }

    expect(screen.getByText("Link to Bar").className).toBe("");

    fireEvent.click(screen.getByText("Link to Baz"));
    expect(screen.getByText("Link to Bar").className).toBe("");

    deferred.resolve();
    await waitFor(() => screen.getByText("Baz page"));
    expect(screen.getByText("Link to Bar").className).toBe("");
  });
});

describe("NavLink under a Routes with a basename", () => {
  describe("when it does not match", () => {
    it("does not apply the default 'active' className to the underlying <a>", () => {
      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(
          <MemoryRouter basename="/app" initialEntries={["/app/home"]}>
            <Routes>
              <Route
                path="home"
                element={<NavLink to="somewhere-else">Somewhere else</NavLink>}
              />
            </Routes>
          </MemoryRouter>
        );
      });

      let anchor = renderer.root.findByType("a");

      expect(anchor.props.className).not.toMatch("active");
    });
  });

  describe("when it matches", () => {
    it("applies the default 'active' className to the underlying <a>", () => {
      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(
          <MemoryRouter basename="/app" initialEntries={["/app/home"]}>
            <Routes>
              <Route path="home" element={<NavLink to=".">Home</NavLink>} />
            </Routes>
          </MemoryRouter>
        );
      });

      let anchor = renderer.root.findByType("a");

      expect(anchor.props.className).toMatch("active");
    });
  });
});

function defer() {
  let resolve: (val?: any) => Promise<void>;
  let reject: (error?: Error) => Promise<void>;
  let promise = new Promise((res, rej) => {
    resolve = async (val: any) => {
      res(val);
      try {
        await promise;
      } catch (e) {}
    };
    reject = async (error?: Error) => {
      rej(error);
      try {
        await promise;
      } catch (e) {}
    };
  });
  return {
    promise,
    //@ts-ignore
    resolve,
    //@ts-ignore
    reject,
  };
}

function getWindow(initialUrl: string): Window {
  // Need to use our own custom DOM in order to get a working history
  const dom = new JSDOM(`<!DOCTYPE html>`, { url: "https://remix.run/" });
  dom.window.history.replaceState(null, "", initialUrl);
  return dom.window as unknown as Window;
}
