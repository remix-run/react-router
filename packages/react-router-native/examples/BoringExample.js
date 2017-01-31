import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  View
} from 'react-native'

import {
  NativeRouter,
  Route,
  Link,
  DeepLinking,
  Prompt
} from '../main'

export default class App extends Component {
  render() {
    return (
      <NativeRouter>
        <View style={styles.container}>
          <DeepLinking/>
          <Route exact path="/" render={() => (
            <View>
              <Text style={styles.welcome}>
                Welcome to React Router Native!
              </Text>
              <Link to="/one">
                <Text style={styles.instructions}>
                  Go to "/one"
                </Text>
              </Link>
            </View>
          )}/>

          <Route exact path="/one" render={() => (
            <View>
              <Prompt message="Are you sure you want to leave this screen?"/>
              <Text style={styles.welcome}>
                ONE!
              </Text>
              <Link to="/" replace={true}>
                <Text style={styles.instructions}>
                  Go Back
                </Text>
              </Link>
            </View>
          )}/>
        </View>
      </NativeRouter>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
});

