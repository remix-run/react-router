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
            <NavLink to="somewhere-else" activeClassName="active">
              Somewhere else
            </NavLink>
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
            >
              Somewhere else
            </NavLink>
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

  describe('when it matches to the end', () => {
    it('applies its activeClassName to the underlying <a>', () => {
      function Home() {
        return (
          <div>
            <NavLink to="." activeClassName="active">
              Home
            </NavLink>
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
            <NavLink to="." activeStyle={{ textTransform: 'uppercase' }}>
              Home
            </NavLink>
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

  describe('when it matches just the beginning but not to the end', () => {
    describe('by default', () => {
      it('applies its activeClassName to the underlying <a>', () => {
        function Home() {
          return (
            <div>
              <NavLink to="." activeClassName="active">
                Home
              </NavLink>
            </div>
          );
        }

        function Child() {
          return <div>Child</div>;
        }

        let renderer;
        act(() => {
          renderer = createTestRenderer(
            <Router initialEntries={['/home/child']}>
              <Routes>
                <Route path="home" element={<Home />}>
                  <Route path="child" element={<Child />} />
                </Route>
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
              <NavLink to="." activeStyle={{ textTransform: 'uppercase' }}>
                Home
              </NavLink>
            </div>
          );
        }

        function Child() {
          return <div>Child</div>;
        }

        let renderer;
        act(() => {
          renderer = createTestRenderer(
            <Router initialEntries={['/home/child']}>
              <Routes>
                <Route path="home" element={<Home />}>
                  <Route path="child" element={<Child />} />
                </Route>
              </Routes>
            </Router>
          );
        });

        let anchor = renderer.root.findByType('a');

        expect(anchor).not.toBeNull();
        expect(anchor.props.style).toMatchObject({
          textTransform: 'uppercase'
        });
      });
    });

    describe('when end=true', () => {
      it('does not apply its activeClassName to the underlying <a>', () => {
        function Home() {
          return (
            <div>
              <NavLink to="." end={true} activeClassName="active">
                Home
              </NavLink>
            </div>
          );
        }

        function Child() {
          return <div>Child</div>;
        }

        let renderer;
        act(() => {
          renderer = createTestRenderer(
            <Router initialEntries={['/home/child']}>
              <Routes>
                <Route path="home" element={<Home />}>
                  <Route path="child" element={<Child />} />
                </Route>
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
                to="."
                end={true}
                activeStyle={{ textTransform: 'uppercase' }}
              >
                Home
              </NavLink>
            </div>
          );
        }

        function Child() {
          return <div>Child</div>;
        }

        let renderer;
        act(() => {
          renderer = createTestRenderer(
            <Router initialEntries={['/home/child']}>
              <Routes>
                <Route path="home" element={<Home />}>
                  <Route path="child" element={<Child />} />
                </Route>
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
  });

  describe('when its matches path that is a part of another link', () => {
    function Ham({ title }) {
      return (
        <section>
          <div>{title}</div>
        </section>
      );
    }

    function HamDetails({ title }) {
      return <section>{title} Details</section>;
    }

    function Home() {
      return (
        <div>
          <NavLink
            to="/hamburger"
            data-testid="hamburger"
            className="link"
            activeClassName="active"
          >
            Hamburger
          </NavLink>
          <NavLink
            to="/ham"
            data-testid="ham"
            className="link"
            activeClassName="active"
          >
            Ham
          </NavLink>
        </div>
      );
    }

    const getRoutes = (initialEntries) => (
      <Router initialEntries={initialEntries}>
        <Home />
        <Routes>
          <Route path="/hamburger" element={<Ham title="hamburger" />} />
          <Route
            path="/hamburger/details"
            element={<HamDetails title="hamburger" />}
          />
          <Route path="/ham" element={<Ham title="ham" />} />
          <Route path="/ham/details" element={<HamDetails title="ham" />} />
        </Routes>
      </Router>
    );

    it('applies its activeClassName to the underlying <a> that refers to hamburger', () => {
      let renderer;
      act(() => {
        renderer = createTestRenderer(getRoutes(['/hamburger/details']));
      });

      let anchorHamburger = renderer.root
        .findByProps({ to: '/hamburger' })
        .findByType('a');
      let anchorHam = renderer.root.findByProps({ to: '/ham' }).findByType('a');

      expect(anchorHamburger).not.toBeNull();
      expect(anchorHamburger.props.className).toMatch('active');
      expect(anchorHam).not.toBeNull();
      expect(anchorHam.props.className).not.toMatch('active');
    });

    it('applies its activeClassName to the underlying <a> that refers to ham', () => {
      let renderer;
      act(() => {
        renderer = createTestRenderer(getRoutes(['/ham/details']));
      });

      let anchorHamburger = renderer.root
        .findByProps({ to: '/hamburger' })
        .findByType('a');
      let anchorHam = renderer.root.findByProps({ to: '/ham' }).findByType('a');

      expect(anchorHamburger).not.toBeNull();
      expect(anchorHamburger.props.className).not.toMatch('active');
      expect(anchorHam).not.toBeNull();
      expect(anchorHam.props.className).toMatch('active');
    });
  });

  describe('when it matches without matching case', () => {
    describe('by default', () => {
      it('applies its activeClassName to the underlying <a>', () => {
        function Home() {
          return (
            <div>
              <NavLink to="." activeClassName="active">
                Home
              </NavLink>
            </div>
          );
        }

        let renderer;
        act(() => {
          renderer = createTestRenderer(
            <Router initialEntries={['/Home']}>
              <Routes>
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
              <NavLink to="." activeStyle={{ textTransform: 'uppercase' }}>
                Home
              </NavLink>
            </div>
          );
        }

        let renderer;
        act(() => {
          renderer = createTestRenderer(
            <Router initialEntries={['/Home']}>
              <Routes>
                <Route path="home" element={<Home />} />
              </Routes>
            </Router>
          );
        });

        let anchor = renderer.root.findByType('a');

        expect(anchor).not.toBeNull();
        expect(anchor.props.style).toMatchObject({
          textTransform: 'uppercase'
        });
      });
    });

    describe('when caseSensitive=true', () => {
      it('does not apply its activeClassName to the underlying <a>', () => {
        function Home() {
          return (
            <div>
              <NavLink to="/home" caseSensitive={true} activeClassName="active">
                Home
              </NavLink>
            </div>
          );
        }

        let renderer;
        act(() => {
          renderer = createTestRenderer(
            <Router initialEntries={['/Home']}>
              <Routes>
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
                to="/home"
                caseSensitive={true}
                activeStyle={{ textTransform: 'uppercase' }}
              >
                Home
              </NavLink>
            </div>
          );
        }

        let renderer;
        act(() => {
          renderer = createTestRenderer(
            <Router initialEntries={['/Home']}>
              <Routes>
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
  });
});

describe('NavLink under a Routes with a basename', () => {
  describe('when it does not match', () => {
    it('does not apply its activeClassName to the underlying <a>', () => {
      function Home() {
        return (
          <div>
            <NavLink to="somewhere-else" activeClassName="active">
              Somewhere else
            </NavLink>
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
            >
              Somewhere else
            </NavLink>
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
            <NavLink to="." activeClassName="active">
              Home
            </NavLink>
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
            <NavLink to="." activeStyle={{ textTransform: 'uppercase' }}>
              Home
            </NavLink>
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
