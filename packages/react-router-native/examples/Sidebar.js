import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { NativeRouter, Route, Link } from "react-router-native";

// Each logical "route" has two components, one for
// the sidebar and one for the main area. We want to
// render both of them in different places when the
// path matches the current URL.
const routes = [
  {
    path: "/",
    exact: true,
    sidebar: () => <Text style={styles.sidebarText}>home!</Text>,
    main: () => <Text style={styles.header}>Home</Text>
  },
  {
    path: "/bubblegum",
    sidebar: () => <Text style={styles.sidebarText}>bubblegum!</Text>,
    main: () => <Text style={styles.header}>Bubblegum</Text>
  },
  {
    path: "/shoelaces",
    sidebar: () => <Text style={styles.sidebarText}>shoelaces!</Text>,
    main: () => <Text style={styles.header}>Shoelaces</Text>
  }
];

function App() {
  return (
    <NativeRouter>
      <View style={styles.container}>
        <View
          style={{
            backgroundColor: "#f0f0f0"
          }}
        >
          <View>
            <Link to="/" underlayColor="#f0f4f7">
              <Text>Home</Text>
            </Link>
            <Link to="/bubblegum" underlayColor="#f0f4f7">
              <Text>Bubblegum</Text>
            </Link>
            <Link to="/shoelaces" underlayColor="#f0f4f7">
              <Text>Shoelaces</Text>
            </Link>
          </View>

          {routes.map((route, index) => (
            // You can render a <Route> in as many places
            // as you want in your app. It will render along
            // with any other <Route>s that also match the URL.
            // So, a sidebar or breadcrumbs or anything else
            // that requires you to render multiple things
            // in multiple places at the same URL is nothing
            // more than multiple <Route>s.
            <Route
              key={index}
              path={route.path}
              exact={route.exact}
              component={route.sidebar}
            />
          ))}
        </View>

        <View>
          {routes.map((route, index) => (
            // Render more <Route>s with the same paths as
            // above, but different components this time.
            <Route
              key={index}
              path={route.path}
              exact={route.exact}
              component={route.main}
            />
          ))}
        </View>
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
    fontSize: 20,
    marginTop: 20
  },
  sidebarText: {
    fontWeight: "bold",
    textAlign: "center"
  }
});

export default App;
