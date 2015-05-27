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

class Router extends React.Component {

  static propTypes = {
    children: routes,
    initialRoutingState: array,
    initialBranchData: array,
    parseQueryString: func,
    stringifyQuery: func,
    getScrollPosition: func,
    updateScrollPosition: func,
    shouldUpdateScrollPosition: func,
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

  render() {
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
      stringifyQuery,
      getScrollPosition,
      updateScrollPosition,
      shouldUpdateScrollPosition,
      renderRouteComponent
    } = this.props;

    return (
      <History
        parseQueryString={parseQueryString}
        stringifyQuery={stringifyQuery}
        getScrollPosition={getScrollPosition}
      >
        <Routing
          routes={routes}
          initialRoutingState={initialRoutingState}
        >
          <TransitionManager>
            <DataProvider initialBranchData={initialBranchData}>
              <RouteRenderer renderComponent={renderRouteComponent}>
                <ScrollManager updateScrollPosition={updateScrollPosition}
                               shouldUpdateScrollPosition={shouldUpdateScrollPosition}>
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

export default Router;
