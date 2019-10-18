import React, { Component } from "react";
import { StyleSheet, Text, View } from "react-native";

import { NativeRouter, Route, Link } from "react-router-native";

class App extends Component {
  render() {
    return (
      <NativeRouter>
        <View style={styles.container}>
          <Route
            exact
            path="/"
            render={() => (
              <View>
                <Text style={styles.welcome}>
                  Welcome to React Router Native!
                </Text>
                <Link to="/one">
                  <Text style={styles.instructions}>
                    Go to &quot;/one&quot;
                  </Text>
                </Link>
              </View>
            )}
          />

          <Route
            exact
            path="/one"
            render={() => (
              <View>
                <Text style={styles.welcome}>ONE!</Text>
                <Link to="/" replace={true}>
                  <Text style={styles.instructions}>Go Back</Text>
                </Link>
              </View>
            )}
          />
        </View>
      </NativeRouter>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5FCFF"
  },
  welcome: {
    fontSize: 20,
    textAlign: "center",
    margin: 10
  },
  instructions: {
    textAlign: "center",
    color: "#333333",
    marginBottom: 5
  }
});

export default App;
