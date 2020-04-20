import React from 'react';
import { create as createTestRenderer } from 'react-test-renderer';
import {
  MemoryRouter as Router,
  Routes,
  Route,
  useLocation
} from 'react-router';

describe('useLocation', () => {
  it('returns the current location object', () => {
    let location;
    function Home() {
      location = useLocation();
      return <h1>Home</h1>;
    }

    createTestRenderer(
      <Router initialEntries={['/home?the=search#the-hash']}>
        <Routes>
          <Route path="/home" element={<Home />} />
        </Routes>
      </Router>
    );

    expect(typeof location).toBe('object');
    expect(location).toMatchObject({
      pathname: '/home',
      search: '?the=search',
      hash: '#the-hash'
    });
  });
});
