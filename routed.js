/** @jsx React.DOM */

var url = {
  subscribe: function(fn) {
    // TODO: make this a single hashchange/pushstate listener and push handlers
    // into it
    window.addEventListener('hashchange', fn, false);
  },

  unsubscribe: function(fn) {
    window.removeEventListener('hashchange', fn);
  }
};

var Routed = {

  getInitialState: function() {
    return {activeChild: null};
  },

  componentWillMount: function(path) {
    this.handleRouteChange();
    url.subscribe(this.handleRouteChange);
  },

  componentWillUnmount: function() {
    url.unsubscribe(this.handleRouteChange);
  },

  handleRouteChange: function() {
    var path = location.hash.substr(1);
    var match = matchedChildRoute(path, this);
    this.setState({
      activeChild: match,
      params: lastParams
    });
  },

  outlet: function() {
    var children = this.props.children;
    if (!children) throw new Error("you don't have any children, why are you calling outlet()?");
    return this.state.activeChild;
  }

};

function pushUrl(path) {
  location.hash = path;
}

function toArray(maybeArray) {
  return Array.isArray(maybeArray) ? maybeArray : [maybeArray];
}

function childrenArray(component) {
  return component.props.children ? toArray(component.props.children) : [];
}

function startsWith(match, str) {
  return str.charAt(0) === match;
}

var lastParams = {};

function pathMatches(actualPath, testPath) {
  var testSegments = testPath.split('/');
  var actualSegments = actualPath.split('/');
  // HEADS UP GLOBAL STATE SIDE-EFFECTS! http://img.pandawhale.com/46707-dog-I-have-no-idea-what-Im-doi-xPst.jpeg
  lastParams = {};
  for (var i = 0, l = testSegments.length; i < l; i ++) {
    if (actualSegments[i] === '' && testSegments[i] === '') {
      // its a '/', who cares ...
      continue;
    }
    if (actualSegments[i] == null) {
      return false;
    }
    if (startsWith(':', testSegments[i])) {
      var segmentName = testSegments[i].substr(1);
      lastParams[segmentName] = actualSegments[i];
    } else {
      if (testSegments[i] !== actualSegments[i]) {
        return false;
      }
    }
  }
  return true;
}

function matchedChildRoute(actualPath, component) {
  var children = childrenArray(component);
  for (var i = 0, l = children.length; i < l; i ++) {
    if (pathMatches(actualPath, children[i].props.path)) {
      return children[i];
    }
    if (children[i].props.children) {
      var matchedGrandchild = matchedChildRoute(actualPath, children[i]);
      if (matchedGrandchild) {
        return children[i];
      }
    }
  }
  return false;
}

var Link = React.createClass({
  handleClick: function(event) {
    event.preventDefault();
    var path = this.props.to;
    pushUrl(path);
  },

  render: function() {
    return (
      <a href={this.props.to} onClick={this.handleClick}>{this.props.children}</a>
    );
  }
});

