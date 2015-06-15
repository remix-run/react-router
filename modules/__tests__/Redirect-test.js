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
});
