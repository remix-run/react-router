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
    });
  });

  describe('a push navigation', () => {
    it('issues a warning and mutates the context object', () => {
      let spy = jest.spyOn(console, 'warn').mockImplementation(() => {});
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

      expect(spy).toHaveBeenCalledWith(
        expect.stringContaining('cannot perform a PUSH with a static router')
      );

      expect(context).toMatchObject({
        url: '/somewhere-else?the=query',
        state: undefined
      });

      spy.mockRestore();
    });
  });
});
