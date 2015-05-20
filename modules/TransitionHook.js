var { object } = require('react').PropTypes;

var TransitionHook = {

  contextTypes: {
    router: object.isRequired
  },

  componentDidMount () {
    var router = this.context.router;
    router.addTransitionHook(this.routerWillLeave);
  },

  componentWillUnmount () {
    var router = this.context.router;
    router.removeTransitionHook(this.routerWillLeave);
  }

};

module.exports = TransitionHook;

