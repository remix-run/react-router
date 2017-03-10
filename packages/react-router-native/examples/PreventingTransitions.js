import React from 'react'
import { StyleSheet, Text, View, TextInput, TouchableOpacity } from 'react-native'
import { NativeRouter, Route, Link , Prompt } from 'react-router-native'

class Form extends React.Component {
  state = {
    isBlocking: false,
    text: '',
  }

  handleClick = (event) => {
    event.preventDefault()
    this.setState({
      isBlocking: false,
      text: '',
    })
  }

  render() {
    const { isBlocking } = this.state

    return (
      <View>
        <Prompt
          when={isBlocking}
          message={location => (
            `Are you sure you want to go to ${location.pathname}`
          )}
        />

        <Text>
          Blocking? {isBlocking ? 'Yes, click a link or the back button' : 'Nope'}
        </Text>

        <TextInput
          value={this.state.text}
          style={{height: 40, borderWidth: 1, borderColor: 'black'}}
          placeholder="Type here to block transitions!"
          onChangeText={(text) => {
            this.setState({
              isBlocking: text.length > 0,
              text,
            })
          }}
        />

        <TouchableOpacity style={styles.btn} onPress={this.handleClick}>
          <Text>Reset Blocking</Text>
        </TouchableOpacity>
      </View>
    )
  }
}

const About = () => (
  <Text style={styles.header}>
    About
  </Text>
)

const Friends = () => (
  <Text style={styles.header}>
    Friends
  </Text>
)


const CustomLinkExample = () => (
  <NativeRouter>
    <View style={styles.container}>
      <View style={styles.nav}>
        <Link
          to="/"
          underlayColor='#f0f4f7'
          style={styles.navItem}>
            <Text>Home</Text>
        </Link>
        <Link
          to="/about"
          underlayColor='#f0f4f7'
          style={styles.navItem}>
            <Text>About</Text>
        </Link>
        <Link
          to="/friends"
          underlayColor='#f0f4f7'
          style={styles.navItem} >
            <Text>Friends</Text>
        </Link>
      </View>


      <Route exact path="/" component={Form}/>
      <Route path="/about" component={About}/>
      <Route path="/friends" component={Friends}/>
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
  btn: {
    width: 200,
    backgroundColor: '#E94949',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    marginTop: 10,
  }
})

export default CustomLinkExample
