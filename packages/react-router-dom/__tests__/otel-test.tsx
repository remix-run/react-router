import * as React from "react";
import {
  Route,
  Link,
  createBrowserRouter,
  createRoutesFromElements,
  RouterProvider,
  useNavigate,
} from "react-router-dom";
import type { Tracer } from "@opentelemetry/api";
import { context } from "@opentelemetry/api";
import { trace } from "@opentelemetry/api";
import { fireEvent, render, waitFor } from "@testing-library/react";
import { JSDOM } from "jsdom";

function getWindowImpl(initialUrl: string, isHash = false): Window {
  // Need to use our own custom DOM in order to get a working history
  const dom = new JSDOM(`<!DOCTYPE html>`, { url: "http://localhost/" });
  dom.window.history.replaceState(null, "", (isHash ? "#" : "") + initialUrl);
  return dom.window as unknown as Window;
}

describe("OpenTelemetry", () => {
  let getTracerSpy: jest.SpyInstance;
  let activeContextSpy: jest.SpyInstance;
  let contextWithSpy: jest.SpyInstance;
  let setSpanContextSpy: jest.SpyInstance;
  const mockTracer = {
    startSpan: jest.fn().mockReturnValue({
      setAttributes: jest.fn(),
      end: jest.fn(),
    }),
  };
  const mockSpan = mockTracer.startSpan();
  const activeContext = context.active();

  beforeEach(() => {
    getTracerSpy = jest
      .spyOn(trace, "getTracer")
      .mockReturnValue(mockTracer as unknown as Tracer);
    activeContextSpy = jest
      .spyOn(context, "active")
      .mockReturnValue(activeContext);
    contextWithSpy = jest.spyOn(context, "with");
    setSpanContextSpy = jest.spyOn(trace, "setSpanContext");
  });

  afterEach(() => {
    getTracerSpy.mockRestore();
    activeContextSpy.mockRestore();
    contextWithSpy.mockRestore();
    setSpanContextSpy.mockRestore();

    jest.clearAllMocks();
  });

  it("creates a span without a context when navigating using a <Link /> component without state", async () => {
    function Home() {
      return (
        <div>
          <h1>Home</h1>
          <Link to="about">About</Link>
        </div>
      );
    }

    const router = createBrowserRouter(
      createRoutesFromElements(
        <>
          <Route path="/" element={<Home />} />
          <Route path="about" element={<h1>About</h1>} />
        </>
      ),
      { window: getWindowImpl("/") }
    );

    const screen = render(<RouterProvider router={router} />);

    const anchor = screen.getByRole("link");
    expect(anchor).not.toBeNull();

    fireEvent.click(anchor);

    const h1 = screen.getByText("About");
    expect(h1).not.toBeNull();
    expect(h1?.textContent).toEqual("About");

    expect(contextWithSpy).toHaveBeenCalledWith(
      activeContext,
      expect.any(Function)
    );
    expect(getTracerSpy).toHaveBeenCalledWith("react-router");
    expect(mockTracer.startSpan).toHaveBeenCalledWith("route-change");
    expect(mockSpan.setAttributes).toHaveBeenCalledWith({
      "react_router.current.url.path": "/",
      "react_router.current.url.query": "",
      "react_router.history_action": "PUSH",
      "react_router.next.url.path": "/about",
      "react_router.next.url.query": "",
    });
    expect(mockSpan.end).toHaveBeenCalledTimes(1);
  });

  it("creates a span without a context when navigating programmatically without state", async () => {
    function Home() {
      const navigate = useNavigate();

      return (
        <div>
          <h1>Home</h1>
          <button onClick={() => navigate("about")}>Navigate</button>
        </div>
      );
    }

    const router = createBrowserRouter(
      createRoutesFromElements(
        <>
          <Route path="/" element={<Home />} />
          <Route path="about" element={<h1>About</h1>} />
        </>
      ),
      { window: getWindowImpl("/") }
    );

    const screen = render(<RouterProvider router={router} />);

    const button = screen.getByRole("button");
    expect(button).not.toBeNull();

    fireEvent.click(button);
    await waitFor(() => screen.getByText("About"));

    expect(contextWithSpy).toHaveBeenCalledWith(
      activeContext,
      expect.any(Function)
    );
    expect(getTracerSpy).toHaveBeenCalledWith("react-router");
    expect(mockTracer.startSpan).toHaveBeenCalledWith("route-change");
    expect(mockSpan.setAttributes).toHaveBeenCalledWith({
      "react_router.current.url.path": "/",
      "react_router.current.url.query": "",
      "react_router.history_action": "PUSH",
      "react_router.next.url.path": "/about",
      "react_router.next.url.query": "",
    });
    expect(mockSpan.end).toHaveBeenCalledTimes(1);
  });

  it("creates a span with span context when navigating using a <Link /> component with state", async () => {
    function Home() {
      return (
        <div>
          <h1>Home</h1>
          <Link to="about" state={{ spanContext: { traceId: "123" } }}>
            About
          </Link>
        </div>
      );
    }

    const router = createBrowserRouter(
      createRoutesFromElements(
        <>
          <Route path="/" element={<Home />} />
          <Route path="about" element={<h1>About</h1>} />
        </>
      ),
      { window: getWindowImpl("/") }
    );

    const screen = render(<RouterProvider router={router} />);

    const anchor = screen.getByRole("link");
    expect(anchor).not.toBeNull();

    fireEvent.click(anchor);

    const h1 = screen.getByText("About");
    expect(h1).not.toBeNull();
    expect(h1?.textContent).toEqual("About");

    expect(setSpanContextSpy).toHaveBeenCalledWith(activeContext, {
      traceId: "123",
    });
  });

  it("creates a span with span context when navigating programmatically with state", async () => {
    function Home() {
      const navigate = useNavigate();

      return (
        <div>
          <h1>Home</h1>
          <button
            onClick={() =>
              navigate("about", {
                state: {
                  spanContext: {
                    traceId: "123",
                  },
                },
              })
            }
          >
            Navigate
          </button>
        </div>
      );
    }

    const router = createBrowserRouter(
      createRoutesFromElements(
        <>
          <Route path="/" element={<Home />} />
          <Route path="about" element={<h1>About</h1>} />
        </>
      ),
      { window: getWindowImpl("/") }
    );

    const screen = render(<RouterProvider router={router} />);

    const button = screen.getByRole("button");
    expect(button).not.toBeNull();

    fireEvent.click(button);

    const h1 = screen.getByText("About");
    expect(h1).not.toBeNull();
    expect(h1?.textContent).toEqual("About");

    expect(setSpanContextSpy).toHaveBeenCalledWith(activeContext, {
      traceId: "123",
    });
  });
});
