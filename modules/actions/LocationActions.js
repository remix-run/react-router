/**
 * Actions that modify the URL.
 */
var LocationActions = {

  /**
   * Indicates a location is being setup for the first time.
   */
  SETUP: 'setup',

  /**
   * Indicates a new location is being pushed to the history stack.
   */
  PUSH: 'push',

  /**
   * Indicates the current location should be replaced.
   */
  REPLACE: 'replace',

  /**
   * Indicates the most recent entry should be removed from the history stack.
   */
  POP: 'pop',

  /**
   * Indicates that a route transition is finished.
   */
  FINISHED_TRANSITION: 'finished-transition'

};

module.exports = LocationActions;
