import React from 'react';
import { create as createTestRenderer } from 'react-test-renderer';
import { MemoryRouter as Router, Routes, Route, useHref } from 'react-router';

describe('useHref under a <Routes basename>', () => {
  describe('to a child route', () => {
    it('returns the correct href', () => {
      let href;
      function Admin() {
        href = useHref('invoices');
        return <h1>Admin</h1>;
      }

      createTestRenderer(
        <Router initialEntries={['/app/admin']}>
          <Routes basename="app">
            <Route path="admin" element={<Admin />} />
          </Routes>
        </Router>
      );

      expect(href).toBe('/app/admin/invoices');
    });

    describe('when the URL has a trailing slash', () => {
      it('returns the correct href', () => {
        let href;
        function Admin() {
          href = useHref('invoices');
          return <h1>Admin</h1>;
        }

        createTestRenderer(
          <Router initialEntries={['/app/admin/']}>
            <Routes basename="app">
              <Route path="admin" element={<Admin />} />
            </Routes>
          </Router>
        );

        expect(href).toBe('/app/admin/invoices');
      });
    });

    describe('when the href has a trailing slash', () => {
      it('returns the correct href', () => {
        let href;
        function Admin() {
          href = useHref('invoices/');
          return <h1>Admin</h1>;
        }

        createTestRenderer(
          <Router initialEntries={['/app/admin']}>
            <Routes basename="app">
              <Route path="admin" element={<Admin />} />
            </Routes>
          </Router>
        );

        expect(href).toBe('/app/admin/invoices/');
      });
    });
  });

  describe('to a sibling route', () => {
    it('returns the correct href', () => {
      let href;
      function Admin() {
        href = useHref('../dashboard');
        return <h1>Admin</h1>;
      }

      createTestRenderer(
        <Router initialEntries={['/app/admin']}>
          <Routes basename="app">
            <Route path="admin" element={<Admin />} />
          </Routes>
        </Router>
      );

      expect(href).toBe('/app/dashboard');
    });

    describe('when the URL has a trailing slash', () => {
      it('returns the correct href', () => {
        let href;
        function Admin() {
          href = useHref('../dashboard');
          return <h1>Admin</h1>;
        }

        createTestRenderer(
          <Router initialEntries={['/app/admin/']}>
            <Routes basename="app">
              <Route path="admin" element={<Admin />} />
            </Routes>
          </Router>
        );

        expect(href).toBe('/app/dashboard');
      });
    });

    describe('when the href has a trailing slash', () => {
      it('returns the correct href', () => {
        let href;
        function Admin() {
          href = useHref('../dashboard/');
          return <h1>Admin</h1>;
        }

        createTestRenderer(
          <Router initialEntries={['/app/admin']}>
            <Routes basename="app">
              <Route path="admin" element={<Admin />} />
            </Routes>
          </Router>
        );

        expect(href).toBe('/app/dashboard/');
      });
    });
  });

  describe('to a parent route', () => {
    it('returns the correct href', () => {
      let href;
      function Admin() {
        href = useHref('..');
        return <h1>Admin</h1>;
      }

      createTestRenderer(
        <Router initialEntries={['/app/admin']}>
          <Routes basename="app">
            <Route path="admin" element={<Admin />} />
          </Routes>
        </Router>
      );

      expect(href).toBe('/app');
    });

    describe('when the URL has a trailing slash', () => {
      it('returns the correct href', () => {
        let href;
        function Admin() {
          href = useHref('..');
          return <h1>Admin</h1>;
        }

        createTestRenderer(
          <Router initialEntries={['/app/admin/']}>
            <Routes basename="app">
              <Route path="admin" element={<Admin />} />
            </Routes>
          </Router>
        );

        expect(href).toBe('/app');
      });
    });

    describe('when the href has a trailing slash', () => {
      it('returns the correct href', () => {
        let href;
        function Admin() {
          href = useHref('../');
          return <h1>Admin</h1>;
        }

        createTestRenderer(
          <Router initialEntries={['/app/admin']}>
            <Routes basename="app">
              <Route path="admin" element={<Admin />} />
            </Routes>
          </Router>
        );

        expect(href).toBe('/app/');
      });
    });
  });

  describe('with a to value that has more .. segments than the current URL', () => {
    it('returns the correct href', () => {
      let href;
      function Admin() {
        href = useHref('../../../dashboard');
        return <h1>Admin</h1>;
      }

      createTestRenderer(
        <Router initialEntries={['/app/admin']}>
          <Routes basename="app">
            <Route path="admin" element={<Admin />} />
          </Routes>
        </Router>
      );

      expect(href).toBe('/dashboard');
    });

    describe('and no additional segments', () => {
      it('returns the correct href', () => {
        let href;
        function Admin() {
          href = useHref('../../..');
          return <h1>Admin</h1>;
        }

        createTestRenderer(
          <Router initialEntries={['/app/admin']}>
            <Routes basename="app">
              <Route path="admin" element={<Admin />} />
            </Routes>
          </Router>
        );

        expect(href).toBe('/');
      });
    });

    describe('when the URL has a trailing slash', () => {
      it('returns the correct href', () => {
        let href;
        function Admin() {
          href = useHref('../../../dashboard');
          return <h1>Admin</h1>;
        }

        createTestRenderer(
          <Router initialEntries={['/app/admin/']}>
            <Routes basename="app">
              <Route path="admin" element={<Admin />} />
            </Routes>
          </Router>
        );

        expect(href).toBe('/dashboard');
      });
    });

    describe('when the href has a trailing slash', () => {
      it('returns the correct href', () => {
        let href;
        function Admin() {
          href = useHref('../../../dashboard/');
          return <h1>Admin</h1>;
        }

        createTestRenderer(
          <Router initialEntries={['/app/admin']}>
            <Routes basename="app">
              <Route path="admin" element={<Admin />} />
            </Routes>
          </Router>
        );

        expect(href).toBe('/dashboard/');
      });
    });
  });
});
