import React from 'react';
import { create as createTestRenderer } from 'react-test-renderer';
import { createMemoryHistory } from 'history';
import { Router } from 'react-router';

describe('A <Router>', () => {
  it('throws if another <Router> is already in context', () => {
    let spy = jest.spyOn(console, 'error').mockImplementation(() => {});

    let history = createMemoryHistory();

    expect(() => {
      createTestRenderer(
        <Router history={history}>
          <Router history={history} />
        </Router>
      );
    }).toThrow(/cannot render a <Router> inside another <Router>/);

    expect(spy).toHaveBeenCalled();

    spy.mockRestore();
  });
});
