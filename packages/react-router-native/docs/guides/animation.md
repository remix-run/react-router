# Animation

This guide is a little sparse right now, but should provide enough insight to help you implement some great animations if you're already comfortable with animations generally. Because React Router mostly is just components, all the typical animation strategies apply. The only difference is the things that trigger an animation. This guide attempts to spark some inspiration rather than provide copy/paste code.

# Element Transitions

As the user navigates, some elements should animate while remaining on the
page. The [`Route`][Route] `children` prop is perfect for these situations.

Consider this app without the router. When the `<TouchableHighlight/>` is pressed
the sidebar's animation will toggle.

```jsx
class Sidebar extends Component {
  state {
    anim: new Animated.Value(
      this.props.isOpen ? 0 : 1
    )
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.isOpen !== this.props.isOpen) {
      Animated.timing(this.state.anim, {
        toValue: nextProps.isOpen ? 1 : 0
      }).start()
    }
  }

  render() {
    // ...
  }
}

class App extends Component {
  state = {
    sidebarIsOpen: false
  }

  render() {
    const { sidebarIsOpen } = this.state
    return (
      <View>
        <Sidebar isOpen={sidebarIsOpen}/>
        <TouchableHighlight onPress={() => {
          this.setState(state => !state.sidebarIsOpen)
        }}>
          <Text>Open Sidebar</Text>
        </TouchableHighlight>
        <Screen/>
      </View>
    )
  }
}
```

Now we can swap out the state with a route, making it possible to deep link to the sidebar being open from anywhere, or even deep link from other apps.

```jsx
class App extends Component {
  render() {
    return (
      <View>
        <Route path="/sidebar" children={({ match }) => (
          // `children` always renders, match or not. This
          // way we can always render the sidebar, and then
          // tell it if its open or not
          <Sidebar isOpen={!!match}/>
        )}/>
        <Link to="/sidebar">
          <Text>Open Sidebar</Text>
        </Link>
        <Screen/>
      </View>
    )
  }
}
```

This can be very interesting in lists. For each item in the list you can
make a route that matches it, and then do an animation to open or close
that section of the list, or transition one of its elements to the
header.

```jsx
<View>
  {chutneys.map(chutney => (
    <Route path={`/chutney/${chutney.id}`}>
      {({ match }) => (
        <Chutney isActive={match}/>
      )}
    </Route>
  ))}
</View>
```

Each chutney has its own route thats always rendering as part of the list, when it becomes active (they tapped the item or from some other means), it could animate an image to the header with fixed positioning (and then probably stop rendering after the animation is complete and letting the "real" header scroll w/ the page).

## Page Transitions

Because of components' declarative nature, when you're at one screen, press a link, and navigate to another, the old page is not in the render tree to even animate anymore! The key is remembering that React elements are just objects. You can save them and render them again.  That's the strategy for animating from one page (that leaves the render tree) to another.

If you visited this site on mobile, or you shrink the browser really small, you can click the back button to see this type of animation.  The strategy is to not think about animations at first. Just render your routes and links and make that all work, then wrap your components with animated components to spiff things up.

We'll consider some child routes in a page:

```jsx
class Parent extends Component {
  render() {
    return (
      <View>
        <Switch>
          <Route path="/settings"/>
          <Route path="/notifications"/>
        </Switch>
      </View>
    )
  }
}
```

Once that works without animations, we're ready to add an animation around it.


```jsx
<AnimatedChild
  anim={this.state.anim}
  atParent={this.props.match.isExact}
  animating={this.state.animating}
>
  <Switch location={this.props.location}>
    <Route path="/settings"/>
    <Route path="/notifications"/>
  </Switch>
</AnimatedChild>
```

It's important to use a [`<Switch>`][Switch]. It will ensure that only one route can match, and therefore gives us a single element on `props.children` to hang on to and render during the animation. Finally, you *must* pass the location to `Switch`. It prefers `props.location` over the internal router location, which enables the saved child element to be renered later and continue to match the old location.

There are a handful of props handed to `AnimatedChild` that the parent will know about as it manages the animation. Again, this guide is more inspiration than copy/paste right now, feel free to look at the source of this website for exact implementation. Alright, let's check out the implementation of `AnimatedChild` (it's copy pasted from the animation used on this site).

```jsx
class AnimatedChildRoute extends Component {

  static propTypes = {
    children: PropTypes.node,
    anim: PropTypes.object,
    atParent: PropTypes.bool,
    animating: PropTypes.bool
  }

  state = {
    // we're going to save the old children so we can render
    // it when it doesnt' actually match the location anymore
    previousChildren: null
  }

  componentWillReceiveProps(nextProps) {
    // figure out what to do with the children
    const navigatingToParent = nextProps.atParent && !this.props.atParent
    const animationEnded = this.props.animating && !nextProps.animating

    if (navigatingToParent) {
      // we were rendering, but now we're heading back up to the parent,
      // so we need to save the children (har har) so we can render them
      // while the animation is playing
      this.setState({
        previousChildren: this.props.children
      })
    } else if (animationEnded) {
      // When we're done animating, we can get rid of the old children.
      this.setState({
        previousChildren: null
      })
    }
  }

  render() {
    const { anim, children } = this.props
    const { previousChildren } = this.state
    return (
      <Animated.View style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: anim.interpolate({
          inputRange: [ 0, 1 ],
          outputRange: [ 20, 0 ]
        }),
        opacity: anim.interpolate({
          inputRange: [ 0, 0.75 ],
          outputRange: [ 0, 1 ]
        })
      }}>
        {/* render the old ones if we have them */}
        {previousChildren || children}
      </Animated.View>
    )
  }
}
```

Hope that helps get you thinking. Again, the animations themselves are the same with the router or not, the difference is knowing when to trigger them. Here's a list for things to check in `componentWillReceiveProps` to decide what to do with an animation based on the router's location:

General change in location

```js
nextProps.location !== this.props.location`
```

Going from child to parent:

```js
nextProps.match.isExact && !this.props.match.isExact
```

Going from parent to child:

```js
!nextProps.match.isExact && this.props.match.isExact
```

Good luck! We hope to expand on this section with a lot more detail and live examples.

  [Route]:../api/Route.md
  [Switch]:../api/Switch.md
