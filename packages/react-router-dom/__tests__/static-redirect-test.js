import React from 'react';
import { act, create as createTestRenderer } from 'react-test-renderer';
import { Redirect, Routes } from 'react-router-dom';
import { StaticRouter as Router } from 'react-router-dom/server';

describe('A <Redirect> in a <StaticRouter>', () => {
  it('mutates the context object', () => {
    let context = {};

    act(() => {
      createTestRenderer(
        <Router context={context}>
          <Routes>
            <Redirect to="/somewhere-else?the=query" />
          </Routes>
        </Router>
      );
    });

    expect(context).toMatchObject({
      url: '/somewhere-else?the=query',
      state: undefined
    });
  });

  describe('with an object to prop', () => {
    it('works', () => {
      let context = {};

      act(() => {
        createTestRenderer(
          <Router context={context}>
            <Routes>
              <Redirect
                to={{ pathname: '/somewhere-else', search: '?the=query' }}
              />
            </Routes>
          </Router>
        );
      });

      expect(context).toMatchObject({
        url: '/somewhere-else?the=query',
        state: undefined
      });
    });
  });
});
