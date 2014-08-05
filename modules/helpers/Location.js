/**
 * Map of location type to handler.
 * @see Routes#location
 */
module.exports = {
  hash: require('./HashLocation'),
  history: require('./HistoryLocation'),
  disabled: require('./DisabledLocation'),
  memory: require('./MemoryLocation')
};