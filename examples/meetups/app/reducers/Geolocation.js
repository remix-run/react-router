import { defaultPosition } from '../constants/Geo';
import {
  RECEIVE_LOCATION,
  INVALIDATE_DEFAULT_LOCATION,
  GEO_PENDING,
  GEO_ERROR,
} from '../constants/Types';

const defaultLocationParams = {
  geoPending: false,
  geoError: false,
};

export default function Geolocation(state = defaultPosition, action) {
  switch (action.type) {
  case RECEIVE_LOCATION:
    return {
      ...state,
      ...action.coords,
      ...defaultLocationParams,
    };

  case INVALIDATE_DEFAULT_LOCATION:
    return {
      ...state,
      isDefault: false,
    };

  case GEO_PENDING:
    return {
      ...state,
      geoPending: true,
    };

  case GEO_ERROR:
    return {
      ...state,
      geoError: true,
    };

  default:
    return state;
  }
}
