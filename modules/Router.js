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
var { array, func, any } = React.PropTypes;

export default class Router extends React.Component {

  static propTypes = {
    children: routes,
    initialRoutingState: array,
    initialBranchData: array,
    parseQueryString: func,
    stringifyQueryString: func,
    renderRouteComponent: func,

    History: any,
    Routing: any,
    TransitionManager: any,
    DataProvider: any,
    RouteRenderer: any,
    ScrollManager: any,
    Renderer:any,
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
      createRoutesFromReactChildren(this.props.children) :
      this.props.children;

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

