import React from 'react';
import HashHistory from './HashHistory';
import AsyncRouting from './AsyncRouting';
import TransitionManager from './TransitionManager';
import AsyncProps from './AsyncProps';
import RouteRenderer from './RouteRenderer';
import ScrollManager from './ScrollManager';
import Renderer from './Renderer';
import isReactChildren from './isReactChildren';
import createRoutesFromReactChildren from './createRoutesFromReactChildren';
import { routes, component } from './PropTypes';
var { array, func } = React.PropTypes;

export default class Router extends React.Component {

  static propTypes = {
    children: routes.isRequired,
    initialRoutingState: array,
    initialBranchData: array,
    parseQueryString: func,
    stringifyQueryString: func,
    renderRouteComponent: func,

    History: component,
    Routing: component,
    TransitionManager: component,
    DataProvider: component,
    RouteRenderer: component,
    ScrollManager: component,
    Renderer: component
  };

  static defaultProps = {
    History: HashHistory,
    Routing: AsyncRouting,
    TransitionManager,
    DataProvider: AsyncProps,
    RouteRenderer,
    ScrollManager,
    Renderer
  };

  render () {
    var routes = isReactChildren(this.props.children) ?
      createRoutesFromReactChildren(routes) : this.props.children;

    var {
      History,
      Routing,
      TransitionManager,
      DataProvider,
      RouteRenderer,
      ScrollManager,
      Renderer,
      initialRoutingState,
      initialBranchData,
      parseQueryString,
      stringifyQueryString,
      renderRouteComponent
    } = this.props;

    return (
      <History
        parseQueryString={parseQueryString}
        stringifyQueryString={stringifyQueryString}
      >
        <Routing
          routes={routes}
          initialRoutingState={initialRoutingState}
        >
          <TransitionManager>
            <DataProvider initialBranchData={initialBranchData}>
              <RouteRenderer renderComponent={renderRouteComponent}>
                <ScrollManager>
                  <Renderer/>
                </ScrollManager>
              </RouteRenderer>
            </DataProvider>
          </TransitionManager>
        </Routing>
      </History>
    );
  }
}

