import React from 'react';
import invariant from 'invariant';

var { func, array, shape, object } = React.PropTypes;

var contextTypes = {
  asyncProps: shape({
    reloadComponent: func,
    propsArray: array,
    componentsArray: array
  })
};

var _serverPropsArray = null;

function setServerPropsArray(array) {
  invariant(!_serverPropsArray, 'You cannot call AsyncProps.hydrate more than once');
  _serverPropsArray = array;
}

export function _clearCacheForTesting() {
  _serverPropsArray = null;
}

function hydrate(routerState, cb) {
  var { components, params } = routerState;
  var flatComponents = filterAndFlattenComponents(components);
  loadAsyncProps(flatComponents, params, cb);
}

function eachComponents(components, iterator) {
  for (var i = 0, l = components.length; i < l; i++) {
    if (typeof components[i] === 'object') {
      for (var key in components[i]) {
        iterator(components[i][key], i, key);
      }
    } else {
      iterator(components[i], i);
    }
  }
}

function filterAndFlattenComponents(components) {
  var flattened = [];
  eachComponents(components, function(Component) {
    if (Component.loadProps)
      flattened.push(Component);
  });
  return flattened;
}

function loadAsyncProps(components, params, cb) {
  var propsArray = [];
  var componentsArray = [];
  var canceled = false;
  var needToLoadCounter = components.length;

  components.forEach(function(Component, index) {
    Component.loadProps(params, function(error, props) {
      needToLoadCounter--;
      propsArray[index] = props;
      componentsArray[index] = Component;
      maybeFinish();
    });
  });

  function maybeFinish() {
    if (canceled === false && needToLoadCounter === 0)
      cb(null, {propsArray, componentsArray});
  }

  return {
    cancel () {
      canceled = true;
    }
  };
}

function getPropsForComponent(Component, componentsArray, propsArray) {
  var index = componentsArray.indexOf(Component);
  return propsArray[index];
}

function mergeAsyncProps(current, changes) {
  for (var i = 0, l = changes.propsArray.length; i < l; i++) {
    let Component = changes.componentsArray[i];
    let position = current.componentsArray.indexOf(Component);
    let isNew = position === -1;

    if (isNew) {
      current.propsArray.push(changes.propsArray[i]);
      current.componentsArray.push(changes.componentsArray[i]);
    } else {
      current.propsArray[position] = changes.propsArray[i];
    }
  }
}

function arrayDiff(previous, next) {
  var diff = [];

  for (var i = 0, l = next.length; i < l; i++)
    if (previous.indexOf(next[i]) === -1)
      diff.push(next[i]);

  return diff;
}

function shallowEqual(a, b) {
  var key;
  var ka = 0;
  var kb = 0;

  for (key in a) {
    if (a.hasOwnProperty(key) && a[key] !== b[key])
      return false;
    ka++;
  }

  for (key in b)
    if (b.hasOwnProperty(key))
      kb++;

  return ka === kb;
}



var RouteComponentWrapper = React.createClass({

  contextTypes: contextTypes,

  // this is here to meet the case of reloading the props when a component's params change,
  // the place we know that is here, but the problem is we get occasional waterfall loads
  // when clicking links quickly at the same route, AsyncProps doesn't know to load the next
  // props until the previous finishes rendering.
  //
  // if we could tell that a component needs its props reloaded in AsyncProps instead of here
  // (by the arrayDiff stuff in componentWillReceiveProps) then we wouldn't need this code at
  // all, and we coudl get rid of the terrible forceUpdate hack as well. I'm just not sure
  // right now if we can know to reload a pivot transition.
  componentWillReceiveProps(nextProps, context) {
    var paramsChanged = !shallowEqual(
      this.props.routerState.routeParams,
      nextProps.routerState.routeParams
    );

    if (paramsChanged) {
      this.reloadProps(nextProps.routerState.routeParams);
    }
  },

  reloadProps(params) {
    this.context.asyncProps.reloadComponent(
      this.props.Component,
      params || this.props.routerState.routeParams,
      this
    );
  },

  render() {
    var { Component, routerState } = this.props;
    var { componentsArray, propsArray, loading } = this.context.asyncProps;
    var asyncProps = getPropsForComponent(Component, componentsArray, propsArray);
    return <Component {...routerState} {...asyncProps} loading={loading} reloadAsyncProps={this.reloadProps} />;
  }

});

var AsyncProps = React.createClass({

  statics: {

    hydrate: hydrate,

    rehydrate: setServerPropsArray,

    createElement(Component, state) {
      return typeof Component.loadProps === 'function' ?
        <RouteComponentWrapper Component={Component} routerState={state}/> :
        <Component {...state}/>;
    }

  },

  childContextTypes: contextTypes,

  getChildContext() {
    return {
      asyncProps: Object.assign({
        reloadComponent: this.reloadComponent,
        loading: this.state.previousProps !== null
      }, this.state.asyncProps),
    };
  },

  getInitialState() {
    return {
      asyncProps: {
        propsArray: _serverPropsArray,
        componentsArray: _serverPropsArray ? filterAndFlattenComponents(this.props.components) : null,
      },
      previousProps: null
    };
  },

  componentDidMount() {
    var initialLoad = this.state.asyncProps.propsArray === null;
    if (initialLoad) {
      hydrate(this.props, (err, asyncProps) => {
        this.setState({ asyncProps });
      });
    }
  },

  componentWillReceiveProps(nextProps) {
    var routerTransitioned = nextProps.location !== this.props.location;

    if (!routerTransitioned)
      return;

    var oldComponents = this.props.components;
    var newComponents = nextProps.components;

    var components = arrayDiff(
      filterAndFlattenComponents(oldComponents),
      filterAndFlattenComponents(newComponents)
    );

    if (components.length === 0)
      return;

    this.loadAsyncProps(components, nextProps.params);
  },

  beforeLoad(cb) {
    this.setState({
      previousProps: this.props
    }, cb);
  },

  afterLoad(err, asyncProps, cb) {
    this.inflightLoader = null;
    mergeAsyncProps(this.state.asyncProps, asyncProps);
    this.setState({
      previousProps: null,
      asyncProps: this.state.asyncProps
    }, cb);
  },

  loadAsyncProps(components, params, cb) {
    if (this.inflightLoader) {
      this.inflightLoader.cancel();
    }

    this.beforeLoad(() => {
      this.inflightLoader = loadAsyncProps(components, params, (err, asyncProps) => {
        this.afterLoad(err, asyncProps, cb);
      });
    });
  },

  reloadComponent(Component, params, instance) {
    this.loadAsyncProps([Component], params, () => {
      // gotta fix this hack ... change in context doesn't cause the
      // RouteComponentWrappers to rerender (first one will because
      // of cloneElement)
      if (instance.isMounted())
        instance.forceUpdate();
    });
  },

  render() {
    var { route } = this.props;
    var { asyncProps, previousProps } = this.state;
    var initialLoad = asyncProps.propsArray === null;

    if (initialLoad)
      return route.renderInitialLoad ? route.renderInitialLoad() : null;

    else if (previousProps)
      return React.cloneElement(previousProps.children, { loading: true });

    else
      return this.props.children;
  }

});

export default AsyncProps;
