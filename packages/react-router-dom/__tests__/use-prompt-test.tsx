import * as React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import {
  Link,
  RouterProvider,
  createBrowserRouter,
  unstable_usePrompt as usePrompt,
} from "../index";
import "@testing-library/jest-dom";
import { JSDOM } from "jsdom";

describe("usePrompt", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("when navigation is blocked", () => {
    it("shows window.confirm and blocks navigation when it returns false", async () => {
      let testWindow = getWindowImpl("/");
      const windowConfirmMock = jest
        .spyOn(window, "confirm")
        .mockImplementationOnce(() => false);

      let router = createBrowserRouter(
        [
          {
            path: "/",
            Component() {
              usePrompt({ when: true, message: "Are you sure??" });
              return <Link to="/arbitrary">Navigate</Link>;
            },
          },
          {
            path: "/arbitrary",
            Component: () => <h1>Arbitrary</h1>,
          },
        ],
        { window: testWindow }
      );

      render(<RouterProvider router={router} />);
      expect(screen.getByText("Navigate")).toBeInTheDocument();

      fireEvent.click(screen.getByText("Navigate"));
      await new Promise((r) => setTimeout(r, 0));

      expect(windowConfirmMock).toHaveBeenNthCalledWith(1, "Are you sure??");
      expect(screen.getByText("Navigate")).toBeInTheDocument();
    });

    it("shows window.confirm and navigates when it returns true", async () => {
      let testWindow = getWindowImpl("/");
      const windowConfirmMock = jest
        .spyOn(window, "confirm")
        .mockImplementationOnce(() => true);

      let router = createBrowserRouter(
        [
          {
            path: "/",
            Component() {
              usePrompt({ when: true, message: "Are you sure??" });
              return <Link to="/arbitrary">Navigate</Link>;
            },
          },
          {
            path: "/arbitrary",
            Component: () => <h1>Arbitrary</h1>,
          },
        ],
        { window: testWindow }
      );

      render(<RouterProvider router={router} />);
      expect(screen.getByText("Navigate")).toBeInTheDocument();

      fireEvent.click(screen.getByText("Navigate"));
      await waitFor(() => screen.getByText("Arbitrary"));

      expect(windowConfirmMock).toHaveBeenNthCalledWith(1, "Are you sure??");
      expect(screen.getByText("Arbitrary")).toBeInTheDocument();
    });
  });

  describe("when navigation is not blocked", () => {
    it("navigates without showing window.confirm", async () => {
      let testWindow = getWindowImpl("/");
      const windowConfirmMock = jest
        .spyOn(window, "confirm")
        .mockImplementation(() => true);

      let router = createBrowserRouter(
        [
          {
            path: "/",
            Component() {
              usePrompt({ when: false, message: "Are you sure??" });
              return <Link to="/arbitrary">Navigate</Link>;
            },
          },
          {
            path: "/arbitrary",
            Component: () => <h1>Arbitrary</h1>,
          },
        ],
        { window: testWindow }
      );

      render(<RouterProvider router={router} />);
      expect(screen.getByText("Navigate")).toBeInTheDocument();

      fireEvent.click(screen.getByText("Navigate"));
      await waitFor(() => screen.getByText("Arbitrary"));

      expect(windowConfirmMock).not.toHaveBeenCalled();
      expect(screen.getByText("Arbitrary")).toBeInTheDocument();
    });
  });
});

function getWindowImpl(initialUrl: string, isHash = false): Window {
  // Need to use our own custom DOM in order to get a working history
  const dom = new JSDOM(`<!DOCTYPE html>`, { url: "http://localhost/" });
  dom.window.history.replaceState(null, "", (isHash ? "#" : "") + initialUrl);
  return dom.window as unknown as Window;
}
