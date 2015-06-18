import expect from 'expect';
import React, { render } from 'react';
import MemoryHistory from '../MemoryHistory';
import Router from '../Router';
import Route from '../Route';
import Redirect from '../Redirect';

describe('A <Redirect>', function () {
  var node;
  beforeEach(function () {
    node = document.createElement('div');
  });

  afterEach(function () {
    React.unmountComponentAtNode(node);
  });

  it('works', function (done) {
    render((
      <Router history={new MemoryHistory('/notes/5')}>
        <Route path="messages/:id"/>
        <Redirect from="notes/:id" to="/messages/:id"/>
      </Router>
    ), node, function () {
      expect(this.state.location.pathname).toEqual('/messages/5');
      done();
    });
  });

  it('calls onEnter but not onLeave', function (done) {
    var enterCalled = 0;
    var leaveCalled = 0;
    var onEnter = function () { enterCalled++ };
    var onLeave = function() { leaveCalled++ };
    render((
      <Router history={new MemoryHistory('/notes/5')}>
        <Route onEnter={onEnter} onLeave={onLeave}>
          <Route path="messages/:id"/>
          <Redirect from="notes/:id" to="/messages/:id"/>
        </Route>
      </Router>
    ), node, function() {
      expect(enterCalled).toEqual(1);
      expect(leaveCalled).toEqual(0);
      done();
    });
  });

  it('doesn\'t call onEnter or onLeave when redirecting inside the same parent', function (done) {
    var enterCalled = 0;
    var leaveCalled = 0;
    var onEnter = function () { enterCalled++ };
    var onLeave = function() { leaveCalled++ };
    render((
      <Router history={new MemoryHistory('/messages/5/details')}>
        <Route onEnter={onEnter} onLeave={onLeave}>
          <Redirect from="messages/:id" to="/messages/:id/details"/>
          <Route path="messages/:id/details"/>
        </Route>
      </Router>
    ), node, function() {
      expect(this.state.location.pathname).toEqual('/messages/5/details');
      expect(enterCalled).toEqual(1);
      expect(leaveCalled).toEqual(0);
      this.transitionTo("/messages/6");
      expect(this.state.location.pathname).toEqual('/messages/6/details');
      expect(enterCalled).toEqual(1);
      expect(leaveCalled).toEqual(0);
      done();
    });
  });
});
