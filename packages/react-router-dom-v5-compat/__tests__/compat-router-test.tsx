/**
 * @jest-environment node
 */
import * as React from "react";
import * as ReactDOMServer from "react-dom/server";
import { act } from "react-dom/test-utils";
import { CompatRouter, Routes } from "../index";

// Have to mock react-router-dom to have a comparable API to v5, otherwise it will
// be using v6's API and fail
jest.mock("react-router-dom", () => ({
  useHistory: () => ({ location: "/" }),
}));

describe("CompatRouter", () => {
  it("should not warn about useLayoutEffect when server side rendering", () => {
    const consoleErrorSpy = jest.spyOn(console, "error");

    act(() => {
      ReactDOMServer.renderToStaticMarkup(
        <CompatRouter>
          <Routes />
        </CompatRouter>
      );
    });

    expect(consoleErrorSpy).toHaveBeenCalledTimes(0);
    consoleErrorSpy.mockRestore();
  });
});
