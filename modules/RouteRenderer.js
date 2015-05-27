import React from 'react';
import passMiddlewareProps from './passMiddlewareProps';
import Location from './Location';
import invariant from 'invariant';
import assign from 'object-assign';

var { createElement } = React;
var { branch, element, object, any, array, instanceOf, func } = React.PropTypes;

export default class RouteRenderer extends React.Component {

  static propTypes = {
    branch: array,
    params: object,
    query: any,
    location: instanceOf(Location),
    branchData: array,
    renderComponent: func,
    historyContext: any,
    children: element
  };

  static defaultProps = {
    renderComponent (Component, props) {
      return <Component {...props}/>
    },
    branchData: []
  };

  static childContextTypes = {
    router: React.PropTypes.any
  };

  getChildContext () {
    return {
      // only export one thing to context, keep our footprint small
      router: {
        pathIsActive: (path, query) => {
          return this.pathIsActive(path, query)
        },
        history: this.props.historyContext,
      }
    }
  }

  pathIsActive(path, query) {
    // FIXME: this is incomplete, need to check query, and
    // if a parent is active when its children are
    return this.props.location.path === path;
  }

  render () {
    var { location, params, query, branchData } = this.props;

    var element = this.props.branch.reduceRight((element, route, index) => {
      var components = route.component || route.components;

      if (components == null)
        return element; // Don't create new children; use the grandchildren.

      var props = assign({ location, params, query, route }, branchData[index]);

      if (React.isValidElement(element)) {
        assign(props, { children: element });
      } else if (element) {
        // In render, use children like:
        // var { header, sidebar } = this.props;
        assign(props, element);
      }

      if (typeof components === 'object') {
        var elements = {};
        for (var key in components)
          if (components.hasOwnProperty(key)) {
            let data = (branchData[index] && branchData[index][key]);
            elements[key] = this.props.renderComponent(
              components[key], assign({}, props, data)
            );
          }
        return elements;
      }

      return this.props.renderComponent(components, props);
    }, element);

    invariant(
      React.isValidElement(element),
      'The root route must render a single component'
    );

    return passMiddlewareProps(this.props, { element });
  }

}

