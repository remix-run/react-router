import { AsyncStorage, PropTypes } from 'react-native';
import MemoryHistory from './MemoryHistory';
import Location from './Location';

var { bool, string } = PropTypes;

function encodeState(state) {
  return JSON.stringify(state);
}

function decodeState(string) {
  var state;
  try {
    state = JSON.parse(string);
  } catch (error) {
    // Invalid JSON in AsyncStorage for some reason. Ignore it.
    state = {};
  }

  // Make sure we have a real Location.
  if (state && state.location) {
    var { location } = state;
    state.location = new Location(location.path, location.query, location.navigationType);
  }

  return state;
}

/**
 * A history implementation for React Native environments that
 * supports persistence across the application lifecycle using
 * the AsyncStorage module.
 */
class NativeHistory extends MemoryHistory {

  static propTypes = Object.assign({}, MemoryHistory.propTypes, {
    storageKey: string.isRequired,
    autoSave: bool.isRequired
  });

  static defaultProps = Object.assign({}, MemoryHistory.defaultProps, {
    storageKey: '@ReactRouterNativeHistory',
    autoSave: true
  });

  static childContextTypes = Object.assign({}, MemoryHistory.childContextTypes);
  
  componentWillMount() {
    AsyncStorage.getItem(this.props.storageKey, (error, value) => {
      if (error) {
        throw error; // TODO: Keep this around in state?
      } else {
        this.setState(decodeState(value));
      }
    });
  }

  componentDidUpdate() {
    if (this.props.autoSave)
      this.saveToAsyncStorage();
  }

  saveToAsyncStorage(callback) {
    AsyncStorage.setItem(this.props.storageKey, encodeState(this.state), callback);
  }

}

export default NativeHistory;
