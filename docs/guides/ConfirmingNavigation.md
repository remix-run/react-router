# Confirming Navigation

You can prevent a transition from happening or prompt the user before leaving a [route](/docs/Glossary.md#route) with a leave hook.

```jsx
const Home = withRouter(
  React.createClass({

    componentDidMount() {
      this.props.router.setRouteLeaveHook(this.props.route, this.routerWillLeave)
    },

    routerWillLeave(nextLocation) {
      // return false to prevent a transition w/o prompting the user,
      // or return a string to allow the user to decide:
      if (!this.state.isSaved)
        return 'Your work is not saved! Are you sure you want to leave?'
    },

    // ...

  })
)
```

Note that this example makes use of the [withRouter](https://github.com/reactjs/react-router/blob/v2.4.0/upgrade-guides/v2.4.0.md) higher-order component introduced in v2.4.0.
