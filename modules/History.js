import React from 'react';
import invariant from 'invariant';
import qs from 'qs';
import { history } from './PropTypes';
var { func } = React.PropTypes;

var RequiredSubclassMethods = [ 'push', 'replace', 'go' ];

function stringifyQuery(query) {
  return stringify(query, { arrayFormat: 'brackets' });
}

/**
 * A history interface that normalizes the differences across
 * various environments and implementations. Requires concrete
 * subclasses to implement the following methods:
 *
 * - push(path)
 * - replace(path)
 * - go(n)
 */
class History extends React.Component {

  static propTypes = {
    parseQueryString: func.isRequired,
    stringifyQuery: func.isRequired
  };

  static defaultProps = {
    parseQueryString: qs.parse,
    stringifyQuery: qs.stringify
  };

  constructor(props, context) {
    super(props, context);
    this.state = {
      location: null
    };
  }

  componentWillMount() {
    invariant(
      this.constructor !== History,
      'History is not usable directly; you must use one of its subclasses'
    );

    RequiredSubclassMethods.forEach(function (method) {
      invariant(
        typeof this[method] === 'function',
        '%s needs a "%s" method',
        this.constructor.name, method
      );
    }, this);
  }

  back() {
    this.go(-1);
  }

  forward() {
    this.go(1);
  }

  parseQueryString(queryString) {
    return this.props.parseQueryString(queryString);
  }

  stringifyQuery(query) {
    return this.props.stringifyQuery(query);
  }

  makePath(path, query) {
    if (query) {
      var queryString = this.stringifyQuery(query);

      if (queryString !== '')
        return path + '?' + queryString;
    }

    return path;
  }

  makeHref(path, query) {
    return this.makePath(path, query);
  }

  render() {
    var element = React.Children.only(this.props.children);

    return React.cloneElement(element, {
      location: this.state.location,
      historyContext: this
    });
  }

}

export default History;
