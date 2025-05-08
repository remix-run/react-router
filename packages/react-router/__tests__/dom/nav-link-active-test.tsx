import { render, fireEvent, waitFor, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { JSDOM } from "jsdom";
import * as React from "react";
import {
  BrowserRouter,
  MemoryRouter,
  Routes,
  Route,
  RouterProvider,
  NavLink,
  Outlet,
  createBrowserRouter,
  createRoutesFromElements,
} from "../../index";

describe("NavLink", () => {
  describe("when it does not match", () => {
    it("does not apply an 'active' className to the underlying <a>", () => {
      render(
        <MemoryRouter initialEntries={["/home"]}>
          <Routes>
            <Route
              path="/home"
              element={<NavLink to="somewhere-else">Somewhere else</NavLink>}
            />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByRole("link").classList).not.toContain("active");
    });

    it("does not change the content inside the <a>", () => {
      render(
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

      expect(screen.getByRole("link")).toBeTruthy();
    });

    it("applies an 'undefined' className to the underlying <a>", () => {
      render(
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

      expect(screen.getByRole("link").classList).not.toContain(
        "some-active-classname"
      );
    });
  });

  describe("when it matches to the end", () => {
    it("applies the default 'active' className to the underlying <a>", () => {
      render(
        <MemoryRouter initialEntries={["/home"]}>
          <Routes>
            <Route path="/home" element={<NavLink to=".">Home</NavLink>} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByRole("link").classList).toContain("active");
    });

    it("when the current URL has a trailing slash", () => {
      render(
        <MemoryRouter initialEntries={["/home/"]}>
          <Routes>
            <Route path="/home" element={<NavLink to="/home/">Home</NavLink>} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByRole("link").classList).toContain("active");
    });

    it("applies its className correctly when provided as a function", () => {
      render(
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

      let anchor = screen.getByRole("link");
      expect(anchor.classList).toContain("nav-link");
      expect(anchor.classList).toContain("highlighted");
      expect(anchor.classList).not.toContain("plain");
    });

    it("applies its style correctly when provided as a function", () => {
      render(
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

      expect(screen.getByRole("link").style.textTransform).toBe("uppercase");
    });

    it("applies its children correctly when provided as a function", () => {
      render(
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

      let anchor = screen.getByRole("link");
      expect(anchor.textContent).toBe("Home (current)");
    });

    it("matches when portions of the url are encoded", () => {
      render(
        <BrowserRouter window={getWindow("/users/matt brophy")}>
          <Routes>
            <Route
              path="/users/:name"
              element={
                <>
                  <NavLink to=".">Matt</NavLink>
                  <NavLink to="/users/matt brophy">Matt</NavLink>
                  <NavLink to="/users/michael jackson">Michael</NavLink>
                </>
              }
            />
          </Routes>
        </BrowserRouter>
      );

      const anchors = screen.getAllByRole("link");
      expect(anchors[0].classList).toContain("active");
      expect(anchors[1].classList).toContain("active");
      expect(anchors[2].classList).not.toContain("active");
    });
  });

  describe("when it matches a partial URL segment", () => {
    it("does not apply the 'active' className to the underlying <a>", () => {
      render(
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

      expect(screen.getByRole("link").classList).not.toContain("active");
    });

    it("does not match when <Link to> path is a subset of the active url", () => {
      render(
        <MemoryRouter initialEntries={["/user-preferences"]}>
          <Routes>
            <Route
              path="/"
              element={
                <div>
                  <NavLink to="user">Go to /user</NavLink>
                  <NavLink to="user-preferences">
                    Go to /user-preferences
                  </NavLink>
                  <Outlet />
                </div>
              }
            >
              <Route index element={<p>Index</p>} />
              <Route path="user" element={<p>User</p>} />
              <Route
                path="user-preferences"
                element={<p>User Preferences</p>}
              />
            </Route>
          </Routes>
        </MemoryRouter>
      );

      let anchors = screen.getAllByRole("link");
      expect(anchors[0].classList).not.toContain("active");
      expect(anchors[1].classList).toContain("active");
    });

    it("does not match when active url is a subset of a <Route path> segment", () => {
      render(
        <MemoryRouter initialEntries={["/user"]}>
          <Routes>
            <Route
              path="/"
              element={
                <div>
                  <NavLink to="user">Go to /user</NavLink>
                  <NavLink to="user-preferences">
                    Go to /user-preferences
                  </NavLink>
                  <Outlet />
                </div>
              }
            >
              <Route index element={<p>Index</p>} />
              <Route path="user" element={<p>User</p>} />
              <Route
                path="user-preferences"
                element={<p>User Preferences</p>}
              />
            </Route>
          </Routes>
        </MemoryRouter>
      );

      let anchors = screen.getAllByRole("link");
      expect(anchors[0].classList).toContain("active");
      expect(anchors[1].classList).not.toContain("active");
    });

    it("matches the root route with or without the end prop", () => {
      const { rerender } = render(
        <MemoryRouter>
          <Routes>
            <Route index element={<NavLink to="/">Root</NavLink>} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByRole("link").classList).toContain("active");

      rerender(
        <MemoryRouter>
          <Routes>
            <Route
              index
              element={
                <NavLink to="/" end>
                  Root
                </NavLink>
              }
            />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByRole("link").classList).toContain("active");
    });

    it("does not automatically apply to root non-layout segments", () => {
      render(
        <MemoryRouter initialEntries={["/home"]}>
          <Routes>
            <Route index element={<h1>Root</h1>} />
            <Route path="home" element={<NavLink to="/">Root</NavLink>}></Route>
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByRole("link").classList).not.toContain("active");
    });

    it("does not automatically apply to root layout segments", () => {
      render(
        <MemoryRouter initialEntries={["/home"]}>
          <Routes>
            <Route
              path="/"
              element={
                <>
                  <h1>Root</h1>
                  <Outlet />
                </>
              }
            >
              <Route
                path="home"
                element={<NavLink to="/">Root</NavLink>}
              ></Route>
            </Route>
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByRole("link").classList).not.toContain("active");
    });
  });

  describe("when it matches just the beginning but not to the end", () => {
    it("applies the default 'active' className to the underlying <a>", () => {
      render(
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

      expect(screen.getByRole("link").classList).toContain("active");
    });

    it("In case of trailing slash at the end of link", () => {
      render(
        <MemoryRouter initialEntries={["/home/child"]}>
          <Routes>
            <Route
              path="home"
              element={
                <div>
                  <NavLink to="/home/">Home</NavLink>
                  <Outlet />
                </div>
              }
            >
              <Route path="child" element={<div>Child</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByRole("link").classList).toContain("active");
    });

    describe("when end=true", () => {
      it("does not apply the default 'active' className to the underlying <a>", () => {
        render(
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

        expect(screen.getByRole("link").classList).not.toContain("active");
      });

      it("Handles trailing slashes accordingly when the URL does not have a trailing slash", () => {
        render(
          <MemoryRouter initialEntries={["/home"]}>
            <Routes>
              <Route
                path="home"
                element={
                  <div>
                    <NavLink to="/home" end>
                      Home
                    </NavLink>
                    <NavLink to="/home/" end>
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

        let anchors = screen.getAllByRole("link");
        expect(anchors[0].classList).toContain("active");
        expect(anchors[1].classList).not.toContain("active");
      });

      it("Handles trailing slashes accordingly when the URL has a trailing slash", () => {
        render(
          <MemoryRouter initialEntries={["/home/"]}>
            <Routes>
              <Route
                path="home"
                element={
                  <div>
                    <NavLink to="/home" end>
                      Home
                    </NavLink>
                    <NavLink to="/home/" end>
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

        let anchors = screen.getAllByRole("link");
        expect(anchors[0].classList).not.toContain("active");
        expect(anchors[1].classList).toContain("active");
      });
    });
  });

  describe("when it matches without matching case", () => {
    it("applies the default 'active' className to the underlying <a>", () => {
      render(
        <MemoryRouter initialEntries={["/Home"]}>
          <Routes>
            <Route path="home" element={<NavLink to=".">Home</NavLink>} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByRole("link").classList).toContain("active");
    });

    describe("when caseSensitive=true", () => {
      it("does not apply the default 'active' className to the underlying <a>", () => {
        render(
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

        expect(screen.getByRole("link").classList).not.toContain("active");
      });
    });
  });

  describe("when it matches with relative=path links", () => {
    it("applies the default 'active' className to the underlying <a>", () => {
      render(
        <MemoryRouter initialEntries={["/contacts/1"]}>
          <Routes>
            <Route
              path="contacts/:id"
              element={
                <NavLink to="../1" relative="path">
                  Link
                </NavLink>
              }
            />
          </Routes>
        </MemoryRouter>
      );

      let anchor = screen.getByRole("link");
      expect(anchor.getAttribute("href")).toBe("/contacts/1");
      expect(anchor.classList).toContain("active");
    });
  });
});

describe("NavLink using a data router", () => {
  it("applies the default 'active'/'pending' classNames to the underlying <a>", async () => {
    let dfd = createDeferred();
    let router = createBrowserRouter(
      createRoutesFromElements(
        <Route path="/" element={<Layout />}>
          <Route path="foo" element={<p>Foo page</p>} />
          <Route
            path="bar"
            loader={() => dfd.promise}
            element={<p>Bar page</p>}
          />
        </Route>
      ),
      {
        window: getWindow("/foo"),
      }
    );
    render(<RouterProvider router={router} />);

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

    dfd.resolve(null);
    await waitFor(() => screen.getByText("Bar page"));
    expect(screen.getByText("Link to Bar").className).toBe("active");
  });

  it("applies its className correctly when provided as a function", async () => {
    let dfd = createDeferred();
    let router = createBrowserRouter(
      createRoutesFromElements(
        <Route path="/" element={<Layout />}>
          <Route path="foo" element={<p>Foo page</p>} />
          <Route
            path="bar"
            loader={() => dfd.promise}
            element={<p>Bar page</p>}
          />
        </Route>
      ),
      {
        window: getWindow("/foo"),
      }
    );
    render(<RouterProvider router={router} />);

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

    dfd.resolve(null);
    await waitFor(() => screen.getByText("Bar page"));
    expect(screen.getByText("Link to Bar").className).toBe(
      "some-active-classname"
    );
  });

  it("applies its style correctly when provided as a function", async () => {
    let dfd = createDeferred();
    let router = createBrowserRouter(
      createRoutesFromElements(
        <Route path="/" element={<Layout />}>
          <Route path="foo" element={<p>Foo page</p>} />
          <Route
            path="bar"
            loader={() => dfd.promise}
            element={<p>Bar page</p>}
          />
        </Route>
      ),
      {
        window: getWindow("/foo"),
      }
    );
    render(<RouterProvider router={router} />);

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

    dfd.resolve(null);
    await waitFor(() => screen.getByText("Bar page"));
    expect(screen.getByText("Link to Bar").style.textTransform).toBe(
      "uppercase"
    );
  });

  it("applies its children correctly when provided as a function", async () => {
    let dfd = createDeferred();
    let router = createBrowserRouter(
      createRoutesFromElements(
        <Route path="/" element={<Layout />}>
          <Route path="foo" element={<p>Foo page</p>} />
          <Route
            path="bar"
            loader={() => dfd.promise}
            element={<p>Bar page</p>}
          />
        </Route>
      ),
      {
        window: getWindow("/foo"),
      }
    );
    render(<RouterProvider router={router} />);

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

    expect(screen.getByText("Link to Bar (idle)")).toBeTruthy();

    fireEvent.click(screen.getByText("Link to Bar (idle)"));
    expect(screen.getByText("Link to Bar (loading...)")).toBeTruthy();

    dfd.resolve(null);
    await waitFor(() => screen.getByText("Bar page"));
    expect(screen.getByText("Link to Bar (current)")).toBeTruthy();
  });

  it("does not apply during transitions to non-matching locations", async () => {
    let dfd = createDeferred();
    let router = createBrowserRouter(
      createRoutesFromElements(
        <Route path="/" element={<Layout />}>
          <Route path="foo" element={<p>Foo page</p>} />
          <Route path="bar" element={<p>Bar page</p>} />
          <Route
            path="baz"
            loader={() => dfd.promise}
            element={<p>Baz page</p>}
          />
        </Route>
      ),
      {
        window: getWindow("/foo"),
      }
    );
    render(<RouterProvider router={router} />);

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

    dfd.resolve(null);
    await waitFor(() => screen.getByText("Baz page"));
    expect(screen.getByText("Link to Bar").className).toBe("");
  });

  it("applies the default 'active'/'pending' classNames when the url has encoded characters", async () => {
    let barDfd = createDeferred();
    let bazDfd = createDeferred();
    let router = createBrowserRouter(
      createRoutesFromElements(
        <Route path="/" element={<Layout />}>
          <Route path="foo" element={<p>Foo page</p>} />
          <Route
            path="bar/:param"
            loader={() => barDfd.promise}
            element={<p>Bar page</p>}
          />
          <Route
            path="baz-✅"
            loader={() => bazDfd.promise}
            element={<p>Baz page</p>}
          />
        </Route>
      ),
      {
        window: getWindow("/foo"),
      }
    );
    render(<RouterProvider router={router} />);

    function Layout() {
      return (
        <>
          <NavLink to="/foo">Link to Foo</NavLink>
          <NavLink to="/bar/matt brophy">Link to Bar</NavLink>
          <NavLink to="/baz-✅">Link to Baz</NavLink>
          <Outlet />
        </>
      );
    }

    expect(screen.getByText("Link to Bar").className).toBe("");
    expect(screen.getByText("Link to Baz").className).toBe("");

    fireEvent.click(screen.getByText("Link to Bar"));
    expect(screen.getByText("Link to Bar").className).toBe("pending");
    expect(screen.getByText("Link to Baz").className).toBe("");

    barDfd.resolve(null);
    await waitFor(() => screen.getByText("Bar page"));
    expect(screen.getByText("Link to Bar").className).toBe("active");
    expect(screen.getByText("Link to Baz").className).toBe("");

    fireEvent.click(screen.getByText("Link to Baz"));
    expect(screen.getByText("Link to Bar").className).toBe("active");
    expect(screen.getByText("Link to Baz").className).toBe("pending");

    bazDfd.resolve(null);
    await waitFor(() => screen.getByText("Baz page"));
    expect(screen.getByText("Link to Bar").className).toBe("");
    expect(screen.getByText("Link to Baz").className).toBe("active");
  });

  it("applies the default 'active'/'pending' classNames when a basename is used", async () => {
    let dfd = createDeferred();
    let router = createBrowserRouter(
      createRoutesFromElements(
        <Route path="/" element={<Layout />}>
          <Route path="foo" element={<p>Foo page</p>} />
          <Route
            path="bar"
            loader={() => dfd.promise}
            element={<p>Bar page</p>}
          />
        </Route>
      ),
      {
        window: getWindow("/base/foo"),
        basename: "/base",
      }
    );
    render(<RouterProvider router={router} />);

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

    dfd.resolve(null);
    await waitFor(() => screen.getByText("Bar page"));
    expect(screen.getByText("Link to Bar").className).toBe("active");
  });
});

describe("NavLink under a Routes with a basename", () => {
  describe("when it does not match", () => {
    it("does not apply the default 'active' className to the underlying <a>", () => {
      render(
        <MemoryRouter basename="/app" initialEntries={["/app/home"]}>
          <Routes>
            <Route
              path="home"
              element={<NavLink to="somewhere-else">Somewhere else</NavLink>}
            />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByRole("link").classList).not.toContain("active");
    });
  });

  describe("when it matches", () => {
    it("applies the default 'active' className to the underlying <a>", () => {
      render(
        <MemoryRouter basename="/app" initialEntries={["/app/home"]}>
          <Routes>
            <Route path="home" element={<NavLink to=".">Home</NavLink>} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByRole("link").classList).toContain("active");
    });
  });
});

function createDeferred() {
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
