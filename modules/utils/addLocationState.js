var assign = require('react/lib/Object.assign');
var Path = require('./Path');

function addLocationState (location) {

  var _changeListeners = [];
  var _isListening = false;
  var _ignoreNext = false;

  function withState (path, state) {
    return Path.withQuery(path, {
      _state: state
    });
  }

  function withoutState (path) {
    var query = Path.extractQuery(path);
    if (!query) {
      return path;
    }

    delete query._state;

    return Path.withQuery(Path.withoutQuery(path), query);
  }

  function extractState (path) {
    var query = Path.extractQuery(path);
    return query && query._state;
  }

  function notifyChange (change) {
    _changeListeners.forEach(function (listener) {
      listener(change);
    });
  }

  function onLocationChange (change) {
    if (_ignoreNext) {
      _ignoreNext = false;
      return;
    }

    change.state = extractState(change.path);
    change.path = withoutState(change.path);
    notifyChange(change);
  }


  return assign({}, location, {

    supportsState: true,

    addChangeListener: function (listener) {
      _changeListeners.push(listener);

      if (!_isListening) {
        location.addChangeListener && location.addChangeListener(onLocationChange);
        _isListening = true;
      }
    },

    removeChangeListener: function (listener) {
      _changeListeners = _changeListeners.filter(function (l) {
        return l !== listener;
      });

      if (_changeListeners.length === 0) {
        location.removeChangeListener && location.removeChangeListener(onLocationChange);
        _isListening = false;
      }
    },

    getCurrentPath: function () {
      return withoutState(location.getCurrentPath());
    },

    getCurrentState: function () {
      return extractState(location.getCurrentPath());
    },

    push: function (path, state) {
      location.push(withState(path, state));
    },

    replace: function (path, state) {
      location.replace(withState(path, state));
    },

    replaceState: function (state, silent) {
      if (silent === true)
        _ignoreNext = true;

      location.replace(withState(location.getCurrentPath(), state));
    },

    toString: function () {
      return location.toString() + ' (with state)';
    }

  });
}

module.exports = addLocationState;