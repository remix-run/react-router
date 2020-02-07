import React from 'react';
import { create as createTestRenderer } from 'react-test-renderer';
import { MemoryRouter as Router, Routes, Route } from 'react-router';

describe('A <Route>', () => {
  it('renders its `element` prop', () => {
    function Home() {
      return <h1>Home</h1>;
    }

    let renderer = createTestRenderer(
      <Router initialEntries={['/home']}>
        <Routes>
          <Route path="home" element={<Home />} />
        </Routes>
      </Router>
    );

    expect(renderer.toJSON()).toMatchInlineSnapshot(`
      <h1>
        Home
      </h1>
    `);
  });
});
