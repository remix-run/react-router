var lastParams;

export function findActiveChild(currentPath, component) {
  var children = childrenArray(component);
  for (var i = 0, l = children.length; i < l; i ++) {
    if (pathMatches(currentPath, children[i].props.path)) {
      return children[i];
    }
    if (!children[i].props.children) {
      continue;
    }
    var matchedGrandchild = findActiveChild(currentPath, children[i]);
    if (matchedGrandchild) {
      return children[i];
    }
  }
  return false;
}

export function getLastParams() {
  return lastParams;
}

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

function toArray(maybeArray) {
  return Array.isArray(maybeArray) ? maybeArray : [maybeArray];
}

function childrenArray(component) {
  return component.props.children ? toArray(component.props.children) : [];
}

function startsWith(match, str) {
  return str.charAt(0) === match;
}


