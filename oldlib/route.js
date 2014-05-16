module url from './url';
module activeRoutes from './active-routes';

export default {

  getInitialState: function() {
    return {activeChild: null};
  },

  componentDidMount: function(path) {
    this.handleRouteChange();
    url.subscribe(this.handleRouteChange);
  },

  componentWillUnmount: function() {
    url.unsubscribe(this.handleRouteChange);
  },

  handleRouteChange: function() {
    var path = location.hash.substr(1);
    var match = matchedChildRoute(path, this);
    console.group('handleRouteChange', this.props.path);
    console.log(this.state.params);
    console.log(lastParams);
    console.groupEnd(this.props.path);
    this.setState({
      activeChild: match,
      params: lastParams
    });
  }
};

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
      activeRoutes.add(children[i]);
      return children[i];
    }
    if (children[i].props.children) {
      var matchedGrandchild = matchedChildRoute(actualPath, children[i]);
      if (matchedGrandchild) {
        activeRoutes.add(children[i]);
        return children[i];
      }
    }
  }
  return false;
}


