import describeHistory from './describeHistory';
import BrowserHistory, { history } from '../BrowserHistory';

describe('BrowserHistory', function () {
  describeHistory(new BrowserHistory);
  describeHistory(history);
});
