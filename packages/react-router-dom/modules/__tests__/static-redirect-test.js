import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { Redirect, Routes } from 'react-router-dom';
import { StaticRouter as Router } from 'react-router-dom/server';

describe('A <Redirect> in a <StaticRouter>', () => {
  it('mutates the context object', () => {
    let context = {};

    ReactDOMServer.renderToStaticMarkup(
      <Router context={context}>
        <Routes>
          <Redirect to="/somewhere-else?the=query" />
        </Routes>
      </Router>
    );

    expect(context).toMatchObject({
      url: '/somewhere-else?the=query',
      state: undefined
    });
  });

  describe('with an object to prop', () => {
    it('works', () => {
      let context = {};

      ReactDOMServer.renderToStaticMarkup(
        <Router context={context}>
          <Routes>
            <Redirect
              to={{ pathname: '/somewhere-else', search: '?the=query' }}
            />
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
