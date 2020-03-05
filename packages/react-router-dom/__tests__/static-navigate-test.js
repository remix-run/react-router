import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { Navigate, Routes, Route } from 'react-router-dom';
import { StaticRouter as Router } from 'react-router-dom/server';

describe('A <Navigate> in a <StaticRouter>', () => {
  describe('a replace navigation', () => {
    it('mutates the context object', () => {
      let context = {};

      function Home() {
        return <Navigate replace to="/somewhere-else?the=query" />;
      }

      ReactDOMServer.renderToStaticMarkup(
        <Router context={context} location="/home">
          <Routes>
            <Route path="/home" element={<Home />} />
          </Routes>
        </Router>
      );

      expect(context).toMatchObject({
        url: '/somewhere-else?the=query',
        state: undefined
      });
    });

    describe('with an object to prop', () => {
      it('mutates the context object', () => {
        let context = {};

        function Home() {
          return (
            <Navigate
              replace
              to={{ pathname: '/somewhere-else', search: '?the=query' }}
            />
          );
        }

        ReactDOMServer.renderToStaticMarkup(
          <Router context={context} location="/home">
            <Routes>
              <Route path="/home" element={<Home />} />
            </Routes>
          </Router>
        );

        expect(context).toMatchObject({
          url: '/somewhere-else?the=query',
          state: undefined
        });
      });

      it('reuses pieces of the current location that are missing from the to value', () => {
        let context = {};

        function Home() {
          // only use search here, so pathname should be reused
          return <Navigate replace to={{ search: '?the=query' }} />;
        }

        ReactDOMServer.renderToStaticMarkup(
          <Router context={context} location="/home">
            <Routes>
              <Route path="/home" element={<Home />} />
            </Routes>
          </Router>
        );

        expect(context).toMatchObject({
          url: '/home?the=query',
          state: undefined
        });
      });
    });
  });

  describe('a push navigation', () => {
    let consoleWarn;
    beforeEach(() => {
      consoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleWarn.mockRestore();
    });

    it('issues a warning', () => {
      let context = {};

      function Home() {
        return <Navigate push to="/somewhere-else?the=query" />;
      }

      ReactDOMServer.renderToStaticMarkup(
        <Router context={context} location="/home">
          <Routes>
            <Route path="/home" element={<Home />} />
          </Routes>
        </Router>
      );

      expect(consoleWarn).toHaveBeenCalledWith(
        expect.stringContaining('cannot perform a PUSH with a <StaticRouter>')
      );
    });

    it('mutates the context object', () => {
      let context = {};

      function Home() {
        return <Navigate push to="/somewhere-else?the=query" />;
      }

      ReactDOMServer.renderToStaticMarkup(
        <Router context={context} location="/home">
          <Routes>
            <Route path="/home" element={<Home />} />
          </Routes>
        </Router>
      );

      expect(context).toMatchObject({
        url: '/somewhere-else?the=query',
        state: undefined
      });
    });

    describe('with an object to prop', () => {
      it('mutates the context object', () => {
        let context = {};

        function Home() {
          return (
            <Navigate
              push
              to={{ pathname: '/somewhere-else', search: '?the=query' }}
            />
          );
        }

        ReactDOMServer.renderToStaticMarkup(
          <Router context={context} location="/home">
            <Routes>
              <Route path="/home" element={<Home />} />
            </Routes>
          </Router>
        );

        expect(context).toMatchObject({
          url: '/somewhere-else?the=query',
          state: undefined
        });
      });

      it('reuses pieces of the current location that are missing from the to value', () => {
        let context = {};

        function Home() {
          // only use search here, so pathname should be reused
          return <Navigate push to={{ search: '?the=query' }} />;
        }

        ReactDOMServer.renderToStaticMarkup(
          <Router context={context} location="/home">
            <Routes>
              <Route path="/home" element={<Home />} />
            </Routes>
          </Router>
        );

        expect(context).toMatchObject({
          url: '/home?the=query',
          state: undefined
        });
      });
    });
  });
});
