import assert from 'assert';
import Transition from '../Transition';

describe('A new Transition', function () {
  
  var transition;
  beforeEach(function () {
    transition = new Transition;
  });

  it('is not cancelled', function () {
    assert(!transition.isCancelled);
  });

  describe('that is redirected', function () {
    beforeEach(function () {
      transition.to('/something/else');
    });

    it('is cancelled', function () {
      assert(transition.isCancelled);
    });
  });

  describe('that is aborted', function () {
    beforeEach(function () {
      transition.abort();
    });

    it('is cancelled', function () {
      assert(transition.isCancelled);
    });
  });

});
