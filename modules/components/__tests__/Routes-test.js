var assert = require('assert');
var expect = require('expect');
var React = require('react/addons');
var ReactTestUtils = React.addons.TestUtils;
var Routes = require('../Routes');
var Route = require('../Route');

function getRootMatch(matches) {
  return matches[matches.length - 1];
}

var NullHandler = React.createClass({
  render: function () {
    return null;
  }
});

describe('A Routes', function () {

  describe('that considers ignoreScrollBehavior when calling updateScroll', function () {
    var component;
    beforeEach(function () {
      component = ReactTestUtils.renderIntoDocument(
        Routes({ location: 'none' },
          Route({ handler: NullHandler, ignoreScrollBehavior: true },
            Route({ path: '/feed', handler: NullHandler }),
            Route({ path: '/discover', handler: NullHandler })
          ),
          Route({ path: '/search', handler: NullHandler, ignoreScrollBehavior: true }),
          Route({ path: '/about', handler: NullHandler })
        )
      );
    });

    function spyOnUpdateScroll(action) {
      var didCall = false;

      var realUpdateScroll = component.updateScroll;
      component.updateScroll = function mockUpdateScroll() {
        didCall = true;
        realUpdateScroll.apply(component, arguments);
      };

      try {
        action();
      } finally {
        component.updateScroll = realUpdateScroll;
      }

      return didCall;
    }

    afterEach(function () {
      React.unmountComponentAtNode(component.getDOMNode());
    });

    it('calls updateScroll when no ancestors ignore scroll', function () {
      component.updateLocation('/feed');

      var calledUpdateScroll = spyOnUpdateScroll(function () {
        component.updateLocation('/about');
      });

      expect(calledUpdateScroll).toEqual(true);
    });

    it('calls updateScroll when no ancestors ignore scroll even though source and target do', function () {
      component.updateLocation('/feed');

      var calledUpdateScroll = spyOnUpdateScroll(function () {
        component.updateLocation('/search');
      });

      expect(calledUpdateScroll).toEqual(true);
    });

    it('calls updateScroll when source is same as target and does not ignore scroll', function () {
      component.updateLocation('/about');

      var calledUpdateScroll = spyOnUpdateScroll(function () {
        component.updateLocation('/about?page=2');
      });

      expect(calledUpdateScroll).toEqual(true);
    });

    it('does not call updateScroll when common ancestor ignores scroll', function () {
      component.updateLocation('/feed');

      var calledUpdateScroll = spyOnUpdateScroll(function () {
        component.updateLocation('/discover');
      });

      expect(calledUpdateScroll).toEqual(false);
    });

    it('does not call updateScroll when source is same as target and ignores scroll', function () {
      component.updateLocation('/search');

      var calledUpdateScroll = spyOnUpdateScroll(function () {
        component.updateLocation('/search?q=test');
      });

      expect(calledUpdateScroll).toEqual(false);
    });

  });

});
