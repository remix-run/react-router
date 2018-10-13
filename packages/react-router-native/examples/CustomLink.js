import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { NativeRouter, Route, Link } from "react-router-native";

function CustomLink({ children, to, activeOnlyWhenExact }) {
  return (
    <Route
      path={to}
      exact={activeOnlyWhenExact}
      children={({ match }) => (
        <Link style={styles.navItem} underlayColor="#f0f4f7" to={to}>
          <View style={{ flexDirection: "row" }}>
            {match && <Text>></Text>}
            {children}
          </View>
        </Link>
      )}
    />
  );
}

function Child({ match }) {
  return <Text>ID: {match.params.id}</Text>;
}

function App() {
  return (
    <NativeRouter>
      <View style={styles.container}>
        <Text style={styles.header}>Accounts</Text>
        <View style={styles.nav}>
          <CustomLink to="/netflix">
            <Text>Netflix</Text>
          </CustomLink>
          <CustomLink to="/zillow-group">
            <Text>Zillow Group</Text>
          </CustomLink>
          <CustomLink to="/yahoo">
            <Text>Yahoo</Text>
          </CustomLink>
          <CustomLink to="/modus-create">
            <Text>Modus Create</Text>
          </CustomLink>
        </View>
        <Route
          path="/:id"
          render={({ match }) => <Text>ID: {match.params.id}</Text>}
        />
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
  }
});

export default App;
