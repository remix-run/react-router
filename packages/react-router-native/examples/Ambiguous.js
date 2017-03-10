import React from 'react'
import { StyleSheet, Text, AppRegistry, View } from 'react-native'
import { NativeRouter, Route, Link, Switch } from 'react-router-native'

const About = () => <Text style={styles.header}>About</Text>
const Company = () => <Text style={styles.header}>Company</Text>
const User = ({ match }) => (
  <Text style={styles.header}>User: {match.params.user}</Text>
)

const AmbiguousExample = () => (
  <NativeRouter>
    <View style={styles.container}>
      <View>
        <Link to="/about" underlayColor='#f0f4f7'>
          <Text>About Us (static)</Text>
        </Link>
        <Link to="/company" underlayColor='#f0f4f7'>
          <Text>Company (static)</Text>
        </Link>
        <Link to="/kim" underlayColor='#f0f4f7'>
          <Text>Kim (dynamic)</Text>
        </Link>
        <Link to="/chris" underlayColor='#f0f4f7'>
          <Text>Chris (dynamic)</Text>
        </Link>
      </View>

      {/*
          Sometimes you want to have a whitelist of static paths
          like "/about" and "/company" but also allow for dynamic
          patterns like "/:user". The problem is that "/about"
          is ambiguous and will match both "/about" and "/:user".
          Most routers have an algorithm to decide for you what
          it will match since they only allow you to match one
          "route". React Router lets you match in multiple places
          on purpose (sidebars, breadcrumbs, etc). So, when you
          want to clear up any ambiguous matching, and not match
          "/about" to "/:user", just wrap your <Route>s in a
          <Switch>. It will render the first one that matches.
      */}
      <Switch>
        <Route path="/about" component={About}/>
        <Route path="/company" component={Company}/>
        <Route path="/:user" component={User}/>
      </Switch>
    </View>
  </NativeRouter>
)

const styles = StyleSheet.create({
  container: {
    marginTop: 25,
    padding: 10,
  },
  header: {
    fontSize: 20,
  },
})

export default AmbiguousExample