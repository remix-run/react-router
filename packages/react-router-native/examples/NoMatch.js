import React from "react";
import { StyleSheet, Text, View } from "react-native";

import {
  NativeRouter,
  Route,
  Link,
  Switch,
  Redirect
} from "react-router-native";

function Home() {
  return (
    <Text style={styles.header}>
      A &lt;Switch> renders the first child &lt;Route> that matches. A
      &lt;Route> with no "path" always matches.
    </Text>
  );
}

function WillMatch() {
  return <Text style={styles.header}>Matched!</Text>;
}

function NoMatch({ location }) {
  return <Text style={styles.header}>No match for {location.pathname}</Text>;
}

function App() {
  return (
    <NativeRouter>
      <View style={styles.container}>
        <View>
          <Link to="/" style={styles.navItem} underlayColor="#f0f4f7">
            <Text>Home</Text>
          </Link>
          <Link to="/old-match" style={styles.navItem} underlayColor="#f0f4f7">
            <Text>Old Match, to be redirected</Text>
          </Link>
          <Link to="/will-match" style={styles.navItem} underlayColor="#f0f4f7">
            <Text>Will Match</Text>
          </Link>
          <Link
            to="/will-not-match"
            style={styles.navItem}
            underlayColor="#f0f4f7"
          >
            <Text>Will Not Match</Text>
          </Link>
          <Link
            to="/also/will/not/match"
            style={styles.navItem}
            underlayColor="#f0f4f7"
          >
            <Text>Also Will Not Match</Text>
          </Link>
        </View>
        <Switch>
          <Route path="/" exact component={Home} />
          <Redirect from="/old-match" to="/will-match" />
          <Route path="/will-match" component={WillMatch} />
          <Route component={NoMatch} />
        </Switch>
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
  }
});

export default App;
