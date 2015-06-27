import describeHistory from './describeHistory';
import HashHistory, { history } from '../HashHistory';

describe('HashHistory', function () {
  describeHistory(new HashHistory);
  describeHistory(history());
});
