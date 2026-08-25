import * as React from "react";
import * as ReactDOM from "react-dom/client";
import { act } from "@testing-library/react";
import {
  MemoryRouter,
  Routes,
  Route,
  useSearchParams,
  createBrowserRouter,
  useBlocker,
  RouterProvider,
  useLocation,
  useNavigate,
} from "../../index";
import type { SetURLSearchParams } from "../../index";

describe("useSearchParams", () => {
  let node: HTMLDivElement;
  beforeEach(() => {
    node = document.createElement("div");
    document.body.appendChild(node);
  });

  afterEach(() => {
    document.body.removeChild(node);
    node = null!;
  });

  it("reads and writes the search string", () => {
    function SearchPage() {
      let queryRef = React.useRef<HTMLInputElement>(null);
      let [searchParams, setSearchParams] = useSearchParams({ q: "" });
      let query = searchParams.get("q")!;

      function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (queryRef.current) {
          setSearchParams({ q: queryRef.current.value });
        }
      }

      return (
        <div>
          <p>The current query is "{query}".</p>
          <form onSubmit={handleSubmit}>
            <input name="q" defaultValue={query} ref={queryRef} />
          </form>
        </div>
      );
    }

    act(() => {
      ReactDOM.createRoot(node).render(
        <MemoryRouter initialEntries={["/search?q=Michael+Jackson"]}>
          <Routes>
            <Route path="search" element={<SearchPage />} />
          </Routes>
        </MemoryRouter>,
      );
    });

    let form = node.querySelector("form")!;
    expect(form).toBeDefined();

    let queryInput = node.querySelector<HTMLInputElement>("input[name=q]")!;
    expect(queryInput).toBeDefined();

    expect(node.innerHTML).toMatch(/The current query is "Michael Jackson"/);

    act(() => {
      queryInput.value = "Ryan Florence";
      form.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true }),
      );
    });

    expect(node.innerHTML).toMatch(/The current query is "Ryan Florence"/);
  });

  it("updates searchParams when a function is provided to setSearchParams (functional updates)", () => {
    function SearchPage() {
      let queryRef = React.useRef<HTMLInputElement>(null);
      let [searchParams, setSearchParams] = useSearchParams({ q: "" });
      let query = searchParams.get("q")!;
      let queryNew = searchParams.get("new")!;

      function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (queryRef.current) {
          setSearchParams((cur) => {
            cur.set("q", `${cur.get("q")} - appended`);
            cur.set("new", "Ryan Florence");
            return cur;
          });
        }
      }

      return (
        <div>
          <p>The current query is "{query}".</p>
          <p>The new query is "{queryNew}"</p>
          <form onSubmit={handleSubmit}>
            <input name="q" defaultValue={query} ref={queryRef} />
          </form>
        </div>
      );
    }

    act(() => {
      ReactDOM.createRoot(node).render(
        <MemoryRouter initialEntries={["/search?q=Michael+Jackson"]}>
          <Routes>
            <Route path="search" element={<SearchPage />} />
          </Routes>
        </MemoryRouter>,
      );
    });

    let form = node.querySelector("form")!;
    expect(form).toBeDefined();

    let queryInput = node.querySelector<HTMLInputElement>("input[name=q]")!;
    expect(queryInput).toBeDefined();

    expect(node.innerHTML).toMatch(/The current query is "Michael Jackson"/);
    expect(node.innerHTML).toMatch(/The new query is ""/);

    act(() => {
      form.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true }),
      );
    });

    expect(node.innerHTML).toMatch(
      /The current query is "Michael Jackson - appended"/,
    );
    expect(node.innerHTML).toMatch(/The new query is "Ryan Florence"/);
  });

  it("allows removal of search params when a default is provided", () => {
    function SearchPage() {
      let [searchParams, setSearchParams] = useSearchParams({
        value: "initial",
      });

      return (
        <div>
          <p>The current value is "{searchParams.get("value")}".</p>
          <button onClick={() => setSearchParams({})}>Click</button>
        </div>
      );
    }

    act(() => {
      ReactDOM.createRoot(node).render(
        <MemoryRouter initialEntries={["/search?value=initial"]}>
          <Routes>
            <Route path="search" element={<SearchPage />} />
          </Routes>
        </MemoryRouter>,
      );
    });

    let button = node.querySelector<HTMLInputElement>("button")!;
    expect(button).toBeDefined();

    expect(node.innerHTML).toMatch(/The current value is "initial"/);

    act(() => {
      button.dispatchEvent(new Event("click", { bubbles: true }));
    });

    expect(node.innerHTML).toMatch(/The current value is ""/);
  });

  it("returns initial default values in search params", () => {
    function SearchPage() {
      let [searchParams] = useSearchParams({ a: "1", b: "2" });
      return <p>{searchParams.toString()}</p>;
    }

    act(() => {
      ReactDOM.createRoot(node).render(
        <MemoryRouter initialEntries={["/search?value=initial"]}>
          <Routes>
            <Route path="search" element={<SearchPage />} />
          </Routes>
        </MemoryRouter>,
      );
    });

    expect(node.innerHTML).toMatchInlineSnapshot(
      `"<p>value=initial&amp;a=1&amp;b=2</p>"`,
    );
  });

  it("does not reflect functional update mutation when navigation is blocked", () => {
    let router = createBrowserRouter([
      {
        path: "/",
        Component() {
          let location = useLocation();
          let [searchParams, setSearchParams] = useSearchParams();
          let [shouldBlock, setShouldBlock] = React.useState(false);
          let b = useBlocker(shouldBlock);
          return (
            <>
              <pre id="output">
                {`location.search=${location.search}`}
                {`searchParams=${searchParams.toString()}`}
                {`blocked=${b.state}`}
              </pre>
              <button
                id="toggle-blocking"
                onClick={() => setShouldBlock(!shouldBlock)}
              >
                Toggle Blocking
              </button>
              <button
                id="navigate1"
                onClick={() => {
                  setSearchParams((prev) => {
                    prev.set("foo", "bar");
                    return prev;
                  });
                }}
              >
                Navigate 1
              </button>
              <button
                id="navigate2"
                onClick={() => {
                  setSearchParams((prev) => {
                    prev.set("foo", "baz");
                    return prev;
                  });
                }}
              >
                Navigate 2
              </button>
            </>
          );
        },
      },
    ]);

    act(() => {
      ReactDOM.createRoot(node).render(<RouterProvider router={router} />);
    });

    expect(node.querySelector("#output")).toMatchInlineSnapshot(`
      <pre
        id="output"
      >
        location.search=
        searchParams=
        blocked=unblocked
      </pre>
    `);

    act(() => {
      node
        .querySelector("#navigate1")!
        .dispatchEvent(new Event("click", { bubbles: true }));
    });

    expect(node.querySelector("#output")).toMatchInlineSnapshot(`
      <pre
        id="output"
      >
        location.search=?foo=bar
        searchParams=foo=bar
        blocked=unblocked
      </pre>
    `);

    act(() => {
      node
        .querySelector("#toggle-blocking")!
        .dispatchEvent(new Event("click", { bubbles: true }));
    });

    act(() => {
      node
        .querySelector("#navigate2")!
        .dispatchEvent(new Event("click", { bubbles: true }));
    });

    expect(node.querySelector("#output")).toMatchInlineSnapshot(`
      <pre
        id="output"
      >
        location.search=?foo=bar
        searchParams=foo=bar
        blocked=blocked
      </pre>
    `);
  });

  it("maintains a stable setSearchParams reference when the search changes", () => {
    let latestSetter: SetURLSearchParams | undefined;
    function SearchPage() {
      let [searchParams, setSearchParams] = useSearchParams();
      latestSetter = setSearchParams;
      return (
        <div>
          <p id="output">a={searchParams.get("a")}</p>
          <button id="update" onClick={() => setSearchParams({ a: "2" })}>
            update
          </button>
        </div>
      );
    }

    act(() => {
      ReactDOM.createRoot(node).render(
        <MemoryRouter initialEntries={["/search?a=1"]}>
          <Routes>
            <Route path="search" element={<SearchPage />} />
          </Routes>
        </MemoryRouter>,
      );
    });

    let initialSetter = latestSetter!;

    act(() => {
      node
        .querySelector("#update")!
        .dispatchEvent(new Event("click", { bubbles: true }));
    });

    expect(node.querySelector("#output")!.innerHTML).toMatch(/a=2/);
    expect(latestSetter).toBe(initialSetter);
  });

  it("maintains a stable setSearchParams reference when the pathname changes", () => {
    let latestSetter: SetURLSearchParams | undefined;
    function SearchPage() {
      let location = useLocation();
      let [, setSearchParams] = useSearchParams();
      let navigate = useNavigate();
      latestSetter = setSearchParams;
      return (
        <div>
          <p id="output">pathname={location.pathname}</p>
          <button id="navigate" onClick={() => navigate("/other")}>
            navigate
          </button>
        </div>
      );
    }

    act(() => {
      ReactDOM.createRoot(node).render(
        <MemoryRouter initialEntries={["/search"]}>
          <Routes>
            <Route path="/*" element={<SearchPage />} />
          </Routes>
        </MemoryRouter>,
      );
    });

    let initialSetter = latestSetter!;

    act(() => {
      node
        .querySelector("#navigate")!
        .dispatchEvent(new Event("click", { bubbles: true }));
    });

    expect(node.querySelector("#output")!.innerHTML).toMatch(
      /pathname=\/other/,
    );
    expect(latestSetter).toBe(initialSetter);
  });

  it("reads the latest committed search params from a reference captured before a navigation", () => {
    let firstSetter: SetURLSearchParams | undefined;
    function SearchPage() {
      let [searchParams, setSearchParams] = useSearchParams();
      let navigate = useNavigate();
      if (firstSetter === undefined) {
        firstSetter = setSearchParams;
      }
      return (
        <div>
          <p id="output">{searchParams.toString()}</p>
          <button id="to-a1" onClick={() => navigate("/search?a=1")}>
            to a=1
          </button>
        </div>
      );
    }

    act(() => {
      ReactDOM.createRoot(node).render(
        <MemoryRouter initialEntries={["/search"]}>
          <Routes>
            <Route path="search" element={<SearchPage />} />
          </Routes>
        </MemoryRouter>,
      );
    });

    act(() => {
      node
        .querySelector("#to-a1")!
        .dispatchEvent(new Event("click", { bubbles: true }));
    });

    expect(node.querySelector("#output")!.innerHTML).toMatch(/a=1/);

    act(() => {
      firstSetter!((prev) => {
        let next = new URLSearchParams(prev);
        next.set("b", prev.get("a") === "1" ? "fresh" : "stale");
        return next;
      });
    });

    expect(node.querySelector("#output")!.textContent).toMatch(/a=1&b=fresh/);
  });

  it("does not build functional updates on each other when called in the same tick", () => {
    function SearchPage() {
      let [searchParams, setSearchParams] = useSearchParams();
      return (
        <div>
          <p id="output">{searchParams.toString()}</p>
          <button
            id="double"
            onClick={() => {
              setSearchParams((prev) => {
                prev.set("foo", "one");
                return prev;
              });
              setSearchParams((prev) => {
                prev.set(
                  "bar",
                  prev.get("foo") === "one" ? "built" : "not-built",
                );
                return prev;
              });
            }}
          >
            double
          </button>
        </div>
      );
    }

    act(() => {
      ReactDOM.createRoot(node).render(
        <MemoryRouter initialEntries={["/search"]}>
          <Routes>
            <Route path="search" element={<SearchPage />} />
          </Routes>
        </MemoryRouter>,
      );
    });

    act(() => {
      node
        .querySelector("#double")!
        .dispatchEvent(new Event("click", { bubbles: true }));
    });

    expect(node.querySelector("#output")!.innerHTML).toMatch(/bar=not-built/);
    expect(node.querySelector("#output")!.innerHTML).not.toMatch(/foo/);
  });

  it("maintains a stable setSearchParams reference across unrelated re-renders", () => {
    let latestSetter: SetURLSearchParams | undefined;
    function SearchPage() {
      let [, setSearchParams] = useSearchParams();
      latestSetter = setSearchParams;
      return null;
    }
    function Parent() {
      let [count, setCount] = React.useState(0);
      return (
        <div>
          <p id="output">count={count}</p>
          <button id="bump" onClick={() => setCount(count + 1)}>
            bump
          </button>
          <SearchPage />
        </div>
      );
    }

    act(() => {
      ReactDOM.createRoot(node).render(
        <MemoryRouter initialEntries={["/search"]}>
          <Routes>
            <Route path="search" element={<Parent />} />
          </Routes>
        </MemoryRouter>,
      );
    });

    let initialSetter = latestSetter!;

    act(() => {
      node
        .querySelector("#bump")!
        .dispatchEvent(new Event("click", { bubbles: true }));
    });

    expect(node.querySelector("#output")!.innerHTML).toMatch(/count=1/);
    expect(latestSetter).toBe(initialSetter);
  });

  it("maintains a stable setSearchParams reference and fresh reads in a data router", () => {
    let latestSetter: SetURLSearchParams | undefined;
    let firstSetter: SetURLSearchParams | undefined;
    global.history.pushState({}, "", "/search");
    let router = createBrowserRouter([
      {
        path: "/search",
        Component() {
          let [searchParams, setSearchParams] = useSearchParams();
          if (firstSetter === undefined) {
            firstSetter = setSearchParams;
          }
          latestSetter = setSearchParams;
          return (
            <div>
              <p id="output">{searchParams.toString()}</p>
              <button id="update" onClick={() => setSearchParams({ a: "2" })}>
                update
              </button>
            </div>
          );
        },
      },
    ]);

    act(() => {
      ReactDOM.createRoot(node).render(<RouterProvider router={router} />);
    });

    let initialSetter = latestSetter!;

    act(() => {
      node
        .querySelector("#update")!
        .dispatchEvent(new Event("click", { bubbles: true }));
    });

    expect(node.querySelector("#output")!.innerHTML).toMatch(/a=2/);
    expect(latestSetter).toBe(initialSetter);

    act(() => {
      firstSetter!((prev) => {
        let next = new URLSearchParams(prev);
        next.set("b", prev.get("a") === "2" ? "fresh" : "stale");
        return next;
      });
    });

    expect(node.querySelector("#output")!.textContent).toMatch(/a=2&b=fresh/);
  });

  it("maintains a stable setSearchParams reference when sibling data routes share an element", () => {
    let latestSetter: SetURLSearchParams | undefined;
    function SharedPage() {
      let location = useLocation();
      let [, setSearchParams] = useSearchParams();
      let navigate = useNavigate();
      latestSetter = setSearchParams;
      return (
        <div>
          <p id="output">pathname={location.pathname}</p>
          <button id="navigate" onClick={() => navigate("/b")}>
            navigate
          </button>
        </div>
      );
    }
    let sharedElement = <SharedPage />;
    global.history.pushState({}, "", "/a");
    let router = createBrowserRouter([
      { path: "/a", element: sharedElement },
      { path: "/b", element: sharedElement },
    ]);

    act(() => {
      ReactDOM.createRoot(node).render(<RouterProvider router={router} />);
    });

    let initialSetter = latestSetter!;

    act(() => {
      node
        .querySelector("#navigate")!
        .dispatchEvent(new Event("click", { bubbles: true }));
    });

    expect(node.querySelector("#output")!.innerHTML).toMatch(
      /pathname=\/b/,
    );
    expect(latestSetter).toBe(initialSetter);
  });

  it("maintains a stable setSearchParams reference in StrictMode", () => {
    let latestSetter: SetURLSearchParams | undefined;
    function SearchPage() {
      let [searchParams, setSearchParams] = useSearchParams();
      latestSetter = setSearchParams;
      return (
        <div>
          <p id="output">a={searchParams.get("a")}</p>
          <button id="update" onClick={() => setSearchParams({ a: "2" })}>
            update
          </button>
        </div>
      );
    }

    act(() => {
      ReactDOM.createRoot(node).render(
        <React.StrictMode>
          <MemoryRouter initialEntries={["/search?a=1"]}>
            <Routes>
              <Route path="search" element={<SearchPage />} />
            </Routes>
          </MemoryRouter>
        </React.StrictMode>,
      );
    });

    let initialSetter = latestSetter!;

    act(() => {
      node
        .querySelector("#update")!
        .dispatchEvent(new Event("click", { bubbles: true }));
    });

    expect(node.querySelector("#output")!.innerHTML).toMatch(/a=2/);
    expect(latestSetter).toBe(initialSetter);
  });

  it("reads the previous committed search from another component's layout effect in the same commit, and fresh values from passive effects", () => {
    let firstSetter: SetURLSearchParams | undefined;
    let currentSetter: SetURLSearchParams | undefined;
    function BoundaryParent() {
      let [searchParams, setSearchParams] = useSearchParams();
      let navigate = useNavigate();
      if (firstSetter === undefined) {
        firstSetter = setSearchParams;
      }
      currentSetter = setSearchParams;
      return (
        <div>
          <p id="output">{searchParams.toString()}</p>
          <button id="to-a1" onClick={() => navigate("/search?a=1")}>
            to a=1
          </button>
          <BoundaryChild />
        </div>
      );
    }
    function BoundaryChild() {
      let location = useLocation();
      let layoutCalledRef = React.useRef(false);
      let passiveCalledRef = React.useRef(false);

      React.useLayoutEffect(() => {
        if (!layoutCalledRef.current && location.search === "?a=1") {
          layoutCalledRef.current = true;
          firstSetter!((prev) => {
            let next = new URLSearchParams(prev);
            next.set(
              "b",
              prev.get("a") === "1" ? "layout-fresh" : "layout-stale",
            );
            return next;
          });
        }
      });

      React.useEffect(() => {
        if (
          !passiveCalledRef.current &&
          location.search.includes("b=layout-stale")
        ) {
          passiveCalledRef.current = true;
          currentSetter!((prev) => {
            let next = new URLSearchParams(prev);
            next.set(
              "c",
              prev.get("b") === "layout-stale" ? "passive-fresh" : "passive-stale",
            );
            return next;
          });
        }
      });

      return null;
    }

    act(() => {
      ReactDOM.createRoot(node).render(
        <MemoryRouter initialEntries={["/search"]}>
          <Routes>
            <Route path="search" element={<BoundaryParent />} />
          </Routes>
        </MemoryRouter>,
      );
    });

    act(() => {
      node
        .querySelector("#to-a1")!
        .dispatchEvent(new Event("click", { bubbles: true }));
    });

    expect(node.querySelector("#output")!.textContent).toMatch(
      /b=layout-stale&c=passive-fresh/,
    );
    expect(node.querySelector("#output")!.textContent).not.toMatch(/a=1/);
  });
});
