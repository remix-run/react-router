import React, { Component } from "react";
import { StyleSheet, Text, View, TouchableHighlight } from "react-native";

import {
  NativeRouter,
  Route,
  Link,
  Redirect,
  withRouter
} from "react-router-native";

function AuthExample() {
  return (
    <NativeRouter>
      <View style={styles.container}>
        <AuthButton />
        <View style={styles.nav}>
          <Link to="/public" style={styles.navItem} underlayColor="#f0f4f7">
            <Text>Public Page</Text>
          </Link>
          <Link to="/protected" style={styles.navItem} underlayColor="#f0f4f7">
            <Text>Protected Page</Text>
          </Link>
        </View>

        <Route path="/public" component={Public} />
        <Route path="/login" component={Login} />
        <PrivateRoute path="/protected" component={Protected} />
      </View>
    </NativeRouter>
  );
}

const fakeAuth = {
  isAuthenticated: false,
  authenticate(cb) {
    this.isAuthenticated = true;
    setTimeout(cb, 100); // fake async
  },
  signout(cb) {
    this.isAuthenticated = false;
    setTimeout(cb, 100);
  }
};

const AuthButton = withRouter(
  ({ history }) =>
    fakeAuth.isAuthenticated ? (
      <View>
        <Text>Welcome!</Text>
        <TouchableHighlight
          style={styles.btn}
          underlayColor="#f0f4f7"
          onPress={() => {
            fakeAuth.signout(() => history.push("/"));
          }}
        >
          <Text>Sign out</Text>
        </TouchableHighlight>
      </View>
    ) : (
      <Text>You are not logged in.</Text>
    )
);

function PrivateRoute({ component: Component, ...rest }) {
  return (
    <Route
      {...rest}
      render={props =>
        fakeAuth.isAuthenticated ? (
          <Component {...props} />
        ) : (
          <Redirect
            to={{
              pathname: "/login",
              state: { from: props.location }
            }}
          />
        )
      }
    />
  );
}

function Public() {
  return <Text style={styles.header}>Public</Text>;
}

function Protected() {
  return <Text style={styles.header}>Protected</Text>;
}

class Login extends Component {
  state = { redirectToReferrer: false };

  login = () => {
    fakeAuth.authenticate(() => {
      this.setState({ redirectToReferrer: true });
    });
  };

  render() {
    const { from } = this.props.location.state || { from: { pathname: "/" } };
    const { redirectToReferrer } = this.state;

    if (redirectToReferrer) {
      return <Redirect to={from} />;
    }

    return (
      <View>
        <Text>You must log in to view the page at {from.pathname}</Text>

        <TouchableHighlight
          style={styles.btn}
          underlayColor="#f0f4f7"
          onPress={this.login}
        >
          <Text>Log in</Text>
        </TouchableHighlight>
      </View>
    );
  }
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
  btn: {
    width: 200,
    backgroundColor: "#E94949",
    justifyContent: "center",
    alignItems: "center",
    padding: 10,
    marginTop: 10
  }
});

export default AuthExample;
