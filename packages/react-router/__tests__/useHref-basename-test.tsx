import * as React from "react";
import * as TestRenderer from "react-test-renderer";
import { MemoryRouter, Routes, Route, useHref } from "react-router";

function ShowHref({ to }: { to: string }) {
  return <p>{useHref(to)}</p>;
}

describe("useHref under a basename", () => {
  describe("to an absolute route", () => {
    it("returns the correct href", () => {
      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(
          <MemoryRouter basename="/app" initialEntries={["/app/admin"]}>
            <Routes>
              <Route path="admin" element={<ShowHref to="/invoices" />} />
            </Routes>
          </MemoryRouter>
        );
      });

      expect(renderer.toJSON()).toMatchInlineSnapshot(`
        <p>
          /app/invoices
        </p>
      `);
    });
  });

  describe("to a child route", () => {
    it("returns the correct href", () => {
      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(
          <MemoryRouter basename="/app" initialEntries={["/app/admin"]}>
            <Routes>
              <Route path="admin" element={<ShowHref to="invoices" />} />
            </Routes>
          </MemoryRouter>
        );
      });

      expect(renderer.toJSON()).toMatchInlineSnapshot(`
        <p>
          /app/admin/invoices
        </p>
      `);
    });

    describe("when the URL has a trailing slash", () => {
      it("returns the correct href", () => {
        let renderer: TestRenderer.ReactTestRenderer;
        TestRenderer.act(() => {
          renderer = TestRenderer.create(
            <MemoryRouter basename="/app" initialEntries={["/app/admin/"]}>
              <Routes>
                <Route path="admin" element={<ShowHref to="invoices" />} />
              </Routes>
            </MemoryRouter>
          );
        });

        expect(renderer.toJSON()).toMatchInlineSnapshot(`
          <p>
            /app/admin/invoices
          </p>
        `);
      });
    });

    describe("when the href has a trailing slash", () => {
      it("returns the correct href", () => {
        let renderer: TestRenderer.ReactTestRenderer;
        TestRenderer.act(() => {
          renderer = TestRenderer.create(
            <MemoryRouter basename="/app" initialEntries={["/app/admin"]}>
              <Routes>
                <Route path="admin" element={<ShowHref to="invoices/" />} />
              </Routes>
            </MemoryRouter>
          );
        });

        expect(renderer.toJSON()).toMatchInlineSnapshot(`
          <p>
            /app/admin/invoices/
          </p>
        `);
      });
    });
  });

  describe("to a sibling route", () => {
    it("returns the correct href", () => {
      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(
          <MemoryRouter basename="/app" initialEntries={["/app/admin"]}>
            <Routes>
              <Route path="admin" element={<ShowHref to="../dashboard" />} />
            </Routes>
          </MemoryRouter>
        );
      });

      expect(renderer.toJSON()).toMatchInlineSnapshot(`
        <p>
          /app/dashboard
        </p>
      `);
    });

    describe("when the URL has a trailing slash", () => {
      it("returns the correct href", () => {
        let renderer: TestRenderer.ReactTestRenderer;
        TestRenderer.act(() => {
          renderer = TestRenderer.create(
            <MemoryRouter basename="/app" initialEntries={["/app/admin/"]}>
              <Routes>
                <Route path="admin" element={<ShowHref to="../dashboard" />} />
              </Routes>
            </MemoryRouter>
          );
        });

        expect(renderer.toJSON()).toMatchInlineSnapshot(`
          <p>
            /app/dashboard
          </p>
        `);
      });
    });

    describe("when the href has a trailing slash", () => {
      it("returns the correct href", () => {
        let renderer: TestRenderer.ReactTestRenderer;
        TestRenderer.act(() => {
          renderer = TestRenderer.create(
            <MemoryRouter basename="/app" initialEntries={["/app/admin"]}>
              <Routes>
                <Route path="admin" element={<ShowHref to="../dashboard/" />} />
              </Routes>
            </MemoryRouter>
          );
        });

        expect(renderer.toJSON()).toMatchInlineSnapshot(`
          <p>
            /app/dashboard/
          </p>
        `);
      });
    });
  });

  describe("to a parent route", () => {
    it("returns the correct href", () => {
      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(
          <MemoryRouter basename="/app" initialEntries={["/app/admin"]}>
            <Routes>
              <Route path="admin" element={<ShowHref to=".." />} />
            </Routes>
          </MemoryRouter>
        );
      });

      expect(renderer.toJSON()).toMatchInlineSnapshot(`
        <p>
          /app
        </p>
      `);
    });

    describe("when the URL has a trailing slash", () => {
      it("returns the correct href", () => {
        let renderer: TestRenderer.ReactTestRenderer;
        TestRenderer.act(() => {
          renderer = TestRenderer.create(
            <MemoryRouter basename="/app" initialEntries={["/app/admin/"]}>
              <Routes>
                <Route path="admin" element={<ShowHref to=".." />} />
              </Routes>
            </MemoryRouter>
          );
        });

        expect(renderer.toJSON()).toMatchInlineSnapshot(`
          <p>
            /app
          </p>
        `);
      });
    });

    describe("when the href has a trailing slash", () => {
      it("returns the correct href", () => {
        let renderer: TestRenderer.ReactTestRenderer;
        TestRenderer.act(() => {
          renderer = TestRenderer.create(
            <MemoryRouter basename="/app" initialEntries={["/app/admin"]}>
              <Routes>
                <Route path="admin" element={<ShowHref to="../" />} />
              </Routes>
            </MemoryRouter>
          );
        });

        expect(renderer.toJSON()).toMatchInlineSnapshot(`
          <p>
            /app
          </p>
        `);
      });
    });
  });

  describe("with a to value that has more .. segments than the current URL", () => {
    it("returns the correct href", () => {
      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(
          <MemoryRouter basename="/app" initialEntries={["/app/admin"]}>
            <Routes>
              <Route
                path="admin"
                element={<ShowHref to="../../../dashboard" />}
              />
            </Routes>
          </MemoryRouter>
        );
      });

      // This is correct because the basename works like a chroot "jail".
      // Relative <Link to> values cannot "escape" into a higher level URL since
      // they would be linking to a URL that the <Router> cannot render. To link
      // to a higher URL path, use a plain <a>.
      expect(renderer.toJSON()).toMatchInlineSnapshot(`
        <p>
          /app/dashboard
        </p>
      `);
    });

    describe("and no additional segments", () => {
      it("returns the correct href", () => {
        let renderer: TestRenderer.ReactTestRenderer;
        TestRenderer.act(() => {
          renderer = TestRenderer.create(
            <MemoryRouter basename="/app" initialEntries={["/app/admin"]}>
              <Routes>
                <Route path="admin" element={<ShowHref to="../../.." />} />
              </Routes>
            </MemoryRouter>
          );
        });

        // This is correct because the basename works like a chroot "jail".
        // Relative <Link to> values cannot "escape" into a higher level URL
        // since they would be linking to a URL that the <Router> cannot render.
        // To link to a higher URL path, use a plain <a>.
        expect(renderer.toJSON()).toMatchInlineSnapshot(`
          <p>
            /app
          </p>
        `);
      });
    });

    describe("when the URL has a trailing slash", () => {
      it("returns the correct href", () => {
        let renderer: TestRenderer.ReactTestRenderer;
        TestRenderer.act(() => {
          renderer = TestRenderer.create(
            <MemoryRouter basename="/app" initialEntries={["/app/admin/"]}>
              <Routes>
                <Route
                  path="admin"
                  element={<ShowHref to="../../../dashboard" />}
                />
              </Routes>
            </MemoryRouter>
          );
        });

        // This is correct because the basename works like a chroot "jail".
        // Relative <Link to> values cannot "escape" into a higher level URL
        // since they would be linking to a URL that the <Router> cannot render.
        // To link to a higher URL path, use a plain <a>.
        expect(renderer.toJSON()).toMatchInlineSnapshot(`
          <p>
            /app/dashboard
          </p>
        `);
      });
    });

    describe("when the href has a trailing slash", () => {
      it("returns the correct href", () => {
        let renderer: TestRenderer.ReactTestRenderer;
        TestRenderer.act(() => {
          renderer = TestRenderer.create(
            <MemoryRouter basename="/app" initialEntries={["/app/admin"]}>
              <Routes>
                <Route
                  path="admin"
                  element={<ShowHref to="../../../dashboard/" />}
                />
              </Routes>
            </MemoryRouter>
          );
        });

        expect(renderer.toJSON()).toMatchInlineSnapshot(`
          <p>
            /app/dashboard/
          </p>
        `);
      });
    });
  });

  describe("after an update", () => {
    it("does not change", () => {
      let element = (
        <MemoryRouter basename="/app" initialEntries={["/app/admin"]}>
          <Routes>
            <Route path="admin" element={<ShowHref to="/invoices" />} />
          </Routes>
        </MemoryRouter>
      );

      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(element);
      });

      TestRenderer.act(() => {
        renderer.update(element);
      });

      expect(renderer.toJSON()).toMatchInlineSnapshot(`
        <p>
          /app/invoices
        </p>
      `);
    });
  });
});
