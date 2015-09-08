import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import { getGeolocation } from '../actions/Geolocation';
import './geobutton.less';
import { NavigationDecorator } from 'react-router';

const { bool, func, object } = PropTypes;

@connect(state => ({
  geo: state.geo,
  isLoading: state.meetup.groups.isLoading,
}))
@NavigationDecorator
export default class GeoButton extends Component {
  static propTypes = {
    dispatch: func.isRequired,
    isLoading: bool.isRequired,
    geo: object.isRequired,
  };

  static contextTypes = {
    location: object.isRequired,
  };

  onGeoGetterClick() {
    const { dispatch } = this.props;
    dispatch(getGeolocation());
  }

  onDefaultGeoClick() {
    const { dispatch } = this.props;
    dispatch(getGeolocation(true));
  }

  getButton(locateMe) {
    const { isLoading } = this.props;
    const text = locateMe ? 'Meetups close to me' : 'Default Geolocation';
    const cb = locateMe ? this.onGeoGetterClick : this.onDefaultGeoClick;

    return (
      <div className="geobtn-container">
        <button disabled={isLoading} className="geobutton" onClick={cb.bind(this)}>
          <i className="ionicons ion-location"></i>
          {text}
        </button>
      </div>
    );
  }

  componentWillReceiveProps(nextProps) {
    const { geo } = nextProps;
    const { location  } = this.context;
    const { latitude, longitude } = geo;
    const newPath = `/geo/${latitude},${longitude}`;

    if (location.pathname !== newPath) {
      this.transitionTo(newPath);
    }
  }

  render() {
    const { geo } = this.props;

    return this.getButton(geo.isDefault);
  }
}
