import React, { Component, PropTypes } from 'react'
import {
  Text,
  View,
  ScrollView
} from 'react-native'

////////////////////////////////////////////////////////////
import { NativeRouter, Link, Route, Redirect } from '../main'
import StackRoute from '../experimental/StackRoute'
import { TabRoutes, TabRoute } from '../experimental/TabRoutes'

////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////
const stuff = [
  { path: 'one', label: 'This is the first one' },
  { path: 'two', label: 'Este es el segundo' },
  { path: 'three', label: 'Three is the magic number' },
  { path: 'four', label: 'Four score and 7 years ago' }
]

const blue = 'hsl(200, 50%, 50%)'

class RecursiveItem extends Component {
  render() {
    const { match, rootPath } = this.props
    const path = rootPath ? rootPath : `${match.url}/:id`
    return (
      <StackRoute
        isRoot={!!rootPath}
        path={path}
        renderTitle={({ match }) => (
          <Text style={{ textAlign: 'center' }} ellipsizeMode="middle" numberOfLines={1}>
            {match.url}
          </Text>
        )}
        renderContent={({ match }) => (
          <ScrollView style={{ paddingLeft: 30, flex: 1, backgroundColor: 'white' }}>
            {stuff.map(thing => (
              <View key={thing.path} style={{ borderBottomWidth: 1, borderColor: '#ddd' }}>
                <Link replace={true} to={`${match.url}/${thing.path}`} underlayColor="#f0f0f0">
                  <Text style={{ padding: 15, paddingLeft: 0 }}>{thing.label}</Text>
                </Link>
              </View>
            ))}
          </ScrollView>
        )}
        renderChild={(props) => (
          <RecursiveItem {...props}/>
        )}
      />
    )
  }
}

const App = () => (
  <NativeRouter>
    <View style={{ flex: 1, marginTop: 20 }}>
      <Route path="/" exact render={() => <Redirect to="/home"/>}/>

      <TabRoutes>
        <TabRoute path="/home"
          renderContent={(props) => (
            <RecursiveItem rootPath="/home"/>
          )}
          renderTab={({ isActive }) => (
            <Text style={{ color: isActive ? blue : null }}>
              Home
            </Text>
          )}
        />

        <TabRoute path="/notifications"
          renderContent={(props) => (
            <View>
              <Text style={{ fontSize: 30 }}>
                Notifications
              </Text>
            </View>
          )}
          renderTab={({ isActive }) => (
            <Text style={{ color: isActive ? blue : null }}>
              Notifications
            </Text>
          )}
        />

        <TabRoute path="/messages"
          renderContent={(props) => (
            <RecursiveItem rootPath="/messages"/>
          )}
          renderTab={({ isActive }) => (
            <Text style={{ color: isActive ? blue : null }}>
              Messages
            </Text>
          )}
        />
      </TabRoutes>
    </View>
  </NativeRouter>
)

export default App
