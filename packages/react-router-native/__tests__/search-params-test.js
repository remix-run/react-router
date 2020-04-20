import React from 'react';
import { View, Text, TouchableHighlight } from 'react-native';
import { act, create as createTestRenderer } from 'react-test-renderer';
import {
  Link,
  NativeRouter as Router,
  Routes,
  Route,
  useSearchParams
} from 'react-router-native';

import { press } from './utils.js';

describe('Reading search params', () => {
  it('get() reads individual params', () => {
    function Home() {
      let searchParams = useSearchParams();
      let login = searchParams.get('login');
      return (
        <View>
          <Text>Hello {login}</Text>
        </View>
      );
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
      <View>
        <Text>
          Hello 
          mjackson
        </Text>
      </View>
    `);
  });

  it('getAll() reads params with more than one value', () => {
    function CandyShop() {
      let searchParams = useSearchParams();
      let treats = searchParams.getAll('treats');
      return (
        <View>
          <Text>Selected treats: {treats.join(', ')}</Text>
        </View>
      );
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
      <View>
        <Text>
          Selected treats: 
          popcorn, red vines
        </Text>
      </View>
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
      <View>
        <Text>Selected brands:</Text>
        <View>
          <Text>{selectedBrands.join(', ')}</Text>
        </View>

        <Text>Select a brand:</Text>
        <View>
          {notSelectedBrands.map(brand => (
            <Link
              key={brand}
              to={{ search: '?' + addParam(searchParams, 'brand', brand) }}
            >
              <Text>{brand}</Text>
            </Link>
          ))}
        </View>
      </View>
    );
  }

  it('navigates to the right place when clicked', () => {
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

    let touchables = renderer.root.findAllByType(TouchableHighlight);
    expect(touchables.length).toEqual(2);

    act(() => {
      press(touchables[0]);
    });

    expect(renderer.toJSON()).toMatchInlineSnapshot(`
      <View>
        <Text>
          Selected brands:
        </Text>
        <View>
          <Text>
            Nike, Adidas
          </Text>
        </View>
        <Text>
          Select a brand:
        </Text>
        <View>
          <View
            accessible={true}
            focusable={true}
            isTVSelectable={true}
            onClick={[Function]}
            onResponderGrant={[Function]}
            onResponderMove={[Function]}
            onResponderRelease={[Function]}
            onResponderTerminate={[Function]}
            onResponderTerminationRequest={[Function]}
            onStartShouldSetResponder={[Function]}
            style={null}
          >
            <Text
              style={null}
            >
              Under Armour
            </Text>
          </View>
        </View>
      </View>
    `);
  });
});
