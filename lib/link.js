import React from 'react';
import makeHref from './make-href';
module url from './url';
module routeStore from './route-store';

var Link = React.createClass({

  getInitialState: function() {
    return {
      href: makeHref(this.props.to, this.props),
      isActive: this.isActive()
    };
  },

  handleRouteChange: function() {
    this.setState({
      isActive: this.isActive()
    });
  },

  isActive: function() {
    var active = routeStore.getActive();
    for (var i = 0, l = active.length; i < l; i++) {
      if (this.props.to === active[i].route.props.name) {
        if (!active[i].params) {
          return true;
        }
        return paramsAreActive(active[i].params, this.props);
      }
    }
    return false;
  },

  componentDidMount: function() {
    // must subscribe in didMount so the subscription is after the RootRoute
    // subscription
    url.subscribe(this.handleRouteChange);
  },

  componentWillUnmount: function() {
    url.unsubscribe(this.handleRouteChange);
  },

  handleClick: function(event) {
    if (event.metaKey || event.ctrlKey || event.shiftKey) {
      return;
    }
    event.preventDefault();
    url.push(this.state.href);
  },

  className: function() {
    var className = this.props.className || '';
    if (this.state.isActive) {
      className += ' active';
    }
    return className;
  },

  render: function() {
    return React.DOM.a({
      href: this.state.href,
      onClick: this.handleClick,
      className: this.className()
    }, this.props.children);
  }
});

function paramsAreActive(params, props) {
  for (var key in params) {
    if (props[key] !== params[key]) {
      return false;
    }
  }
  return true;
}

export default Link;

