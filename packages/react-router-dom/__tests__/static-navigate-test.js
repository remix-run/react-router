import * as React from 'react';
import * as ReactDOMServer from 'react-dom/server';
import { Navigate, Routes, Route } from 'react-router-dom';
import { StaticRouter as Router } from 'react-router-dom/server';

describe('A <Navigate> in a <StaticRouter>', () => {
  let consoleWarn;
  beforeEach(() => {
    consoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleWarn.mockRestore();
  });

  it('warns about using on the initial render', () => {
    function Home() {
      return <Navigate to="/somewhere-else?the=query" />;
    }

    ReactDOMServer.renderToStaticMarkup(
      <Router location="/home">
        <Routes>
          <Route path="/home" element={<Home />} />
        </Routes>
      </Router>
    );

    expect(consoleWarn).toHaveBeenCalledWith(
      expect.stringMatching('<Navigate> must not be used on the initial render')
    );
  });
});
