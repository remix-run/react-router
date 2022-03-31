import * as React from "react";
import * as TestRenderer from "react-test-renderer";
import { MemoryRouter, Routes, Route, Outlet } from "react-router";

function App() {
  return (
    <div>
      App
      <Outlet />
    </div>
  );
}

function Home() {
  return <>Home</>;
}

function About() {
  return <>About</>;
}

function NotFound() {
  return <>Not Found</>;
}

function PageLayout() {
  return (
    <div>
      PageLayout
      <Outlet />
    </div>
  );
}

function Login() {
  return <>Login</>;
}

describe("<Routes>", () => {
  [
    <Routes>
      <Route path="/" element={<App />}>
        <Route index element={<Home />} />
        <Route path="about" element={<About />} />
        <Route path="*" element={<NotFound />} />
      </Route>
      <Route path="/" element={<PageLayout />}>
        <Route path="login" element={<Login />} />
      </Route>
    </Routes>,
    <Routes>
      <Route path="/" element={<App />}>
        <Route index element={<Home />} />
        <Route path="about" element={<About />} />
        <Route path="*" element={<NotFound />} />
      </Route>
      <Route element={<PageLayout />}>
        <Route path="login" element={<Login />} />
      </Route>
    </Routes>,
    <Routes>
      <Route element={<App />}>
        <Route index element={<Home />} />
        <Route path="about" element={<About />} />
        <Route path="*" element={<NotFound />} />
      </Route>
      <Route path="/" element={<PageLayout />}>
        <Route path="login" element={<Login />} />
      </Route>
    </Routes>,
    <Routes>
      <Route element={<App />}>
        <Route index element={<Home />} />
        <Route path="about" element={<About />} />
        <Route path="*" element={<NotFound />} />
      </Route>
      <Route element={<PageLayout />}>
        <Route path="login" element={<Login />} />
      </Route>
    </Routes>,
  ].forEach((routes) => {
    it("home", () => {
      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(
          <MemoryRouter initialEntries={["/"]}>{routes}</MemoryRouter>
        );
      });

      expect(renderer.toJSON()).toMatchInlineSnapshot(`
    <div>
      App
      Home
    </div>
  `);
    });

    it("about", () => {
      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(
          <MemoryRouter initialEntries={["/about"]}>{routes}</MemoryRouter>
        );
      });

      expect(renderer.toJSON()).toMatchInlineSnapshot(`
    <div>
      App
      About
    </div>
  `);
    });

    it("not found", () => {
      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(
          <MemoryRouter initialEntries={["/not-found"]}>{routes}</MemoryRouter>
        );
      });

      expect(renderer.toJSON()).toMatchInlineSnapshot(`
    <div>
      App
      Not Found
    </div>
  `);
    });

    it("login", () => {
      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(
          <MemoryRouter initialEntries={["/login"]}>{routes}</MemoryRouter>
        );
      });

      expect(renderer.toJSON()).toMatchInlineSnapshot(`
    <div>
      PageLayout
      Login
    </div>
  `);
    });
  });
});
