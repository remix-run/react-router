import * as React from "react";
import * as ReactDOMServer from "react-dom/server";
import { Navigate, Routes, Route } from "react-router-dom";
import { StaticRouter } from "react-router-dom/server";

describe("A <Navigate> in a <StaticRouter>", () => {
  let consoleWarn: jest.SpyInstance;
  beforeEach(() => {
    consoleWarn = jest.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleWarn.mockRestore();
  });

  it("warns about using on the initial render", () => {
    ReactDOMServer.renderToStaticMarkup(
      <StaticRouter location="/home">
        <Routes>
          <Route
            path="/home"
            element={<Navigate to="/somewhere-else?the=query" />}
          />
        </Routes>
      </StaticRouter>
    );

    expect(consoleWarn).toHaveBeenCalledWith(
      expect.stringMatching("<Navigate> must not be used on the initial render")
    );
  });
});
