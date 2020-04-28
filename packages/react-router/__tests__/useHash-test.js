import * as React from 'react';
import { create as createTestRenderer } from 'react-test-renderer';
import { act } from 'react-dom/test-utils';
import {
  MemoryRouter as Router,
  Routes,
  Route,
  useHash
} from 'react-router';

describe('useHash', () => {
  it('returns the current hash string', () => {
    let hash;
    function Home() {
      [hash] = useHash();
      return <h1>Home</h1>;
    }

    createTestRenderer(
      <Router initialEntries={['/home?the=search#the-hash']}>
        <Routes>
          <Route path="/home" element={<Home />} />
        </Routes>
      </Router>
    );

    expect(hash).toBe('#the-hash');
  });

  it('navigates with new hash', () => {
    let hash;
    let setHash;
    function Home() {
      [hash, setHash] = useHash();
      return <h1>Home</h1>;
    }

    createTestRenderer(
      <Router initialEntries={['/home?the=search#the-hash']}>
        <Routes>
          <Route path="/home" element={<Home />} />
        </Routes>
      </Router>
    );

    act(() => {
      setHash('#next-hash');
    });

    expect(hash).toBe('#next-hash');
  });

});
