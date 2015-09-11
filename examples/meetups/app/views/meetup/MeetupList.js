import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import { setGeoLocation } from '../../actions/Geolocation';
import MeetupListItem from './MeetupListItem';
import GeoButton from '../GeoButton';

const { array, bool, func, object } = PropTypes;

@connect(state => ({
  meetups: state.meetup.groups.data,
  isLoading: state.meetup.groups.isLoading,
  test: state.meetups,
  geoPending: state.geo.geoPending,
  geoError: state.geo.geoError,
}))
export default class MeetupList extends Component {
  static propTypes = {
    meetups: array.isRequired,
    isLoading: bool.isRequired,
    dispatch: func.isRequired,
    geo: object,
    params: object,
    location: object,
    geoPending: bool,
    geoError: bool,
  };

  static defaultProps = {
    meetups: [],
    geoPending: false,
    geoError: false,
  };

  componentWillMount() {
    this.sendRequestIfNeeded(this.props);
  }

  componentWillReceiveProps(nextProps) {
    const { pathname: nextPath } = nextProps.location.pathname;
    const { pathname: currentPath } = this.props.location.pathname;

    if (nextPath !== currentPath) {
      this.sendRequestIfNeeded(nextProps);
    }
  }

  getEmptyList() {
    return (
      <div className="emptyList">
        No meetups in your area 🙈<br />
        Maybe you should start one
      </div>
    );
  }

  getLoadingIndicator() {
    return (
      <div className="loading">
        <i className="ionicons ion-load-c"></i>
      </div>
    );
  }

  getGeoPendingIndicator() {
    return (
      <div className="loading">
        <i className="ionicons ion-android-compass"></i>
      </div>
    );
  }

  getGeoErrorMessage() {
    return (
      <div className="error">
        <i className="ionicons ion-android-sad"></i><br />
        Looks like we can't obtain geo coordinates using the GeoLocation API
      </div>
    );
  }

  getList() {
    const { meetups, isLoading, geoPending, geoError } = this.props;

    if (geoError === true) {
      return this.getGeoErrorMessage();
    }

    if (geoPending === true) {
      return this.getGeoPendingIndicator();
    }

    if (isLoading === true) {
      return this.getLoadingIndicator();
    }

    if (!meetups.length) {
      return this.getEmptyList();
    }
    return (
      <div>
        {meetups.map((meetup, i) =>
          <MeetupListItem
            {...meetup}
            key={i}
          />
        )}
      </div>
    );
  }

  render() {
    const list = this.getList();

    return (
      <div className="main-content">
        <GeoButton />
        {list}
      </div>
    );
  }

  urlCoordsToObj(strCoords) {
    const arrUrlCoords = strCoords ? strCoords.split(',') : [];

    return {
      latitude: parseFloat(arrUrlCoords[0]),
      longitude: parseFloat(arrUrlCoords[1]),
    };
  }

  /**
   * Only send request if coords are new
   * @param  {Object} props Properties
   */
  sendRequestIfNeeded(props) {
    const { dispatch, params } = props;
    const { coords } = params;
    const objCoords = this.urlCoordsToObj(coords);

    dispatch(setGeoLocation(objCoords));
  }
}
