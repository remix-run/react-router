var assert = require('assert');
var expect = require('expect');
var React = require('react/addons');
var ReactTestUtils = React.addons.TestUtils;
var PathStore = require('../../stores/PathStore');
var DefaultRoute = require('../DefaultRoute');
var Routes = require('../Routes');
var Link = require('../Link');

describe('A Link', function () {
  describe('when its route is active', function () {
    var Home = React.createClass({
      render: function () {
        return Link({ ref: 'link', to: 'home', className: 'a-link', activeClassName: 'highlight' });
      }
    });

    var component;
    beforeEach(function () {
      component = ReactTestUtils.renderIntoDocument(
        Routes(null,
          DefaultRoute({ name: 'home', handler: Home })
        )
      );
    });

    afterEach(function () {
      React.unmountComponentAtNode(component.getDOMNode());
      // For some reason unmountComponentAtNode doesn't call componentWillUnmount :/
      PathStore.removeAllChangeListeners();
    });

    it('is active', function () {
      var linkComponent = component.getActiveRoute().refs.link;
      assert(linkComponent.isActive);
    });

    it('has its active class name', function () {
      var linkComponent = component.getActiveRoute().refs.link;
      expect(linkComponent.getClassName()).toEqual('a-link highlight');
    });
  });
});
