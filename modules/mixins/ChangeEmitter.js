var React = require('react');
var EventEmitter = require('events').EventEmitter;

var CHANGE_EVENT = 'change';

/**
 * A mixin for components that emit change events. ActiveDelegate uses
 * this mixin to notify descendant ActiveState components when the
 * active state changes.
 */
var ChangeEmitter = {

  propTypes: {
    maxChangeListeners: React.PropTypes.number.isRequired
  },

  getDefaultProps: function () {
    return {
      maxChangeListeners: 0
    };
  },

  componentWillMount: function () {
    this._events = new EventEmitter;
    this._events.setMaxListeners(this.props.maxChangeListeners);
  },

  componentWillReceiveProps: function (nextProps) {
    this._events.setMaxListeners(nextProps.maxChangeListeners);
  },

  componentWillUnmount: function () {
    this._events.removeAllListeners();
  },

  addChangeListener: function (listener) {
    this._events.addListener(CHANGE_EVENT, listener);
  },

  removeChangeListener: function (listener) {
    this._events.removeListener(CHANGE_EVENT, listener);
  },

  emitChange: function () {
    this._events.emit(CHANGE_EVENT);
  }

};

module.exports = ChangeEmitter;
