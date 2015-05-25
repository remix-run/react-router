var describeHistory = require('./describeHistory');
var BrowserHistory = require('../BrowserHistory');

describe.skip('BrowserHistory', function () {
  describeHistory(BrowserHistory);
});
