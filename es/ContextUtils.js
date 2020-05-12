import React from 'react';
import PropTypes from 'prop-types';

// Works around issues with context updates failing to propagate.
// Caveat: the context value is expected to never change its identity.
// https://github.com/facebook/react/issues/2517
// https://github.com/reactjs/react-router/issues/470

var contextProviderShape = PropTypes.shape({
  subscribe: PropTypes.func.isRequired,
  eventIndex: PropTypes.number.isRequired
});

function makeContextName(name) {
  return '@@contextSubscriber/' + name;
}

var prefixUnsafeLifecycleMethods = typeof React.forwardRef !== 'undefined';

export function ContextProvider(name) {
  var _childContextTypes, _config;

  var contextName = makeContextName(name);
  var listenersKey = contextName + '/listeners';
  var eventIndexKey = contextName + '/eventIndex';
  var subscribeKey = contextName + '/subscribe';

  var config = (_config = {
    childContextTypes: (_childContextTypes = {}, _childContextTypes[contextName] = contextProviderShape.isRequired, _childContextTypes),

    getChildContext: function getChildContext() {
      var _ref;

      return _ref = {}, _ref[contextName] = {
        eventIndex: this[eventIndexKey],
        subscribe: this[subscribeKey]
      }, _ref;
    },


    // this method will be updated to UNSAFE_componentWillMount below for React versions >= 16.3
    componentWillMount: function componentWillMount() {
      this[listenersKey] = [];
      this[eventIndexKey] = 0;
    },


    // this method will be updated to UNSAFE_componentWillReceiveProps below for React versions >= 16.3
    componentWillReceiveProps: function componentWillReceiveProps() {
      this[eventIndexKey]++;
    },
    componentDidUpdate: function componentDidUpdate() {
      var _this = this;

      this[listenersKey].forEach(function (listener) {
        return listener(_this[eventIndexKey]);
      });
    }
  }, _config[subscribeKey] = function (listener) {
    var _this2 = this;

    // No need to immediately call listener here.
    this[listenersKey].push(listener);

    return function () {
      _this2[listenersKey] = _this2[listenersKey].filter(function (item) {
        return item !== listener;
      });
    };
  }, _config);

  if (prefixUnsafeLifecycleMethods) {
    config.UNSAFE_componentWillMount = config.componentWillMount;
    config.UNSAFE_componentWillReceiveProps = config.componentWillReceiveProps;
    delete config.componentWillMount;
    delete config.componentWillReceiveProps;
  }
  return config;
}

export function ContextSubscriber(name) {
  var _contextTypes, _config2;

  var contextName = makeContextName(name);
  var lastRenderedEventIndexKey = contextName + '/lastRenderedEventIndex';
  var handleContextUpdateKey = contextName + '/handleContextUpdate';
  var unsubscribeKey = contextName + '/unsubscribe';

  var config = (_config2 = {
    contextTypes: (_contextTypes = {}, _contextTypes[contextName] = contextProviderShape, _contextTypes),

    getInitialState: function getInitialState() {
      var _ref2;

      if (!this.context[contextName]) {
        return {};
      }

      return _ref2 = {}, _ref2[lastRenderedEventIndexKey] = this.context[contextName].eventIndex, _ref2;
    },
    componentDidMount: function componentDidMount() {
      if (!this.context[contextName]) {
        return;
      }

      this[unsubscribeKey] = this.context[contextName].subscribe(this[handleContextUpdateKey]);
    },


    // this method will be updated to UNSAFE_componentWillReceiveProps below for React versions >= 16.3
    componentWillReceiveProps: function componentWillReceiveProps() {
      var _setState;

      if (!this.context[contextName]) {
        return;
      }

      this.setState((_setState = {}, _setState[lastRenderedEventIndexKey] = this.context[contextName].eventIndex, _setState));
    },
    componentWillUnmount: function componentWillUnmount() {
      if (!this[unsubscribeKey]) {
        return;
      }

      this[unsubscribeKey]();
      this[unsubscribeKey] = null;
    }
  }, _config2[handleContextUpdateKey] = function (eventIndex) {
    if (eventIndex !== this.state[lastRenderedEventIndexKey]) {
      var _setState2;

      this.setState((_setState2 = {}, _setState2[lastRenderedEventIndexKey] = eventIndex, _setState2));
    }
  }, _config2);

  if (prefixUnsafeLifecycleMethods) {
    config.UNSAFE_componentWillReceiveProps = config.componentWillReceiveProps;
    delete config.componentWillReceiveProps;
  }
  return config;
}