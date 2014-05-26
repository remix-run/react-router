var React = require('react');
var routeStore = require('../stores/route-store');
var urlStore = require('../stores/url-store');
var qs = require('querystring');

var Link = React.createClass({

  statics: {

    makeHref: function (routeName, params) {
      var base = urlStore.getLocation() === 'history' ? '/' : '#/';
      var href = base + routeStore.makePathForRouteName(routeName, params);
      return params.query ? href += '?'+qs.stringify(params.query) : href;
    }

  },

  getInitialState: function() {
    return {
      href: Link.makeHref(this.props.to, this.props),
      isActive: this.isActive()
    };
  },

  handleRouteChange: function() {
    this.setState({
      isActive: this.isActive()
    });
  },

  getRoute: function () {
    return routeStore.getRouteByName(this.props.to);
  },

  isActive: function() {
    return routeStore.isActiveRoute(this.getRoute(), this.props);
  },

  componentDidMount: function() {
    // must subscribe in didMount so the subscription is after the RootRoute
    // subscription
    urlStore.subscribe(this.handleRouteChange);
  },

  componentWillUnmount: function() {
    urlStore.unsubscribe(this.handleRouteChange);
  },

  handleClick: function(event) {
    if (event.metaKey || event.ctrlKey || event.shiftKey) {
      return;
    }
    event.preventDefault();
    urlStore.push(this.state.href);
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

module.exports = Link;

