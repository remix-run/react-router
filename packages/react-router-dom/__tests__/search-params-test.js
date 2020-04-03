import React from 'react';
import { act, create as createTestRenderer } from 'react-test-renderer';
import {
  Link,
  MemoryRouter as Router,
  Routes,
  Route,
  useSearchParams
} from 'react-router-dom';

describe('Reading search params', () => {
  it('get() reads individual params', () => {
    function Home() {
      let searchParams = useSearchParams();
      let login = searchParams.get('login');
      return <div>Hello {login}</div>;
    }

    let renderer;
    act(() => {
      renderer = createTestRenderer(
        <Router initialEntries={['/home?login=mjackson']}>
          <Routes>
            <Route path="home" element={<Home />} />
          </Routes>
        </Router>
      );
    });

    expect(renderer.toJSON()).toMatchInlineSnapshot(`
      <div>
        Hello 
        mjackson
      </div>
    `);
  });

  it('getAll() reads params with more than one value', () => {
    function CandyShop() {
      let searchParams = useSearchParams();
      let treats = searchParams.getAll('treats');
      return <div>Selected treats: {treats.join(', ')}</div>;
    }

    let renderer;
    act(() => {
      renderer = createTestRenderer(
        <Router initialEntries={['/shop?treats=popcorn&treats=red+vines']}>
          <Routes>
            <Route path="shop" element={<CandyShop />} />
          </Routes>
        </Router>
      );
    });

    expect(renderer.toJSON()).toMatchInlineSnapshot(`
      <div>
        Selected treats: 
        popcorn, red vines
      </div>
    `);
  });
});

describe('Links with search params', () => {
  function ShoeStore({ brands }) {
    let searchParams = useSearchParams();
    let selectedBrands = searchParams.getAll('brand');
    let notSelectedBrands = brands.filter(
      brand => !selectedBrands.includes(brand)
    );

    function addParam(params, name, value) {
      let newParams = new URLSearchParams(params);
      newParams.append(name, value);
      return newParams;
    }

    return (
      <div>
        <h1>Selected brands:</h1>
        <p>{selectedBrands.join(', ')}</p>

        <h1>Select a brand:</h1>
        <p>
          {notSelectedBrands.map(brand => (
            <Link
              key={brand}
              to={{ search: '?' + addParam(searchParams, 'brand', brand) }}
            >
              {brand}
            </Link>
          ))}
        </p>
      </div>
    );
  }

  it('has the correct href', () => {
    let renderer;
    act(() => {
      let shoeBrands = ['Nike', 'Adidas', 'Under Armour'];
      renderer = createTestRenderer(
        <Router initialEntries={['/store?brand=Nike']}>
          <Routes>
            <Route path="/store" element={<ShoeStore brands={shoeBrands} />} />
          </Routes>
        </Router>
      );
    });

    expect(renderer.toJSON()).toMatchInlineSnapshot(`
      <div>
        <h1>
          Selected brands:
        </h1>
        <p>
          Nike
        </p>
        <h1>
          Select a brand:
        </h1>
        <p>
          <a
            href="/store?brand=Nike&brand=Adidas"
            onClick={[Function]}
          >
            Adidas
          </a>
          <a
            href="/store?brand=Nike&brand=Under+Armour"
            onClick={[Function]}
          >
            Under Armour
          </a>
        </p>
      </div>
    `);
  });
});
