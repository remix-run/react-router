---
layout: page
title: "Confirming Navigation"
category: doc
date: 2016-02-16 19:28:26
order: 6
---

You can prevent a transition from happening or prompt the user before leaving a [route](/docs/Glossary.md#route) with a leave hook.

```js
const Home = React.createClass({

  contextTypes: {
    router: React.PropTypes.object
  },

  componentDidMount() {
    this.context.router.setRouteLeaveHook(this.props.route, this.routerWillLeave)
  },

  routerWillLeave(nextLocation) {
    // return false to prevent a transition w/o prompting the user,
    // or return a string to allow the user to decide:
    if (!this.state.isSaved)
      return 'Your work is not saved! Are you sure you want to leave?'
  },

  // ...

})
```
