import React from 'react';

function shallowEqual(a, b) {
  var ka = 0;
  var kb = 0;
  for (let key in a) {
    if (a.hasOwnProperty(key) && a[key] !== b[key])
      return false;
    ka++;
  }
  for (let key in b)
    if (b.hasOwnProperty(key))
      kb++;
  return ka === kb;
}

var AsyncProps = React.createClass({

  statics: {
    createElement (Component, state) {
      return <AsyncProps Component={Component} routing={state}/>
    }
  },

  getInitialState() {
    return {
      propsAreLoading: false,
      propsAreLoadingLong: false,
      asyncProps: null,
      previousRoutingState: null
    };
  },

  componentDidMount() {
    this.load(this.props);
  },

  componentWillReceiveProps(nextProps) {
    var needToLoad = !shallowEqual(
      nextProps.routing.routeParams,
      this.props.routing.routeParams
    );

    if (!needToLoad)
      return;

    var routerTransitioned = nextProps.routing.location !== this.props.routing.location;
    var keepPreviousRoutingState = this.state.propsAreLoadingLong && routerTransitioned;

    if (keepPreviousRoutingState) {
      this.load(nextProps);
      return;
    }

    this.setState({
      previousRoutingState: this.props.routing
    }, () => this.load(nextProps));
  },

  /*
   * Could make this method much better, right now AsyncProps doesn't render its
   * children until it fetches data, causing a "waterfall" effect, when instead
   * it could look at the branch of components from it down to the end and load
   * up the props for all of them in parallel, waterfall will do for now...
   */
  load(props) {
    var lastLoadTime = this._lastLoadTime = Date.now();
    var { params } = props.routing;
    var { Component } = this.props;

    this.setState({ propsAreLoading: true }, () => {
      var longLoadTimer = setTimeout(() => {
        this.setState({ propsAreLoadingLong: true });
      }, 300);

      // TODO: handle `error`s
      Component.loadProps(params, (error, asyncProps) => {
        clearTimeout(longLoadTimer);

        // if the router transitions between now and when the callback runs we will
        // ignore it to prevent setting state w/ the wrong data (earlier calls to
        // load that call back later than later calls to load)
        if (this._lastLoadTime !== lastLoadTime || !this.isMounted())
          return;

        this.setState({
          propsAreLoading: false,
          propsAreLoadingLong: false,
          asyncProps: asyncProps,
          previousRoutingState: null
        });
      });
    });
  },

  render() {
    var { Component } = this.props;
    var { asyncProps, propsAreLoading, propsAreLoadingLong } = this.state;
    var routing = this.state.previousRoutingState || this.props.routing;

    if (this.state.asyncProps === null)
      return Component.Loader ? <Component.Loader {...routing}/> : null;

    return <Component
      onPropsDidChange={() => this.load(this.props) }
      propsAreLoading={propsAreLoading}
      propsAreLoadingLong={propsAreLoadingLong}
      {...routing}
      {...asyncProps}
    />;
  }
});

export default AsyncProps;

