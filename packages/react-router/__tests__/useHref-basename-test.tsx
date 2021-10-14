import * as React from "react";
import { create as createTestRenderer } from "react-test-renderer";
import { MemoryRouter, Routes, Route, useHref } from "react-router";

describe("useHref under a basename", () => {
  describe("to a child route", () => {
    it("returns the correct href", () => {
      let href = "";
      function Admin() {
        href = useHref("invoices");
        return <h1>Admin</h1>;
      }

      createTestRenderer(
        <MemoryRouter basename="/app" initialEntries={["/app/admin"]}>
          <Routes>
            <Route path="admin" element={<Admin />} />
          </Routes>
        </MemoryRouter>
      );

      expect(href).toBe("/app/admin/invoices");
    });

    describe("when the URL has a trailing slash", () => {
      it("returns the correct href", () => {
        let href = "";
        function Admin() {
          href = useHref("invoices");
          return <h1>Admin</h1>;
        }

        createTestRenderer(
          <MemoryRouter basename="/app" initialEntries={["/app/admin/"]}>
            <Routes>
              <Route path="admin" element={<Admin />} />
            </Routes>
          </MemoryRouter>
        );

        expect(href).toBe("/app/admin/invoices");
      });
    });

    describe("when the href has a trailing slash", () => {
      it("returns the correct href", () => {
        let href = "";
        function Admin() {
          href = useHref("invoices/");
          return <h1>Admin</h1>;
        }

        createTestRenderer(
          <MemoryRouter basename="/app" initialEntries={["/app/admin"]}>
            <Routes>
              <Route path="admin" element={<Admin />} />
            </Routes>
          </MemoryRouter>
        );

        expect(href).toBe("/app/admin/invoices/");
      });
    });
  });

  describe("to a sibling route", () => {
    it("returns the correct href", () => {
      let href = "";
      function Admin() {
        href = useHref("../dashboard");
        return <h1>Admin</h1>;
      }

      createTestRenderer(
        <MemoryRouter basename="/app" initialEntries={["/app/admin"]}>
          <Routes>
            <Route path="admin" element={<Admin />} />
          </Routes>
        </MemoryRouter>
      );

      expect(href).toBe("/app/dashboard");
    });

    describe("when the URL has a trailing slash", () => {
      it("returns the correct href", () => {
        let href = "";
        function Admin() {
          href = useHref("../dashboard");
          return <h1>Admin</h1>;
        }

        createTestRenderer(
          <MemoryRouter basename="/app" initialEntries={["/app/admin/"]}>
            <Routes>
              <Route path="admin" element={<Admin />} />
            </Routes>
          </MemoryRouter>
        );

        expect(href).toBe("/app/dashboard");
      });
    });

    describe("when the href has a trailing slash", () => {
      it("returns the correct href", () => {
        let href = "";
        function Admin() {
          href = useHref("../dashboard/");
          return <h1>Admin</h1>;
        }

        createTestRenderer(
          <MemoryRouter basename="/app" initialEntries={["/app/admin"]}>
            <Routes>
              <Route path="admin" element={<Admin />} />
            </Routes>
          </MemoryRouter>
        );

        expect(href).toBe("/app/dashboard/");
      });
    });
  });

  describe("to a parent route", () => {
    it("returns the correct href", () => {
      let href = "";
      function Admin() {
        href = useHref("..");
        return <h1>Admin</h1>;
      }

      createTestRenderer(
        <MemoryRouter basename="/app" initialEntries={["/app/admin"]}>
          <Routes>
            <Route path="admin" element={<Admin />} />
          </Routes>
        </MemoryRouter>
      );

      expect(href).toBe("/app");
    });

    describe("when the URL has a trailing slash", () => {
      it("returns the correct href", () => {
        let href = "";
        function Admin() {
          href = useHref("..");
          return <h1>Admin</h1>;
        }

        createTestRenderer(
          <MemoryRouter basename="/app" initialEntries={["/app/admin/"]}>
            <Routes>
              <Route path="admin" element={<Admin />} />
            </Routes>
          </MemoryRouter>
        );

        expect(href).toBe("/app");
      });
    });

    describe("when the href has a trailing slash", () => {
      it("returns the correct href", () => {
        let href = "";
        function Admin() {
          href = useHref("../");
          return <h1>Admin</h1>;
        }

        createTestRenderer(
          <MemoryRouter basename="/app" initialEntries={["/app/admin"]}>
            <Routes>
              <Route path="admin" element={<Admin />} />
            </Routes>
          </MemoryRouter>
        );

        expect(href).toBe("/app/");
      });
    });
  });

  describe("with a to value that has more .. segments than the current URL", () => {
    it("returns the correct href", () => {
      let href = "";
      function Admin() {
        href = useHref("../../../dashboard");
        return <h1>Admin</h1>;
      }

      createTestRenderer(
        <MemoryRouter basename="/app" initialEntries={["/app/admin"]}>
          <Routes>
            <Route path="admin" element={<Admin />} />
          </Routes>
        </MemoryRouter>
      );

      // This is correct because the basename works like a chroot "jail".
      // Relative <Link to> values cannot "escape" into a higher level URL since
      // they would be linking to a URL that the <Router> cannot render. To link
      // to a higher URL path, use a plain <a>.
      expect(href).toBe("/app/dashboard");
    });

    describe("and no additional segments", () => {
      it("returns the correct href", () => {
        let href = "";
        function Admin() {
          href = useHref("../../..");
          return <h1>Admin</h1>;
        }

        createTestRenderer(
          <MemoryRouter basename="/app" initialEntries={["/app/admin"]}>
            <Routes>
              <Route path="admin" element={<Admin />} />
            </Routes>
          </MemoryRouter>
        );

        // This is correct because the basename works like a chroot "jail".
        // Relative <Link to> values cannot "escape" into a higher level URL
        // since they would be linking to a URL that the <Router> cannot render.
        // To link to a higher URL path, use a plain <a>.
        expect(href).toBe("/app");
      });
    });

    describe("when the URL has a trailing slash", () => {
      it("returns the correct href", () => {
        let href = "";
        function Admin() {
          href = useHref("../../../dashboard");
          return <h1>Admin</h1>;
        }

        createTestRenderer(
          <MemoryRouter basename="/app" initialEntries={["/app/admin/"]}>
            <Routes>
              <Route path="admin" element={<Admin />} />
            </Routes>
          </MemoryRouter>
        );

        // This is correct because the basename works like a chroot "jail".
        // Relative <Link to> values cannot "escape" into a higher level URL
        // since they would be linking to a URL that the <Router> cannot render.
        // To link to a higher URL path, use a plain <a>.
        expect(href).toBe("/app/dashboard");
      });
    });

    describe("when the href has a trailing slash", () => {
      it("returns the correct href", () => {
        let href = "";
        function Admin() {
          href = useHref("../../../dashboard/");
          return <h1>Admin</h1>;
        }

        createTestRenderer(
          <MemoryRouter basename="/app" initialEntries={["/app/admin"]}>
            <Routes>
              <Route path="admin" element={<Admin />} />
            </Routes>
          </MemoryRouter>
        );

        expect(href).toBe("/app/dashboard/");
      });
    });
  });
});
