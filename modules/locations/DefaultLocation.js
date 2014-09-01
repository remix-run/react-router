module.exports = process.env.NODE_ENV === 'test'
  ? require('./MemoryLocation')
  : require('./HashLocation');
