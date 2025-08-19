import * as React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import {
  Link,
  RouterProvider,
  createBrowserRouter,
  unstable_usePrompt as usePrompt,
} from "../../index";
import getWindow from "../utils/getWindow";

describe("usePrompt", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("when navigation is blocked", () => {
    it("shows window.confirm and blocks navigation when it returns false", async () => {
      let testWindow = getWindow("/");
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
        { window: testWindow },
      );

      render(<RouterProvider router={router} />);
      expect(screen.getByText("Navigate")).toBeInTheDocument();

      fireEvent.click(screen.getByText("Navigate"));
      await new Promise((r) => setTimeout(r, 0));

      expect(windowConfirmMock).toHaveBeenNthCalledWith(1, "Are you sure??");
      expect(screen.getByText("Navigate")).toBeInTheDocument();
    });

    it("shows window.confirm and navigates when it returns true", async () => {
      let testWindow = getWindow("/");
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
        { window: testWindow },
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
      let testWindow = getWindow("/");
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
        { window: testWindow },
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
