var describeHistory = require('./describeHistory');
var History = require('../History');

describe('History', function () {
  describeHistory(new History);
});
