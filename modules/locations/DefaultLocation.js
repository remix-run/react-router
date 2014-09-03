var canUseDOM = require('react/lib/ExecutionEnvironment').canUseDOM;

module.exports = process.env.NODE_ENV === 'test' || !canUseDOM
  ? require('./MemoryLocation')
  : require('./HashLocation');
