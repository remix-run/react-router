import describeHistory from './describeHistory';
import BrowserHistory from '../BrowserHistory';

describe('BrowserHistory', function () {
  describeHistory(new BrowserHistory);
});
