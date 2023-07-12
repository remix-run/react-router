import * as React from "react";
import { act, render, screen } from "@testing-library/react";
import {
  Link,
  RouterProvider,
  createBrowserRouter,
  unstable_usePrompt as usePrompt,
} from "../index";
import "@testing-library/jest-dom";

const PromptRoute = ({ when, message }: Parameters<typeof usePrompt>[0]) => {
  usePrompt({ when, message });

  return (
    <>
      <h1>Prompt Route</h1>

      <Link to="/arbitrary">Navigate to arbitrary route</Link>
    </>
  );
};

const ArbitraryRoute = () => {
  return <h1>Arbitrary Route</h1>;
};

describe("usePrompt", () => {
  afterEach(() => {
    jest.clearAllMocks();

    window.history.pushState({}, "", "/");
  });

  describe("when navigation is blocked", () => {
    it("shows the confirmation prompt and does not navigate when the confirmation prompt is cancelled", () => {
      const when = true;
      const message = "__MESSAGE__";

      const router = createBrowserRouter([
        {
          path: "/",
          element: <PromptRoute when={when} message={message} />,
        },
        {
          path: "/arbitrary",
          element: <ArbitraryRoute />,
        },
      ]);

      render(<RouterProvider router={router} />);

      expect(
        screen.getByRole("heading", { name: "Prompt Route" })
      ).toBeInTheDocument();

      const windowConfirmMock = jest
        .spyOn(window, "confirm")
        .mockImplementationOnce(() => false);

      act(() => {
        screen
          .getByRole("link", { name: "Navigate to arbitrary route" })
          .click();
      });

      expect(windowConfirmMock).toHaveBeenNthCalledWith(1, message);

      expect(
        screen.getByRole("heading", { name: "Prompt Route" })
      ).toBeInTheDocument();
    });

    it("shows the confirmation prompt and navigates when the confirmation prompt is accepted", () => {
      const when = true;
      const message = "__MESSAGE__";

      const router = createBrowserRouter([
        {
          path: "/",
          element: <PromptRoute when={when} message={message} />,
        },
        {
          path: "/arbitrary",
          element: <ArbitraryRoute />,
        },
      ]);

      render(<RouterProvider router={router} />);

      expect(
        screen.getByRole("heading", { name: "Prompt Route" })
      ).toBeInTheDocument();

      const windowConfirmMock = jest
        .spyOn(window, "confirm")
        .mockImplementationOnce(() => true);

      act(() => {
        screen
          .getByRole("link", { name: "Navigate to arbitrary route" })
          .click();
      });

      expect(windowConfirmMock).toHaveBeenNthCalledWith(1, message);

      expect(
        screen.getByRole("heading", { name: "Arbitrary Route" })
      ).toBeInTheDocument();
    });
  });

  describe("when navigation is not blocked", () => {
    it("navigates without showing the confirmation prompt", () => {
      const when = false;
      const message = "__MESSAGE__";

      const router = createBrowserRouter([
        {
          path: "/",
          element: <PromptRoute when={when} message={message} />,
        },
        {
          path: "/arbitrary",
          element: <ArbitraryRoute />,
        },
      ]);

      render(<RouterProvider router={router} />);

      expect(
        screen.getByRole("heading", { name: "Prompt Route" })
      ).toBeInTheDocument();

      const windowConfirmMock = jest
        .spyOn(window, "confirm")
        .mockImplementationOnce(() => false);

      act(() => {
        screen
          .getByRole("link", { name: "Navigate to arbitrary route" })
          .click();
      });

      expect(windowConfirmMock).not.toHaveBeenCalled();

      expect(
        screen.getByRole("heading", { name: "Arbitrary Route" })
      ).toBeInTheDocument();
    });
  });
});
