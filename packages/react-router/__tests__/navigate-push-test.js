import React from 'react';
import ReactDOM from 'react-dom';
import { act } from 'react-dom/test-utils';
import { Router, Routes, Route, useNavigate } from 'react-router';

function createMockHistory(initialLocation) {
  return {
    location: initialLocation,
    push() {},
    replace() {},
    go() {},
    listen() {},
    block() {}
  };
}

describe('navigate', () => {
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
    it('calls history.push()', () => {
      function Home() {
        let navigate = useNavigate();

        function handleClick() {
          navigate('/about');
        }

        return (
          <div>
            <h1>Home</h1>
            <button onClick={handleClick}>click me</button>
          </div>
        );
      }

      function About() {
        return <h1>About</h1>;
      }

      let history = createMockHistory({
        pathname: '/home',
        search: '',
        hash: ''
      });
      let spy = jest.spyOn(history, 'push');

      act(() => {
        ReactDOM.render(
          <Router history={history}>
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

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('with { replace: true }', () => {
    it('calls history.replace()', () => {
      function Home() {
        let navigate = useNavigate();

        function handleClick() {
          navigate('/about', { replace: true });
        }

        return (
          <div>
            <h1>Home</h1>
            <button onClick={handleClick}>click me</button>
          </div>
        );
      }

      function About() {
        return <h1>About</h1>;
      }

      let history = createMockHistory({
        pathname: '/home',
        search: '',
        hash: ''
      });
      let spy = jest.spyOn(history, 'replace');

      act(() => {
        ReactDOM.render(
          <Router history={history}>
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

      expect(spy).toHaveBeenCalled();
    });
  });
});
