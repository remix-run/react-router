import React from 'react';
import { create as createTestRenderer } from 'react-test-renderer';
import { createMemoryHistory } from 'history';
import { Router } from 'react-router';

describe('A <Router>', () => {
  let consoleError;
  beforeEach(() => {
    consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleError.mockRestore();
  });

  it('throws if another <Router> is already in context', () => {
    let history = createMemoryHistory();

    expect(() => {
      createTestRenderer(
        <Router history={history}>
          <Router history={history} />
        </Router>
      );
    }).toThrow(/cannot render a <Router> inside another <Router>/);

    expect(consoleError).toHaveBeenCalled();
  });
});
