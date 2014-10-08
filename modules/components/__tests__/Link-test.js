var assert = require('assert');
var expect = require('expect');
var React = require('react/addons');
var ReactTestUtils = React.addons.TestUtils;
var DefaultRoute = require('../DefaultRoute');
var Routes = require('../Routes');
var Route = require('../Route');
var Link = require('../Link');

describe('A Link', function () {

  describe('with params and a query', function () {
    var HomeHandler = React.createClass({
      render: function () {
        return Link({ ref: 'link', to: 'home', params: { username: 'mjackson' }, query: { awesome: true } });
      }
    });

    var component;
    beforeEach(function (done) {
      component = ReactTestUtils.renderIntoDocument(
        Routes({ location: 'none' },
          Route({ name: 'home', path: '/:username/home', handler: HomeHandler })
        )
      );

      component.dispatch('/mjackson/home', done);
    });

    afterEach(function () {
      React.unmountComponentAtNode(component.getDOMNode());
    });

    it('knows how to make its href', function () {
      var linkComponent = component.getActiveComponent().refs.link;
      expect(linkComponent.getHref()).toEqual('/mjackson/home?awesome=true');
    });
  });

  describe('when its route is active', function () {
    var HomeHandler = React.createClass({
      render: function () {
        return Link({ ref: 'link', to: 'home', className: 'a-link', activeClassName: 'highlight' });
      }
    });

    var component;
    beforeEach(function (done) {
      component = ReactTestUtils.renderIntoDocument(
        Routes({ location: 'none' },
          DefaultRoute({ name: 'home', handler: HomeHandler })
        )
      );

      component.dispatch('/', done);
    });

    afterEach(function () {
      React.unmountComponentAtNode(component.getDOMNode());
    });

    it('has its active class name', function () {
      var linkComponent = component.getActiveComponent().refs.link;
      expect(linkComponent.getClassName()).toEqual('a-link highlight');
    });
  });

});
