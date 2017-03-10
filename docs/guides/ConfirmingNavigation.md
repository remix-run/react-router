# Confirming Navigation

If you are using ES6 classes, then you can't use mixins and so you need to make use of `history`. You can find an example of "Confirming Navigation" in the [rackt/history repo](https://github.com/rackt/history/blob/master/docs/ConfirmingNavigation.md).

You can prevent a transition from happening or prompt the user before leaving a [route](/docs/Glossary.md#route) with a leave hook.

```js
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

Note that this example makes use of the [withRouter](/upgrade-guides/v2.4.0.md) higher-order component introduced in v2.4.0.
