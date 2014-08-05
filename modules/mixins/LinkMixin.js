React = require('react');
ActiveState = require('./ActiveState');
var makeHref = require('../helpers/makeHref');
var transitionTo = require('../helpers/transitionTo');
var withoutProperties = require('../helpers/withoutProperties');
var mergeProperties = require('../helpers/mergeProperties');

/**
 * A map of component props that are reserved for use by the
 * router and/or React. All other props are used as params that are
 * interpolated into the link's path.
 */
var RESERVED_PROPS = {
  to: true,
  className: true,
  activeClassName: true,
  query: true,
  children: true // ReactChildren
};

LinkMixin = {
  mixins: [ ActiveState ],

  statics: {
    getUnreservedProps: getUnreservedProps
  },

  propTypes: {
    to: React.PropTypes.string.isRequired,
    query: React.PropTypes.object
  },

  getInitialState: function () {
    return {
      isActive: false
    };
  },

  /**
   * Returns a hash of URL parameters to use in this <Component>'s path.
   */
  getParams: function () {
    return getUnreservedProps(this.props, this.additionalReservedProps);
  },

  /**
   * Returns the value of the "href" attribute to use on the DOM element.
   */
  getHref: function () {
    return makeHref(this.props.to, this.getParams(), this.props.query);
  },

  componentWillReceiveProps: function (nextProps) {
    var params = getUnreservedProps(nextProps, this.additionalReservedProps);

    this.setState({
      isActive: ActiveState.statics.isActive(nextProps.to, params, nextProps.query)
    });
  },

  updateActiveState: function () {
    this.setState({
      isActive: ActiveState.statics.isActive(this.props.to, this.getParams(), this.props.query)
    });
  },

  handleClick: function (event) {
    if (isModifiedEvent(event) || !isLeftClick(event))
      return;

    event.preventDefault();

    transitionTo(this.props.to, this.getParams(), this.props.query);
  }
};

function isLeftClick(event) {
  return event.button === 0;
}

function isModifiedEvent(event) {
  return !!(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey);
}

function getUnreservedProps(props, additionalReservedProps) {
  var reservedProps;

  if (additionalReservedProps) {
    reservedProps = mergeProperties({}, RESERVED_PROPS)
    reservedProps = mergeProperties(reservedProps, additionalReservedProps);
  } else {
    reservedProps = RESERVED_PROPS;
  }

  return withoutProperties(props, reservedProps);
}

module.exports = LinkMixin;
