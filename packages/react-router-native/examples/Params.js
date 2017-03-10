import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { NativeRouter, Route, Link } from 'react-router-native'

const Child = ({ match }) => (
  <Text>ID: {match.params.id}</Text>
)

const ParamsExample = () => (
  <NativeRouter>
    <View style={styles.container}>
      <Text style={styles.header}>Accounts</Text>
      <View style={styles.nav}>
        <Link
          to="/netflix"
          style={styles.navItem}
          underlayColor='#f0f4f7'>
            <Text>Netflix</Text>
        </Link>
        <Link
          to="/zillow-group"
          style={styles.navItem}
          underlayColor='#f0f4f7'>
            <Text>Zillow Group</Text>
        </Link>
        <Link
          to="/yahoo"
          style={styles.navItem}
          underlayColor='#f0f4f7'>
            <Text>Yahoo</Text>
        </Link>
        <Link
          to="/modus-create"
          style={styles.navItem}
          underlayColor='#f0f4f7'>
            <Text>Modus Create</Text>
        </Link>
      </View>
      <Route path="/:id" component={Child}/>
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
  nav: {
    flexDirection: 'row',
    justifyContent: 'space-around'
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    padding: 10,
  },
})

export default ParamsExample