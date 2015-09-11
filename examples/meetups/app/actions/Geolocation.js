import { defaultPosition } from '../constants/Geo';
import { fetchMeetupGroups } from './Meetup';

import {
  RECEIVE_LOCATION,
  INVALIDATE_GROUPS,
  INVALIDATE_DEFAULT_LOCATION,
  GEO_PENDING,
  GEO_ERROR,
} from '../constants/Types';

const cache = {
  coords: {
    latitude: 0,
    longitude: 0,
  },
  myLocation: {
    latitude: 0,
    longitude: 0,
  }
};

let geoTimeout;

function receiveLocation(pos) {
  cache.coords = pos;

  return function(dispatch) {
    dispatch({
      type: RECEIVE_LOCATION,
      coords: {
        ...pos
      },
    });
    return dispatch(fetchMeetupGroups(pos));
  };
}

function getDefaultGeolocation() {
  return receiveLocation(defaultPosition);
}

function invalidateGroups() {
  return {
    type: INVALIDATE_GROUPS,
  };
}

function invalidateDefaultLocation() {
  return {
    type: INVALIDATE_DEFAULT_LOCATION,
  };
}

function indicateGeoRequestPending() {
  return {
    type: GEO_PENDING,
  };
}

function onGeoError() {
  return {
    type: GEO_ERROR,
  };
}

export function setGeoLocation(geoLocation) {
  let { latitude, longitude } = geoLocation;
  const {latitude: defaultLat, longitude: defaultLong} = defaultPosition;
  const {latitude: cacheLat, longitude: cacheLong} = cache.coords;

  if (isNaN(latitude)) {
    latitude = defaultLat;
    longitude = defaultLong;
  }

  const isDefault = defaultLat === latitude && defaultLong === longitude;
  const shouldUpdateLocation = cacheLat !== latitude || cacheLong !== longitude;

  return function(dispatch) {
    if (shouldUpdateLocation) {
      return dispatch(receiveLocation({
        latitude,
        longitude,
        isDefault: isDefault
      }));
    }

    return null;
  };
}

function requestGeolocation() {
  const { latitude: myCachedLat, longitude: myCachedLong } = cache.myLocation;

  return function(dispatch) {
    dispatch(invalidateGroups());
    dispatch(invalidateDefaultLocation());
    dispatch(indicateGeoRequestPending());

    if (myCachedLat + myCachedLong > 0) {
      return dispatch(setGeoLocation(cache.myLocation));
    }

    geoTimeout = setTimeout(() => dispatch(onGeoError()), 5000);

    navigator.geolocation.getCurrentPosition(function(position) {
      const { latitude, longitude } = position.coords;
      cache.myLocation = { latitude, longitude };
      clearTimeout(geoTimeout);
      dispatch(setGeoLocation(position.coords));
    });
  };
}

export function getGeolocation(getDefault) {
  if (getDefault === true || !navigator.geolocation) {
    return getDefaultGeolocation();
  }

  return requestGeolocation();
}
