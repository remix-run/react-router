import * as React from 'react';
import * as ReactDOMServer from 'react-dom/server';
import { Link } from 'react-router-dom';
import { StaticRouter as Router } from 'react-router-dom/server';

describe('A <StaticRouter>', () => {
  describe('with a <Link to> string', () => {
    it('uses the right href', () => {
      let html = ReactDOMServer.renderToStaticMarkup(
        <Router location="/">
          <Link to="mjackson" />
        </Router>
      );

      expect(html).toContain('href="/mjackson"');
    });
  });

  describe('with a <Link to> object', () => {
    it('uses the right href', () => {
      let html = ReactDOMServer.renderToStaticMarkup(
        <Router location="/">
          <Link to={{ pathname: '/mjackson' }} />
        </Router>
      );

      expect(html).toContain('href="/mjackson"');
    });
  });
});
