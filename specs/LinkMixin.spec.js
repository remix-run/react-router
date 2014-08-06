require('./helper');
var ActiveStore = require('../modules/stores/ActiveStore');
var LinkMixin = require('../modules/mixins/LinkMixin');
var Route = require('../modules/components/Route');
var withoutProperties = require('../modules/helpers/withoutProperties');

var App = React.createClass({
  displayName: 'App',
  render: function () {
    return React.DOM.div();
  }
});

describe('a LinkMixin provides', function() {
  var dumbComponent;

  beforeEach(function() {
    dumbComponent = {
      props: {
        to: 'somewhere',
        query: {
          queryableItem: 'parameter'
        },
        className: 'btn',
        activeClassName: 'active',
        children: [ 'stubbed child' ],
        mayOrMayNotBeIntersting: 'Who knows!',
        customerId: 5
      },
      additionalReservedProps: {
        mayOrMayNotBeIntersting: true
      }
    }
  });

  it('getParams with additionalReservedProps', function() {
    expect(LinkMixin.getParams.bind(dumbComponent)()).toEqual({customerId: 5});
  });

  it('getParams without additionalReservedProps', function() {
    delete dumbComponent.additionalReservedProps;
    expect(LinkMixin.getParams.bind(dumbComponent)())
    .toEqual({
      mayOrMayNotBeIntersting: 'Who knows!',
      customerId: 5
    });
  });
});

