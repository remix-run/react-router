import * as React from 'react';
import { act, create as createTestRenderer } from 'react-test-renderer';
import { MemoryRouter as Router, Routes, Route, Link } from 'react-router-dom';

describe('Link href', () => {
  describe('absolute', () => {
    it('is correct', () => {
      function Home() {
        return (
          <div>
            <h1>Home</h1>
            <Link to="/about">About</Link>
          </div>
        );
      }

      let renderer;
      act(() => {
        renderer = createTestRenderer(
          <Router initialEntries={['/home']}>
            <Routes>
              <Route path="home" element={<Home />} />
            </Routes>
          </Router>
        );
      });

      let anchor = renderer.root.findByType('a');

      expect(anchor).not.toBeNull();
      expect(anchor.props.href).toEqual('/about');
    });
  });

  describe('relative self', () => {
    it('is correct', () => {
      function Home() {
        return (
          <div>
            <h1>Home</h1>
            <Link to=".">Home</Link>
          </div>
        );
      }

      let renderer;
      act(() => {
        renderer = createTestRenderer(
          <Router initialEntries={['/home']}>
            <Routes>
              <Route path="home" element={<Home />} />
            </Routes>
          </Router>
        );
      });

      let anchor = renderer.root.findByType('a');

      expect(anchor).not.toBeNull();
      expect(anchor.props.href).toEqual('/home');
    });
  });

  describe('relative sibling', () => {
    it('is correct', () => {
      function Home() {
        return (
          <div>
            <h1>Home</h1>
            <Link to="../about">About</Link>
          </div>
        );
      }

      let renderer;
      act(() => {
        renderer = createTestRenderer(
          <Router initialEntries={['/home']}>
            <Routes>
              <Route path="home" element={<Home />} />
            </Routes>
          </Router>
        );
      });

      let anchor = renderer.root.findByType('a');

      expect(anchor).not.toBeNull();
      expect(anchor.props.href).toEqual('/about');
    });
  });

  describe('relative with more .. segments than are in the URL', () => {
    it('is correct', () => {
      function Home() {
        return (
          <div>
            <h1>Home</h1>
            <Link to="../../about">About</Link>
          </div>
        );
      }

      let renderer;
      act(() => {
        renderer = createTestRenderer(
          <Router initialEntries={['/home']}>
            <Routes>
              <Route path="home" element={<Home />} />
            </Routes>
          </Router>
        );
      });

      let anchor = renderer.root.findByType('a');

      expect(anchor).not.toBeNull();
      expect(anchor.props.href).toEqual('/about');
    });
  });
});
