import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { NativeRouter, Route, Link } from "react-router-native";

// Some folks find value in a centralized route config.
// A route config is just data. React is great at mapping
// data into components, and <Route> is a component.

////////////////////////////////////////////////////////////
// first our route components
function Main() {
  return <Text style={styles.header}>Main</Text>;
}

function Sandwiches() {
  return <Text style={styles.header}>Sandwiches</Text>;
}

function Tacos({ routes }) {
  return (
    <View>
      <Text style={styles.header}>Tacos</Text>
      <View style={styles.nav}>
        <Link to="/tacos/bus" style={styles.navItem} underlayColor="#f0f4f7">
          <Text>Bus</Text>
        </Link>
        <Link to="/tacos/cart" style={styles.navItem} underlayColor="#f0f4f7">
          <Text>Cart</Text>
        </Link>
      </View>

      {routes.map((route, i) => (
        <RouteWithSubRoutes key={i} {...route} />
      ))}
    </View>
  );
}

function Bus() {
  return <Text style={styles.subHeader}>Bus</Text>;
}

function Cart() {
  return <Text style={styles.subHeader}>Cart</Text>;
}

////////////////////////////////////////////////////////////
// then our route config
const routes = [
  {
    path: "/sandwiches",
    component: Sandwiches
  },
  {
    path: "/tacos",
    component: Tacos,
    routes: [
      {
        path: "/tacos/bus",
        component: Bus
      },
      {
        path: "/tacos/cart",
        component: Cart
      }
    ]
  }
];

// wrap <Route> and use this everywhere instead, then when
// sub routes are added to any route it'll work
function RouteWithSubRoutes(route) {
  return (
    <Route
      path={route.path}
      render={props => (
        // pass the sub-routes down to keep nesting
        <route.component {...props} routes={route.routes} />
      )}
    />
  );
}

function App() {
  return (
    <NativeRouter>
      <View style={styles.container}>
        <View style={styles.nav}>
          <Link to="/tacos" underlayColor="#f0f4f7" style={styles.navItem}>
            <Text>Tacos</Text>
          </Link>
          <Link to="/sandwiches" underlayColor="#f0f4f7" style={styles.navItem}>
            <Text>Sandwiches</Text>
          </Link>
        </View>

        {routes.map((route, i) => (
          <RouteWithSubRoutes key={i} {...route} />
        ))}
      </View>
    </NativeRouter>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 25,
    padding: 10
  },
  header: {
    fontSize: 20
  },
  nav: {
    flexDirection: "row",
    justifyContent: "space-around"
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    padding: 10
  },
  subHeader: {
    fontSize: 15
  }
});

export default App;
