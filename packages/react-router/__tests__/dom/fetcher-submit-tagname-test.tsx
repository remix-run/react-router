import * as React from "react";
import { render, fireEvent, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { RouterProvider, createBrowserRouter, useFetcher } from "../../index";
import getWindow from "../utils/getWindow";

describe("fetcher.submit with tagName property", () => {
  it("should handle plain object with tagName property", async () => {
    let actionSpy = jest.fn();
    actionSpy.mockReturnValue({ ok: true });

    let router = createBrowserRouter(
      [
        {
          path: "/",
          action: actionSpy,
          Component() {
            let fetcher = useFetcher();
            return (
              <button
                onClick={() =>
                  fetcher.submit(
                    { tagName: "div", data: "test" },
                    { method: "post" },
                  )
                }
              >
                Submit
              </button>
            );
          },
        },
      ],
      {
        window: getWindow("/"),
      },
    );

    render(<RouterProvider router={router} />);
    fireEvent.click(screen.getByText("Submit"));

    expect(actionSpy).toHaveBeenCalled();
    let formData = await actionSpy.mock.calls[0][0].request.formData();
    expect(formData.get("tagName")).toBe("div");
    expect(formData.get("data")).toBe("test");
  });

  it("should handle plain object with various HTML element-like properties", async () => {
    let actionSpy = jest.fn();
    actionSpy.mockReturnValue({ ok: true });

    let router = createBrowserRouter(
      [
        {
          path: "/",
          action: actionSpy,
          Component() {
            let fetcher = useFetcher();
            return (
              <button
                onClick={() =>
                  fetcher.submit(
                    {
                      tagName: "button",
                      className: "test-class",
                      id: "test-id",
                      value: "test-value",
                    },
                    { method: "post" },
                  )
                }
              >
                Submit
              </button>
            );
          },
        },
      ],
      {
        window: getWindow("/"),
      },
    );

    render(<RouterProvider router={router} />);
    fireEvent.click(screen.getByText("Submit"));

    expect(actionSpy).toHaveBeenCalled();
    let formData = await actionSpy.mock.calls[0][0].request.formData();
    expect(formData.get("tagName")).toBe("button");
    expect(formData.get("className")).toBe("test-class");
    expect(formData.get("id")).toBe("test-id");
    expect(formData.get("value")).toBe("test-value");
  });
});
