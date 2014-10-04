var expect = require('expect');
var React = require('react/addons');
var ReactTestUtils = React.addons.TestUtils;
var Promise = require('../../utils/Promise');
var AsyncState = require('../AsyncState');

describe('AsyncState', function () {

  describe('a component that fetches part of its state asynchronously', function () {
    var User = React.createClass({
      mixins: [ AsyncState ],
      statics: {
        getInitialAsyncState: function (params, query, setState) {
          setState({
            immediateValue: 'immediate'
          });

          setTimeout(function () {
            setState({
              delayedValue: 'delayed'
            });
          });

          return {
            promisedValue: Promise.resolve('promised')
          };
        }
      },
      render: function () {
        return null;
      }
    });

    var component;
    beforeEach(function () {
      component = ReactTestUtils.renderIntoDocument(User());
    });

    afterEach(function () {
      React.unmountComponentAtNode(component.getDOMNode());
    });

    it('resolves all state variables correctly', function (done) {
      setTimeout(function () {
        expect(component.state.immediateValue).toEqual('immediate');
        expect(component.state.delayedValue).toEqual('delayed');
        expect(component.state.promisedValue).toEqual('promised');
        done();
      }, 20);
    });
  });

});
