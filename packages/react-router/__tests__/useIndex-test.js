import * as React from 'react';
import { act, create as createTestRenderer } from 'react-test-renderer';
import {
  MemoryRouter,
  Routes,
  Route,
  useIndex,
  useNavigate
} from 'react-router';

describe('useIndex', () => {
  it('returns the index of the current location', () => {
    let aboutIndex, aboutNavigate, homeIndex;

    function Home() {
      homeIndex = useIndex();
      return <h1>Home</h1>;
    }

    function About() {
      aboutIndex = useIndex();
      aboutNavigate = useNavigate();
      return <h1>About</h1>;
    }

    act(() => {
      createTestRenderer(
        <MemoryRouter initialEntries={['/home', '/about']} initialIndex={1}>
          <Routes>
            <Route path="/home" element={<Home />} />
            <Route path="/about" element={<About />} />
          </Routes>
        </MemoryRouter>
      );
    });

    expect(aboutIndex).toEqual(1);

    act(() => {
      aboutNavigate(-1);
    });

    expect(homeIndex).toEqual(0);
  });
});
