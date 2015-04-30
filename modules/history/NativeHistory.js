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
        var data;
        try {
          data = JSON.parse(value);
        } catch (e) {
          // Invalid data in AsyncStorage?
          data = {};
        }

        callback(null, new NativeHistory(data.entries, data.current));
      }
    });
  }

  saveToAsyncStorage(callback) {
    var value = JSON.stringify({
      entries: this._entries,
      current: this._current
    });

    AsyncStorage.setItem(AsyncStorageKey, value, callback);
  }

}

module.exports = NativeHistory;
