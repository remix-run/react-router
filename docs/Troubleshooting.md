# Troubleshooting

### How to get previous path?

```js
<Route component={App}>
  {/* ... other routes */
</Route>

var App = React.createClass({
  getInitialState() {
    return { showBackButton: false }
  },

  componentWillReceiveProps(nextProps) {
    var routeChanged = nextProps.location !== this.props.location;
    this.setState({ showBackButton: routeChanged });
  }
});
```