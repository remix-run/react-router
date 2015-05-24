import React from 'react';
import isReactChildren from './isReactChildren';
import createRoutesFromReactChildren from './createRoutesFromReactChildren';
import TransitionManager from './TransitionManager';
import AsyncRouting from './AsyncRouting';
import { location, routes } from './PropTypes';

/**
 * The main interface of React Router.
 */
class Router extends React.Component {

  static propTypes = {
    location: location.isRequired,
    routes: routes.isRequired,
    children: routes
  };

  static defaultProps = {
    routes: []
  };

  constructor(props) {
    super(props);
    this.state = {
      routes: null
    };
  }

  _updateRoutes(routes) {
    if (isReactChildren(routes))
      routes = createRoutesFromReactChildren(routes);

    this.setState({ routes });
  }

  componentWillMount() {
    this._updateRoutes(this.props.children || this.props.routes);
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.children !== nextProps.children || this.props.routes !== nextProps.routes)
      this._updateRoutes(nextProps.children || nextProps.routes);
  }

  render() {
    return (
      <AsyncRouting routes={this.state.routes} location={this.props.location}>
        <TransitionManager>
          
        </TransitionManager>
      </AsyncRouting>
    );
  }

}

export default Router;
