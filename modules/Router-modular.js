import React, { Component, PropTypes } from 'react';
import * as RouterPropTypes from './PropTypes';
import BaseRouterRenderer from './RouterRenderer';
import createReactRouter from './createReactRouter';
import routerContext from './routerContext';

function noop() {}

export default class Router extends Component {
  static propTypes = {
    createElement: PropTypes.func,
    parseQueryString: PropTypes.func,
    onError: PropTypes.func,
    onUpdate: PropTypes.func,
    routes: RouterPropTypes.routes,
    // Routes may also be given as children (JSX)
    children: RouterPropTypes.routes,

    // Client
    history: RouterPropTypes.history,

    // Unit testing, simple server
    location: RouterPropTypes.location,

    // Flux, data fetching
    initialState: PropTypes.object
  }

  static defaultProps = {
    onError: error => { throw error; },
    onUpdate: noop
  }

  constructor(props, context) {
    super(props, context);
    const { routes, children, history, location } = props;

    this.state = {
      isTransitioning: false,
      location
    };

    this.router = createReactRouter(this.props.initialState);

    if (history) {
      this.unlisten = history.listen(this.handleLocationChange);
    } else if (location) {
      this.handleLocationChange(location);
    }
  }

  setState(state, onUpdate) {
    if (!this.componentHasMounted) {
      this.state = { ...this.state, ...state };
      return;
    }
    super.setState(state, onUpdate);
  }

  componentDidMount() {
    this.componentHasMounted = true;
  }

  componentWillUnmount() {
    if (this.unlisten) {
      this.unlisten();
    }
  }

  handleLocationChange = location => {
    const { routes, children, history, onError, onUpdate } = this.props;

    this.setState({
      isTransitioning: true
    });

    this.router.match(routes || children, location, (error, state, redirectInfo) => {
      if (error) {
        onError(error);
        return;
      }
      if (redirectInfo) {
        const { pathname, query, state } = redirectInfo;
        history.replaceWith(pathname, query, state);
        return;
      }
      if (state == null) {
        return;
      }
      this.setState(state, onUpdate);
    });

    this.setState({
      isTransitioning: false
    });
  }

  render() {
    const { history, createElement } = this.props;
    const RouterRenderer = routerContext(this.router, history)(BaseRouterRenderer);
    return (
      <RouterRenderer
        createElement={createElement}
        {...this.state}
      />
    );
  }
}
