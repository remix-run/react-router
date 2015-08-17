import warning from 'warning';
import invariant from 'invariant';
import { parseQueryString, stringifyQuery } from './QueryUtils';
import { pathnameIsActive, queryIsActive } from './ActiveUtils';
import matchRoutes from './matchRoutes';
import runTransitionHooks from './runTransitionHooks';

const defaultProps = {
  isTransitioning: false,
  location: null,
  routes: null,
  params: null,
  history: null,
  onError: error => { throw error },
  stringifyQuery,
  parseQueryString
};

export function run(routes, location, callback, prevState = null) {
  matchRoutes(routes, location, (error, nextState) => {
    if (error || nextState == null) {
      callback(error, null);
    } else {
      nextState.location = location;
      runTransitionHooks(prevState, nextState, (error, redirectInfo) => {
        if (error || redirectInfo) {
          callback(error, null, redirectInfo);
        } else {
          callback(null, nextState);
        }
      });
    }
  });
}

class Router {
  listeners = []

  constructor(props) {
    this.props = { ...defaultProps, ...props };
    const { routes, history, location } = this.props;

    if (history) {
      this.updateHistory(history);
    } else if (location) {
      this.updateLocation(location);
    }
  }

  setState(state) {
    this.state = { ...this.state, ...state };
    this.listeners.forEach(listener => listener());
  }

  getState() {
    return this.state;
  }

  listen(listener) {
    this.listeners.push(listener);

    return () => {
      const index = this.listeners.indexOf(listener);
      this.listeners.splice(index, 1);
    }
  }

  updateLocation(location) {
    if (!location.query) {
      location.query = this.props.parseQueryString(location.search.substring(1));
    }

    let didSyncUpdate = false;

    run(this.props.routes, location, (error, state, redirectInfo) => {
      if (error) {
        this.props.onError(error)
      } else if (redirectInfo) {
        const { pathname, query, state } = redirectInfo;
        this.replaceWith(pathname, query, state);
      } else if (state == null) {
        warning(
          false,
          'Location "%s" did not match any routes',
          location.pathname + location.search
        );
      } else {
        this.setState(state);
      }

      didSyncUpdate = true;

      if (this.state.isTransitioning) {
        this.setState({
          isTransitioning: false
        });
      }
    }, this.state);

    if (!didSyncUpdate) {
      this.setState({
        isTransitioning: true
      });
    }
  }

  updateHistory(history) {
    if (this._unlisten) {
      this._unlisten();
      this._unlisten = null;
    }

    if (history) {
      this._unlisten = history.listen(this.updateLocation.bind(this));
    }
  }

  createPath(pathname, query) {
    var { stringifyQuery } = this.props;

    var queryString;
    if (query == null || (queryString = stringifyQuery(query)) === '')
      return pathname;

    return pathname + (pathname.indexOf('?') === -1 ? '?' : '&') + queryString;
  }

  /**
   * Returns a string that may safely be used to link to the given
   * pathname and query.
   */
  createHref(pathname, query) {
    var path = this.createPath(pathname, query);
    var { history } = this.props;

    if (history && history.createHref)
      return history.createHref(path);

    return path;
  }

  /**
   * Pushes a new Location onto the history stack.
   */
  transitionTo(pathname, query, state=null) {
    var { history } = this.props;

    invariant(
      history,
      'Router#transitionTo needs history'
    );

    history.pushState(state, this.createPath(pathname, query));
  }

  /**
   * Replaces the current Location on the history stack.
   */
  replaceWith(pathname, query, state=null) {
    var { history } = this.props;

    invariant(
      history,
      'Router#replaceWith needs history'
    );

    history.replaceState(state, this.createPath(pathname, query));
  }

  /**
   * Navigates forward/backward n entries in the history stack.
   */
  go(n) {
    var { history } = this.props;

    invariant(
      history,
      'Router#go needs history'
    );

    history.go(n);
  }

  /**
   * Navigates back one entry in the history stack. This is identical to
   * the user clicking the browser's back button.
   */
  goBack() {
    this.go(-1);
  }

  /**
   * Navigates forward one entry in the history stack. This is identical to
   * the user clicking the browser's forward button.
   */
  goForward() {
    this.go(1);
  }

  /**
   * Returns true if a <Link> to the given pathname/query combination is
   * currently active.
   */
  isActive(pathname, query) {
    var { location, routes, params } = this.state;

    if (location == null)
      return false;

    return pathnameIsActive(pathname, location.pathname, routes, params) &&
      queryIsActive(query, location.query);
  }
}

const publicRouterMethods = [
  'listen',
  'getState',
  'createHref',
  'transitionTo',
  'replaceWith',
  'go',
  'goBack',
  'goForward',
  'isActive'
];

export default function createRouter(props) {
  const router = new Router(props);
  return publicRouterMethods.reduce((result, methodName) => {
    result[methodName] = router[methodName].bind(router);
    return result;
  }, {});
}
