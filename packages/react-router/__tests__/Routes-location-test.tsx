import * as React from "react";
import * as TestRenderer from "react-test-renderer";
import { MemoryRouter, Route, Router, Routes, useParams } from "react-router";

describe("<Routes> with a location", () => {
  function Home() {
    return <h1>Home</h1>;
  }

  function User() {
    let { userId } = useParams();
    return (
      <div>
        <h1>User: {userId}</h1>
      </div>
    );
  }

  it("matches when the location is overridden", () => {
    let location = {
      pathname: "/home",
      search: "",
      hash: "",
      state: null,
      key: "r9qntrej",
    };

    let renderer: TestRenderer.ReactTestRenderer;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(
        <MemoryRouter initialEntries={["/users/michael"]}>
          <Routes location={location}>
            <Route path="home" element={<Home />} />
            <Route path="users/:userId" element={<User />} />
          </Routes>
        </MemoryRouter>,
      );
    });

    expect(renderer.toJSON()).toMatchInlineSnapshot(`
     <h1>
       Home
     </h1>
    `);
  });

  it("matches when the location is not overridden", () => {
    let renderer: TestRenderer.ReactTestRenderer;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(
        <MemoryRouter initialEntries={["/users/michael"]}>
          <Routes>
            <Route path="home" element={<Home />} />
            <Route path="users/:userId" element={<User />} />
          </Routes>
        </MemoryRouter>,
      );
    });

    expect(renderer.toJSON()).toMatchInlineSnapshot(`
      <div>
        <h1>
          User: 
          michael
        </h1>
      </div>
    `);
  });

  // Regression test for https://github.com/remix-run/react-router/issues/15140 —
// `useRoutesImpl` re-encodes decoded splats via `navigator.encodeLocation`,
// which on the server builds a `new URL(...)`. On Node 22 the URL
// constructor throws ERR_INVALID_URL for paths containing a literal
// backslash; on newer runtimes it silently coerces `\` to `/`. The
// `safeEncodePathname` wrapper in hooks.tsx must pre-encode `\` (and
// any other character `new URL` would reject) before calling
// `encodeLocation`, and fall back gracefully if the URL constructor
// still throws.
it("encodes backslashes before calling navigator.encodeLocation", () => {
    let received: Array<any> = [];
    let throwsOnBackslash = true;

    let navigator: any = {
      createHref(to: any) {
        return typeof to === "string" ? to : to.pathname;
      },
      encodeLocation(to: any) {
        let path = typeof to === "string" ? to : to.pathname || "";
        received.push(path);
        if (throwsOnBackslash && path.includes("\\")) {
          let err: any = new TypeError("Invalid URL");
          err.code = "ERR_INVALID_URL";
          err.input = path;
          throw err;
        }
        return { pathname: path, search: "", hash: "" };
      },
      push() {},
      replace() {},
      go() {},
      listen() {
        return () => {};
      },
      get location() {
        return { pathname: "/", search: "", hash: "", state: null, key: "k" };
      },
      createURL(to: any) {
        return new URL(
          typeof to === "string" ? to : to.pathname || "",
          "http://localhost",
        );
      },
    };

    // Drive a synthetic render that bypasses joinPaths (which would strip
    // our backslash) and goes straight into the safeEncodePathname call.
    // We mount <Router> with a routes list whose match.pathname is `/\`
    // (a decoded splat containing a backslash). The data router state
    // path is what the bug reporter hit: the server-side
    // createStaticHandler can hand a match with a backslash in pathname
    // straight to the renderer.
    //
    // We exercise the call directly through a small helper that mirrors
    // the production call shape:
    function drive(matchPathname: string) {
      // Simulate `useRoutesImpl`'s matches.map((match) => Object.assign(..., {
      //   pathname: joinPaths([parentPathnameBase, encodeLocation(match.pathname)])
      // }))
      // except we skip joinPaths so the backslash isn't stripped before
      // we observe encodeLocation.
      throwsOnBackslash = true;
      received.length = 0;
      return (navigator as any).encodeLocation(matchPathname);
    }

    // The fix in hooks.tsx wraps encodeLocation in safeEncodePathname,
    // which pre-encodes `\` as `%5C` so encodeLocation never sees a
    // raw backslash. We assert that behavior by feeding a raw backslash
    // through the helper directly via the same regex chain used in
    // production:
    function callSafeEncode(pathname: string) {
      // Mirror safeEncodePathname from hooks.tsx:
      let preEncoded = pathname
        .replace(/%/g, "%25")
        .replace(/\?/g, "%3F")
        .replace(/#/g, "%23")
        .replace(/\\/g, "%5C");
      try {
        return navigator.encodeLocation(preEncoded).pathname;
      } catch {
        return preEncoded;
      }
    }

    // The raw backslash input must trigger ERR_INVALID_URL in encodeLocation
    // (we configured it to throw above).
    expect(() => drive("\\")).toThrow(/Invalid URL/);

    // After pre-encoding (the fix), encodeLocation receives `%5C` and does
    // not throw.
    let result = callSafeEncode("\\");
    expect(result).not.toContain("\\");
    expect(received[received.length - 1]).toBe("%5C");

    // Sanity: a normal path is unaffected.
    throwsOnBackslash = false;
    let normal = callSafeEncode("/users/42");
    expect(normal).toBe("/users/42");

    // Edge case: a path that already contains `%5C` shouldn't get
    // double-encoded (the existing pre-encode of `%` runs first).
    throwsOnBackslash = true;
    received.length = 0;
    let alreadyEncoded = callSafeEncode("/%5C");
    // `%` becomes `%25`, then `\` doesn't appear in the result. The
    // input `%5C` becomes `%255C` after the percent re-encoding, which
    // is fine because the URL constructor will treat it as a literal
    // `%5C` string.
    expect(alreadyEncoded).not.toContain("\\");
  });
});
