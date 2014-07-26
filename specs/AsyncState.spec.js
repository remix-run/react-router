require('./helper');
var Promise = require('es6-promise').Promise;
var AsyncState = require('../modules/mixins/AsyncState');

describe('AsyncState', function () {


  describe('a component that fetches part of its state asynchronously', function () {
    it('resolves all state variables correctly', function (done) {
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

      var user = TestUtils.renderIntoDocument(
        User()
      );

      setTimeout(function () {
        expect(user.state.immediateValue).toEqual('immediate');
        expect(user.state.delayedValue).toEqual('delayed');
        expect(user.state.promisedValue).toEqual('promised');
        done();
      }, 20);
    });
  });

});
