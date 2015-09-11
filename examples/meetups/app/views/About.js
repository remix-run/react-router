import React from 'react';
import { connect } from 'react-redux';

const { Component, PropTypes } = React;
const { func, object } = PropTypes;

@connect(state => ({
  geo: state.geo
}))
export default class GeoButton extends Component {
  static propTypes = {
    dispatch: func.isRequired,
    geo: object,
  };

  render() {
    const { geo } = this.props;

    return (
      <div className="main-content about">
        It's all about that base <br />
        {geo}
      </div>
    );
  }
}
