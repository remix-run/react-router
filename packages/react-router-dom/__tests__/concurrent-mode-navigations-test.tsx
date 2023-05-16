import * as React from "react";
import {
  MemoryRouter,
  Routes,
  Route,
  useNavigate,
  BrowserRouter,
  HashRouter,
  createMemoryRouter,
  createRoutesFromElements,
  RouterProvider,
} from "react-router-dom";
import {
  act,
  fireEvent,
  prettyDOM,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { JSDOM } from "jsdom";

describe("Handles concurrent mode features during navigations", () => {
  function getComponents() {
    function Home() {
      let navigate = useNavigate();
      return (
        <>
          <h1>Home</h1>
          <button onClick={() => navigate("/about")}>/about</button>
        </>
      );
    }

    let resolved = false;
    let dfd = createDeferred();
    function resolve() {
      resolved = true;
      return dfd.resolve();
    }

    function About() {
      if (!resolved) {
        throw dfd.promise;
      }
      return <h1>About</h1>;
    }

    return {
      Home,
      About,
      resolve,
    };
  }

  describe("when the destination route suspends with a boundary", () => {
    async function assertNavigation(
      container: HTMLElement,
      resolve: () => void
    ) {
      expect(getHtml(container)).toMatchInlineSnapshot(`
        "<div>
          <h1>
            Home
          </h1>
          <button>
            /about
          </button>
        </div>"
      `);

      fireEvent.click(screen.getByText("/about"));
      await waitFor(() => screen.getByText("Loading..."));

      expect(getHtml(container)).toMatchInlineSnapshot(`
        "<div>
          <p>
            Loading...
          </p>
        </div>"
      `);

      await act(() => resolve());
      await waitFor(() => screen.getByText("About"));

      expect(getHtml(container)).toMatchInlineSnapshot(`
        "<div>
          <h1>
            About
          </h1>
        </div>"
      `);
    }

    // eslint-disable-next-line jest/expect-expect
    it("MemoryRouter", async () => {
      let { Home, About, resolve } = getComponents();

      let { container } = render(
        <MemoryRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route
              path="/about"
              element={
                <React.Suspense fallback={<p>Loading...</p>}>
                  <About />
                </React.Suspense>
              }
            />
          </Routes>
        </MemoryRouter>
      );

      await assertNavigation(container, resolve);
    });

    // eslint-disable-next-line jest/expect-expect
    it("BrowserRouter", async () => {
      let { Home, About, resolve } = getComponents();

      let { container } = render(
        <BrowserRouter window={getWindowImpl("/", false)}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route
              path="/about"
              element={
                <React.Suspense fallback={<p>Loading...</p>}>
                  <About />
                </React.Suspense>
              }
            />
          </Routes>
        </BrowserRouter>
      );

      await assertNavigation(container, resolve);
    });

    // eslint-disable-next-line jest/expect-expect
    it("HashRouter", async () => {
      let { Home, About, resolve } = getComponents();

      let { container } = render(
        <HashRouter window={getWindowImpl("/", true)}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route
              path="/about"
              element={
                <React.Suspense fallback={<p>Loading...</p>}>
                  <About />
                </React.Suspense>
              }
            />
          </Routes>
        </HashRouter>
      );

      await assertNavigation(container, resolve);
    });

    // eslint-disable-next-line jest/expect-expect
    it("RouterProvider", async () => {
      let { Home, About, resolve } = getComponents();

      let router = createMemoryRouter(
        createRoutesFromElements(
          <>
            <Route path="/" element={<Home />} />
            <Route
              path="/about"
              element={
                <React.Suspense fallback={<p>Loading...</p>}>
                  <About />
                </React.Suspense>
              }
            />
          </>
        )
      );
      let { container } = render(<RouterProvider router={router} />);

      await assertNavigation(container, resolve);
    });
  });

  describe("when the destination route suspends without a boundary", () => {
    async function assertNavigation(
      container: HTMLElement,
      resolve: () => void
    ) {
      expect(getHtml(container)).toMatchInlineSnapshot(`
        "<div>
          <h1>
            Home
          </h1>
          <button>
            /about
          </button>
        </div>"
      `);

      fireEvent.click(screen.getByText("/about"));
      await tick();

      expect(getHtml(container)).toMatchInlineSnapshot(`
        "<div>
          <h1>
            Home
          </h1>
          <button>
            /about
          </button>
        </div>"
      `);

      await act(() => resolve());
      await waitFor(() => screen.getByText("About"));

      expect(getHtml(container)).toMatchInlineSnapshot(`
        "<div>
          <h1>
            About
          </h1>
        </div>"
      `);
    }

    // eslint-disable-next-line jest/expect-expect
    it("MemoryRouter", async () => {
      let { Home, About, resolve } = getComponents();

      let { container } = render(
        <MemoryRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
          </Routes>
        </MemoryRouter>
      );

      await assertNavigation(container, resolve);
    });

    // eslint-disable-next-line jest/expect-expect
    it("BrowserRouter", async () => {
      let { Home, About, resolve } = getComponents();

      let { container } = render(
        <BrowserRouter window-={getWindowImpl("/", true)}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
          </Routes>
        </BrowserRouter>
      );

      await assertNavigation(container, resolve);
    });

    // eslint-disable-next-line jest/expect-expect
    it("HashRouter", async () => {
      let { Home, About, resolve } = getComponents();

      let { container } = render(
        <HashRouter window-={getWindowImpl("/", true)}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
          </Routes>
        </HashRouter>
      );

      await assertNavigation(container, resolve);
    });

    // eslint-disable-next-line jest/expect-expect
    it("RouterProvider", async () => {
      let { Home, About, resolve } = getComponents();

      let router = createMemoryRouter(
        createRoutesFromElements(
          <>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
          </>
        )
      );
      let { container } = render(<RouterProvider router={router} />);

      await assertNavigation(container, resolve);
    });
  });
});

function getWindowImpl(initialUrl: string, isHash = false): Window {
  // Need to use our own custom DOM in order to get a working history
  const dom = new JSDOM(`<!DOCTYPE html>`, { url: "http://localhost/" });
  dom.window.history.replaceState(null, "", (isHash ? "#" : "") + initialUrl);
  return dom.window as unknown as Window;
}

function getHtml(container: HTMLElement) {
  return prettyDOM(container, undefined, {
    highlight: false,
  });
}

async function tick() {
  await new Promise((r) => setTimeout(r, 0));
}

function createDeferred() {
  let resolve: (val?: any) => Promise<void>;
  let reject: (error?: Error) => Promise<void>;
  let promise = new Promise((res, rej) => {
    resolve = async (val: any) => {
      res(val);
      await tick();
      await promise;
    };
    reject = async (error?: Error) => {
      rej(error);
      await promise.catch(() => tick());
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
