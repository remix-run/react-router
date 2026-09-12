import * as React from "react";
import * as TestRenderer from "react-test-renderer";

import type { Navigator } from "../lib/context";
import { setup } from "./router/utils/data-router-setup";
import { createBrowserHistory } from "../lib/router/history";
import {
  getNavigatorCurrentUrl,
  validateNavigationTarget,
} from "../lib/router/navigation";
import { createRouter } from "../lib/router/router";
import { Navigate, Route, Router, Routes } from "../lib/components";
import { useNavigate } from "../lib/hooks";
import { redirect } from "../lib/router/utils";
import getWindow from "./utils/getWindow";

const EXPLICIT_EXTERNAL_URLS = [
  "http://example.com/path",
  "https://example.com/path",
  "//example.com/path",
  "mailto:test@example.com",
  "tel:5551234567",
];

const IMPLICIT_EXTERNAL_URLS = [
  "/\t/example.com/path",
  "/\\example.com/path",
  "\\/example.com/path",
  "\\\\example.com/path",
];

const INVALID_PROTOCOL_URLS = [
  // eslint-disable-next-line no-script-url
  "javascript:console.log('hi')",
  "data:foo",
];

const EXTERNAL_URLS = [
  ...EXPLICIT_EXTERNAL_URLS,
  ...IMPLICIT_EXTERNAL_URLS,
  ...INVALID_PROTOCOL_URLS,
];

const VALID_INTERNAL_URLS = [
  {
    original: "\\example.com/path",
    resolved: "/example.com/path",
  },
];

describe("external navigation support", () => {
  it.each(EXTERNAL_URLS)(
    "router.navigate throws for external navigation to %s",
    async (to) => {
      let t = setup({
        routes: [{ id: "index", index: true }],
      });

      await expect(t.router.navigate(to)).rejects.toThrow(
        "External navigation is not allowed",
      );
      expect(t.router.state.location.pathname).toBe("/");
    },
  );

  it.each(VALID_INTERNAL_URLS)(
    "router.navigate does not throw for an internal navigation to %s",
    async (to) => {
      let t = setup({
        routes: [{ id: "index", index: true }],
      });

      await t.router.navigate(to.original);
      expect(t.router.state.location.pathname).toBe(to.resolved);
      expect(t.history.push).toHaveBeenCalledWith(
        expect.objectContaining({ pathname: to.resolved }),
        null,
      );
    },
  );

  it.each(EXTERNAL_URLS)(
    "router.navigate throws for an external navigation mask to %s",
    async (to) => {
      let t = setup({
        routes: [
          { id: "index", index: true },
          { id: "internal", path: "/internal" },
        ],
      });

      await expect(
        t.router.navigate("/internal", { mask: to }),
      ).rejects.toThrow("External navigation is not allowed");
      expect(t.router.state.location.pathname).toBe("/");
    },
  );

  it.each(VALID_INTERNAL_URLS)(
    "router.navigate does not throw for an internal navigation mask to %s",
    async (to) => {
      let t = setup({
        routes: [
          { id: "index", index: true },
          { id: "internal", path: "/internal" },
        ],
      });

      await t.router.navigate("/internal", { mask: to.original });
      expect(t.router.state.location.pathname).toBe("/internal");
      expect(t.history.push).toHaveBeenCalledWith(
        expect.objectContaining({
          pathname: "/internal",
          mask: expect.objectContaining({ pathname: to.resolved }),
        }),
        null,
      );
    },
  );

  it.each(EXTERNAL_URLS)(
    "<Navigate> throws for external navigation to %s",
    (to) => {
      let testWindow = getWindow("/");
      let history = createBrowserHistory({ window: testWindow });
      let pushSpy = jest.spyOn(history, "push");

      expect(() => {
        TestRenderer.act(() => {
          TestRenderer.create(
            <Router
              location={history.location}
              navigationType={history.action}
              navigator={history}
            >
              <Routes>
                <Route index element={<Navigate to={to} />} />
                <Route path="/example.com/path" element={<h1>Internal</h1>} />
              </Routes>
            </Router>,
          );
        });
      }).toThrow("External navigation is not allowed");

      expect(pushSpy).not.toHaveBeenCalled();
    },
  );

  it.each(VALID_INTERNAL_URLS)(
    "<Navigate> does not throw for internal navigation to %s",
    async (to) => {
      let testWindow = getWindow("/");
      let history = createBrowserHistory({ window: testWindow });
      let pushSpy = jest.spyOn(history, "push");

      let routes = (
        <Routes>
          <Route index element={<Navigate to={to.original} />} />
          <Route path={to.resolved} element={<h1>Internal</h1>} />
        </Routes>
      );

      TestRenderer.act(() => {
        TestRenderer.create(
          <Router
            location={history.location}
            navigationType={history.action}
            navigator={history}
          >
            {routes}
          </Router>,
        );
      });

      await new Promise((r) => setTimeout(r, 0));

      expect(pushSpy).toHaveBeenCalledWith(
        expect.objectContaining({ pathname: to.resolved }),
        undefined,
        expect.any(Object),
      );
    },
  );

  it.each(EXTERNAL_URLS)(
    "useNavigate throws for external navigation to %s",
    (to) => {
      function Home() {
        let navigate = useNavigate();
        return <button onClick={() => navigate(to)}>Navigate</button>;
      }

      let testWindow = getWindow("/");
      let history = createBrowserHistory({ window: testWindow });
      let pushSpy = jest.spyOn(history, "push");

      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(
          <Router
            location={history.location}
            navigationType={history.action}
            navigator={history}
          >
            <Routes>
              <Route index element={<Home />} />
            </Routes>
          </Router>,
        );
      });

      expect(() => renderer.root.findByType("button").props.onClick()).toThrow(
        "External navigation is not allowed",
      );
      expect(pushSpy).not.toHaveBeenCalled();
    },
  );

  it.each(VALID_INTERNAL_URLS)(
    "useNavigate does not throw for internal navigation to %s",
    (to) => {
      function Home() {
        let navigate = useNavigate();
        return <button onClick={() => navigate(to.original)}>Navigate</button>;
      }

      let testWindow = getWindow("/");
      let history = createBrowserHistory({ window: testWindow });
      let pushSpy = jest.spyOn(history, "push");

      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(
          <Router
            location={history.location}
            navigationType={history.action}
            navigator={history}
          >
            <Routes>
              <Route index element={<Home />} />
            </Routes>
          </Router>,
        );
      });

      TestRenderer.act(() =>
        renderer.root.findByType("button").props.onClick(),
      );
      expect(pushSpy).toHaveBeenCalledWith(
        expect.objectContaining({ pathname: to.resolved }),
        undefined,
        expect.any(Object),
      );
    },
  );

  it.each(IMPLICIT_EXTERNAL_URLS)(
    "client-side redirect rejects implicit external redirects to %s",
    async (location) => {
      let testWindow = getWindow("/");
      testWindow = {
        ...testWindow,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        location: {
          ...testWindow.location,
          assign: jest.fn(),
          replace: jest.fn(),
        },
      } as unknown as Window;
      let router = createRouter({
        history: createBrowserHistory(),
        routes: [
          { path: "/" },
          {
            path: "/start",
            loader: () => redirect(location),
          },
        ],
        window: testWindow,
      }).initialize();

      await expect(router.navigate("/start")).rejects.toThrow(
        "External navigation is not allowed",
      );
      expect(testWindow.location.assign).not.toHaveBeenCalled();
      router.dispose();
    },
  );

  it.each(INVALID_PROTOCOL_URLS)(
    "client-side redirect rejects implicit external redirects to %s",
    async (location) => {
      let testWindow = getWindow("/");
      testWindow = {
        ...testWindow,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        location: {
          ...testWindow.location,
          assign: jest.fn(),
          replace: jest.fn(),
        },
      } as unknown as Window;
      let router = createRouter({
        history: createBrowserHistory(),
        routes: [
          { path: "/" },
          {
            path: "/start",
            loader: () => redirect(location),
          },
        ],
        window: testWindow,
      }).initialize();

      await expect(router.navigate("/start")).rejects.toThrow(
        "Invalid redirect location",
      );
      expect(testWindow.location.assign).not.toHaveBeenCalled();
      router.dispose();
    },
  );

  it.each(EXPLICIT_EXTERNAL_URLS)(
    "client-side redirects permit explicit external redirects to %s",
    async (location) => {
      let testWindow = getWindow("/");
      testWindow = {
        ...testWindow,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        location: {
          ...testWindow.location,
          assign: jest.fn(),
          replace: jest.fn(),
        },
      } as unknown as Window;
      let router = createRouter({
        history: createBrowserHistory(),
        routes: [
          { path: "/" },
          {
            path: "/start",
            loader: () => redirect(location),
          },
        ],
        window: testWindow,
      }).initialize();

      await router.navigate("/start");
      expect(testWindow.location.assign).toHaveBeenCalledWith(location);
      router.dispose();
    },
  );

  it.each(VALID_INTERNAL_URLS)(
    "client-side redirects permit valid internal redirects to %s",
    async (to) => {
      let testWindow = getWindow("/");
      testWindow = {
        ...testWindow,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        location: {
          ...testWindow.location,
          assign: jest.fn(),
          replace: jest.fn(),
        },
      } as unknown as Window;
      let history = createBrowserHistory();
      jest.spyOn(history, "push");
      let router = createRouter({
        history,
        routes: [
          { path: "/" },
          {
            path: "/start",
            loader: () => redirect(to.original),
          },
        ],
        window: testWindow,
      }).initialize();

      await router.navigate("/start");
      expect(history.push).toHaveBeenCalledWith(
        expect.objectContaining({ pathname: to.resolved }),
        expect.any(Object),
      );
      router.dispose();
    },
  );

  it("uses an absolute createHref as a custom navigator base", () => {
    let navigator = {
      createHref: () => "https://custom.example/",
    } as unknown as Navigator;

    expect(getNavigatorCurrentUrl(navigator).origin).toBe(
      "https://custom.example",
    );
  });

  it("rejects an invalid resolved destination", () => {
    expect(() =>
      validateNavigationTarget(
        "/internal",
        "http://[",
        new URL("https://app.example/"),
        "reject",
      ),
    ).toThrow();
  });

  it("rejects an explicit destination whose origin changed", () => {
    expect(() =>
      validateNavigationTarget(
        "https://first.example/path",
        "https://second.example/path",
        new URL("https://app.example/"),
        "allow-explicit",
      ),
    ).toThrow("External navigation is not allowed");
  });
});
