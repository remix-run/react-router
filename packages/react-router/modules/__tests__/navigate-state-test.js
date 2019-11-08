import React from 'react';
import ReactDOM from 'react-dom';
import { act } from 'react-dom/test-utils';
import {
  MemoryRouter as Router,
  Routes,
  Route,
  useNavigate,
  useLocation
} from 'react-router';

describe('navigate state', () => {
  let node;
  beforeEach(() => {
    node = document.createElement('div');
    document.body.appendChild(node);
  });

  afterEach(() => {
    document.body.removeChild(node);
    node = null;
  });

  describe('by default', () => {
    it('does not use any state', () => {
      function Home() {
        let navigate = useNavigate();

        function handleClick() {
          navigate('../about');
        }

        return (
          <div>
            <h1>Home</h1>
            <button onClick={handleClick}>click me</button>
          </div>
        );
      }

      let location;
      function About() {
        location = useLocation();
        return <h1>About</h1>;
      }

      act(() => {
        ReactDOM.render(
          <Router initialEntries={['/home']}>
            <Routes>
              <Route path="home" element={<Home />} />
              <Route path="about" element={<About />} />
            </Routes>
          </Router>,
          node
        );
      });

      let button = node.querySelector('button');
      expect(button).not.toBeNull();

      act(() => {
        button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      });

      expect(location).toBeDefined();
      expect(location).toMatchObject({
        state: null
      });
    });
  });

  describe('with { state }', () => {
    it('sets state on the next location', () => {
      function Home() {
        let navigate = useNavigate();
        let state = { from: 'home' };

        function handleClick() {
          navigate('../about', { state });
        }

        return (
          <div>
            <h1>Home</h1>
            <button onClick={handleClick}>click me</button>
          </div>
        );
      }

      let location;
      function About() {
        location = useLocation();
        return <h1>About</h1>;
      }

      act(() => {
        ReactDOM.render(
          <Router initialEntries={['/home']}>
            <Routes>
              <Route path="home" element={<Home />} />
              <Route path="about" element={<About />} />
            </Routes>
          </Router>,
          node
        );
      });

      let button = node.querySelector('button');
      expect(button).not.toBeNull();

      act(() => {
        button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      });

      expect(location).toBeDefined();
      expect(location).toMatchObject({
        state: { from: 'home' }
      });
    });
  });
});
