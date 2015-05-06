var invariant = require('react/lib/invariant');
var { AsyncStorage } = require('react-native');
var History = require('./History');

var AsyncStorageKey = '@ReactRouterNativeHistory';

/**
 * A history implementation for React Native environments that
 * supports persistence across the application lifecycle using
 * the AsyncStorage module.
 */
class NativeHistory extends History {

  static createFromAsyncStorage(callback) {
    invariant(
      typeof callback === 'function',
      'NativeHistory.createFromAsyncStorage needs a callback function'
    );

    AsyncStorage.getItem(AsyncStorageKey, function (error, value) {
      if (error) {
        callback(error);
      } else {
        var state;
        try {
          state = JSON.parse(value);
        } catch (e) {
          // Invalid state in AsyncStorage?
          state = {};
        }

        callback(
          null,
          new NativeHistory(state.entries, state.current, state.navigationType)
        );
      }
    });
  }

  saveToAsyncStorage(callback) {
    AsyncStorage.setItem(AsyncStorageKey, JSON.stringify(this), callback);
  }

}

module.exports = NativeHistory;
