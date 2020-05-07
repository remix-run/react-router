import * as React from 'react';
import { create as createTestRenderer } from 'react-test-renderer';
import {
  MemoryRouter as Router,
  Routes,
  Route,
  useNavigate
} from 'react-router';

describe('useNavigate', () => {
  it('returns the navigate function', () => {
    let navigate;
    function Home() {
      navigate = useNavigate();
      return null;
    }

    createTestRenderer(
      <Router initialEntries={['/home']}>
        <Routes>
          <Route path="/home" element={<Home />} />
        </Routes>
      </Router>
    );

    expect(navigate).toBeInstanceOf(Function);
  });
});
