import * as React from "react";
import * as TestRenderer from "react-test-renderer";
import { MemoryRouter, Routes, Route } from "react-router";

describe("<Router basename>", () => {
  let consoleWarn: jest.SpyInstance;
  beforeEach(() => {
    consoleWarn = jest.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleWarn.mockRestore();
  });

  it("renders null and issues a warning when the URL does not match the basename", () => {
    let renderer: TestRenderer.ReactTestRenderer;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(
        <MemoryRouter basename="/app" initialEntries={["/home"]}>
          <Routes>
            <Route path="/" element={<h1>App</h1>} />
          </Routes>
        </MemoryRouter>
      );
    });

    expect(renderer.toJSON()).toBeNull();
    expect(consoleWarn).toHaveBeenCalledTimes(1);
    expect(consoleWarn).toHaveBeenCalledWith(
      expect.stringContaining("<Router> won't render anything")
    );
  });

  it("renders the first route that matches the URL", () => {
    let renderer: TestRenderer.ReactTestRenderer;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(
        <MemoryRouter basename="/home" initialEntries={["/home"]}>
          <Routes>
            <Route path="/" element={<h1>Home</h1>} />
          </Routes>
        </MemoryRouter>
      );
    });

    expect(renderer.toJSON()).toMatchInlineSnapshot(`
      <h1>
        Home
      </h1>
    `);
  });

  it("does not render a 2nd route that also matches the URL", () => {
    let renderer: TestRenderer.ReactTestRenderer;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(
        <MemoryRouter basename="/app" initialEntries={["/app/home"]}>
          <Routes>
            <Route path="home" element={<h1>Home</h1>} />
            <Route path="home" element={<h1>Something else</h1>} />
          </Routes>
        </MemoryRouter>
      );
    });

    expect(renderer.toJSON()).toMatchInlineSnapshot(`
      <h1>
        Home
      </h1>
    `);
  });

  it("matches regardless of basename casing", () => {
    let renderer: TestRenderer.ReactTestRenderer;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(
        <MemoryRouter basename="/HoME" initialEntries={["/home"]}>
          <Routes>
            <Route path="/" element={<h1>Home</h1>} />
          </Routes>
        </MemoryRouter>
      );
    });

    expect(renderer.toJSON()).toMatchInlineSnapshot(`
      <h1>
        Home
      </h1>
    `);
  });

  it("matches regardless of URL casing", () => {
    let renderer: TestRenderer.ReactTestRenderer;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(
        <MemoryRouter basename="/home" initialEntries={["/hOmE"]}>
          <Routes>
            <Route path="/" element={<h1>Home</h1>} />
          </Routes>
        </MemoryRouter>
      );
    });

    expect(renderer.toJSON()).toMatchInlineSnapshot(`
      <h1>
        Home
      </h1>
    `);
  });
});
