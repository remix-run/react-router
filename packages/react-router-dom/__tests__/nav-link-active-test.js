import * as React from 'react';
import { act, create as createTestRenderer } from 'react-test-renderer';
import {
  MemoryRouter as Router,
  Routes,
  Route,
  NavLink
} from 'react-router-dom';

describe('NavLink', () => {
  describe('when it does not match', () => {
    it('does not apply its activeClassName to the underlying <a>', () => {
      function Home() {
        return (
          <div>
            <NavLink to="somewhere-else" activeClassName="active" />
          </div>
        );
      }

      let renderer;
      act(() => {
        renderer = createTestRenderer(
          <Router initialEntries={['/home']}>
            <Routes>
              <Route path="/home" element={<Home />} />
            </Routes>
          </Router>
        );
      });

      let anchor = renderer.root.findByType('a');

      expect(anchor).not.toBeNull();
      expect(anchor.props.className).not.toMatch('active');
    });

    it('does not apply its activeStyle to the underlying <a>', () => {
      function Home() {
        return (
          <div>
            <NavLink
              to="somewhere-else"
              activeStyle={{ textTransform: 'uppercase' }}
            />
          </div>
        );
      }

      let renderer;
      act(() => {
        renderer = createTestRenderer(
          <Router initialEntries={['/home']}>
            <Routes>
              <Route path="/home" element={<Home />} />
            </Routes>
          </Router>
        );
      });

      let anchor = renderer.root.findByType('a');

      expect(anchor).not.toBeNull();
      expect(anchor.props.style).not.toMatchObject({
        textTransform: 'uppercase'
      });
    });
  });

  describe('when it matches', () => {
    it('applies its activeClassName to the underlying <a>', () => {
      function Home() {
        return (
          <div>
            <NavLink to="." activeClassName="active" />
          </div>
        );
      }

      let renderer;
      act(() => {
        renderer = createTestRenderer(
          <Router initialEntries={['/home']}>
            <Routes>
              <Route path="/home" element={<Home />} />
            </Routes>
          </Router>
        );
      });

      let anchor = renderer.root.findByType('a');

      expect(anchor).not.toBeNull();
      expect(anchor.props.className).toMatch('active');
    });

    it('applies its activeStyle to the underlying <a>', () => {
      function Home() {
        return (
          <div>
            <NavLink to="." activeStyle={{ textTransform: 'uppercase' }} />
          </div>
        );
      }

      let renderer;
      act(() => {
        renderer = createTestRenderer(
          <Router initialEntries={['/home']}>
            <Routes>
              <Route path="/home" element={<Home />} />
            </Routes>
          </Router>
        );
      });

      let anchor = renderer.root.findByType('a');

      expect(anchor).not.toBeNull();
      expect(anchor.props.style).toMatchObject({ textTransform: 'uppercase' });
    });
  });
});

describe('NavLink under a Routes with a basename', () => {
  describe('when it does not match', () => {
    it('does not apply its activeClassName to the underlying <a>', () => {
      function Home() {
        return (
          <div>
            <NavLink to="somewhere-else" activeClassName="active" />
          </div>
        );
      }

      let renderer;
      act(() => {
        renderer = createTestRenderer(
          <Router initialEntries={['/app/home']}>
            <Routes basename="app">
              <Route path="home" element={<Home />} />
            </Routes>
          </Router>
        );
      });

      let anchor = renderer.root.findByType('a');

      expect(anchor).not.toBeNull();
      expect(anchor.props.className).not.toMatch('active');
    });

    it('does not apply its activeStyle to the underlying <a>', () => {
      function Home() {
        return (
          <div>
            <NavLink
              to="somewhere-else"
              activeStyle={{ textTransform: 'uppercase' }}
            />
          </div>
        );
      }

      let renderer;
      act(() => {
        renderer = createTestRenderer(
          <Router initialEntries={['/app/home']}>
            <Routes basename="app">
              <Route path="home" element={<Home />} />
            </Routes>
          </Router>
        );
      });

      let anchor = renderer.root.findByType('a');

      expect(anchor).not.toBeNull();
      expect(anchor.props.style).not.toMatchObject({
        textTransform: 'uppercase'
      });
    });
  });

  describe('when it matches', () => {
    it('applies its activeClassName to the underlying <a>', () => {
      function Home() {
        return (
          <div>
            <NavLink to="." activeClassName="active" />
          </div>
        );
      }

      let renderer;
      act(() => {
        renderer = createTestRenderer(
          <Router initialEntries={['/app/home']}>
            <Routes basename="app">
              <Route path="home" element={<Home />} />
            </Routes>
          </Router>
        );
      });

      let anchor = renderer.root.findByType('a');

      expect(anchor).not.toBeNull();
      expect(anchor.props.className).toMatch('active');
    });

    it('applies its activeStyle to the underlying <a>', () => {
      function Home() {
        return (
          <div>
            <NavLink to="." activeStyle={{ textTransform: 'uppercase' }} />
          </div>
        );
      }

      let renderer;
      act(() => {
        renderer = createTestRenderer(
          <Router initialEntries={['/app/home']}>
            <Routes basename="app">
              <Route path="home" element={<Home />} />
            </Routes>
          </Router>
        );
      });

      let anchor = renderer.root.findByType('a');

      expect(anchor).not.toBeNull();
      expect(anchor.props.style).toMatchObject({ textTransform: 'uppercase' });
    });
  });
});
