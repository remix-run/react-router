import React from 'react';
import ReactDOM from 'react-dom';
import { act } from 'react-dom/test-utils';
import { MemoryRouter as Router, Routes, Route, Link } from 'react-router-dom';

describe('A <Link> click', () => {
  let node;
  beforeEach(() => {
    node = document.createElement('div');
    document.body.appendChild(node);
  });

  afterEach(() => {
    document.body.removeChild(node);
    node = null;
  });

  it('navigates to the new page', () => {
    function Home() {
      return (
        <div>
          <h1>Home</h1>
          <Link to="../about">About</Link>
        </div>
      );
    }

    function About() {
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

    let anchor = node.querySelector('a');
    expect(anchor).not.toBeNull();

    act(() => {
      anchor.dispatchEvent(
        new MouseEvent('click', {
          view: window,
          bubbles: true,
          cancelable: true
        })
      );
    });

    let h1 = node.querySelector('h1');
    expect(h1).not.toBeNull();
    expect(h1.textContent).toEqual('About');
  });

  describe('when preventDefault is used on the click handler', () => {
    it('stays on the same page', () => {
      function Home() {
        function handleClick(event) {
          event.preventDefault();
        }

        return (
          <div>
            <h1>Home</h1>
            <Link to="../about" onClick={handleClick}>
              About
            </Link>
          </div>
        );
      }

      function About() {
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

      let anchor = node.querySelector('a');
      expect(anchor).not.toBeNull();

      act(() => {
        anchor.dispatchEvent(
          new MouseEvent('click', {
            view: window,
            bubbles: true,
            cancelable: true
          })
        );
      });

      let h1 = node.querySelector('h1');
      expect(h1).not.toBeNull();
      expect(h1.textContent).toEqual('Home');
    });
  });

  describe('with a right click', () => {
    it('stays on the same page', () => {
      function Home() {
        return (
          <div>
            <h1>Home</h1>
            <Link to="../about">About</Link>
          </div>
        );
      }

      function About() {
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

      let anchor = node.querySelector('a');
      expect(anchor).not.toBeNull();

      act(() => {
        // https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/button
        let RightMouseButton = 2;
        anchor.dispatchEvent(
          new MouseEvent('click', {
            view: window,
            bubbles: true,
            cancelable: true,
            button: RightMouseButton
          })
        );
      });

      let h1 = node.querySelector('h1');
      expect(h1).not.toBeNull();
      expect(h1.textContent).toEqual('Home');
    });
  });

  describe('when the link is supposed to open in a new window', () => {
    it('stays on the same page', () => {
      function Home() {
        return (
          <div>
            <h1>Home</h1>
            <Link to="../about" target="_blank">
              About
            </Link>
          </div>
        );
      }

      function About() {
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

      let anchor = node.querySelector('a');
      expect(anchor).not.toBeNull();

      act(() => {
        anchor.dispatchEvent(
          new MouseEvent('click', {
            view: window,
            bubbles: true,
            cancelable: true
          })
        );
      });

      let h1 = node.querySelector('h1');
      expect(h1).not.toBeNull();
      expect(h1.textContent).toEqual('Home');
    });
  });

  describe('when the modifier keys are used', () => {
    it('stays on the same page', () => {
      function Home() {
        return (
          <div>
            <h1>Home</h1>
            <Link to="../about">About</Link>
          </div>
        );
      }

      function About() {
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

      let anchor = node.querySelector('a');
      expect(anchor).not.toBeNull();

      act(() => {
        anchor.dispatchEvent(
          new MouseEvent('click', {
            view: window,
            bubbles: true,
            cancelable: true,
            // The Ctrl key is pressed
            ctrlKey: true
          })
        );
      });

      let h1 = node.querySelector('h1');
      expect(h1).not.toBeNull();
      expect(h1.textContent).toEqual('Home');
    });
  });
});
