import * as React from "react";
import * as TestRenderer from "react-test-renderer";
import { MemoryRouter, useLocation } from "react-router";

describe("<Router>", () => {
  let consoleError: jest.SpyInstance;
  beforeEach(() => {
    consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleError.mockRestore();
  });

  it("throws if another <Router> is already in context", () => {
    expect(() => {
      TestRenderer.create(
        <MemoryRouter>
          <MemoryRouter />
        </MemoryRouter>
      );
    }).toThrow(/cannot render a <Router> inside another <Router>/);

    expect(consoleError).toHaveBeenCalledTimes(1);
  });

  it("memoizes the current location", () => {
    let location1;
    function CaptureLocation1() {
      location1 = useLocation();
      return null;
    }

    let renderer: TestRenderer.ReactTestRenderer;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(
        <MemoryRouter>
          <CaptureLocation1 />
        </MemoryRouter>
      );
    });

    expect(location1).toBeDefined();

    let location2;
    function CaptureLocation2() {
      location2 = useLocation();
      return null;
    }

    TestRenderer.act(() => {
      renderer.update(
        <MemoryRouter>
          <CaptureLocation2 />
        </MemoryRouter>
      );
    });

    expect(location2).toBeDefined();
    expect(location1).toBe(location2);
  });
});
