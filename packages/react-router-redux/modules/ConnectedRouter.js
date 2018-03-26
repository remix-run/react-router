import React, { Component } from "react";
import PropTypes from "prop-types";
import { Router } from "react-router";

import { LOCATION_CHANGE } from "./reducer";

class ConnectedRouter extends Component {
  static propTypes = {
    store: PropTypes.object,
    history: PropTypes.object.isRequired,
    children: PropTypes.node,
    isSSR: PropTypes.bool
  };

  static contextTypes = {
    store: PropTypes.object
  };

  handleLocationChange = (location, action) => {
    this.store.dispatch({
      type: LOCATION_CHANGE,
      payload: {
        location,
        action
      }
    });
  };

  componentWillMount() {
    const { store: propsStore, history, isSSR } = this.props;
    this.store = propsStore || this.context.store;

    if (!isSSR)
      this.unsubscribeFromHistory = history.listen(this.handleLocationChange);

    this.handleLocationChange(history.location);
  }

  componentWillUnmount() {
    if (this.unsubscribeFromHistory) this.unsubscribeFromHistory();
  }

  render() {
    return <Router {...this.props} />;
  }
}

export default ConnectedRouter;
