import React, { Component, PropTypes } from 'react';
import { Link } from 'react-router';
import { connect } from 'react-redux';
import './nav.less';

const { object } = PropTypes;

@connect(state => ({
  geo: state.geo
}))
export default class Navigation extends Component {
  static propTypes = {
    children: object.isRequired,
    geo: object.isRequired,
  };

  render() {
    const { children, geo } = this.props;
    const { latitude, longitude } = geo;
    const geoString = `/geo/${latitude},${longitude}`;

    return (
      <div id="navigation">
        <ul>
          <li><Link to={geoString}>Meetups</Link></li>
          <li><Link to="/about">About</Link></li>
          <li><Link to="/meetup/NoVaJS">NoVaJS</Link></li>
          <li><Link to="/meetup/NYC-JS">NYC.JS</Link></li>
        </ul>
        {children}
      </div>
    );
  }
}
