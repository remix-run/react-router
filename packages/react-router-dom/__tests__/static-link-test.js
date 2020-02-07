import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { Link } from 'react-router-dom';
import { StaticRouter as Router } from 'react-router-dom/server';

describe('A <StaticRouter>', () => {
  describe('with a link child', () => {
    it('to render without error', () => {
      expect(() => {
        ReactDOMServer.renderToStaticMarkup(
          <Router location="/">
            <Link to="anywhere" />
          </Router>
        );
      }).not.toThrow();
    });
  });
});
