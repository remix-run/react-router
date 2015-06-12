import expect from 'expect';
import React, { render } from 'react';
import MemoryHistory from '../MemoryHistory';
import TransitionHook from '../TransitionHook';
import Router from '../Router';
import Route from '../Route';

describe('TransitionHook', function () {
  it('calls routerWillLeave when the router leaves the current location', function (done) {
    var div = document.createElement('div');
    var hookCalled = false;

    var One = React.createClass({
      mixins: [ TransitionHook ],
      routerWillLeave() {
        hookCalled = true;
      },
      render() {
        return <div>one</div>;
      }
    });

    var Two = React.createClass({
      render() {
        return <div>two</div>;
      }
    });

    var steps = [
      function () {
        expect(this.state.location.pathname).toEqual('/one');
        expect(div.textContent.trim()).toEqual('one');
        this.transitionTo('/two')
      },
      function () {
        expect(hookCalled).toBe(true);
        expect(this.state.location.pathname).toEqual('/two');
        done();
      }
    ];

    function execNextStep() {
      steps.shift().apply(this, arguments);
    }

    render((
      <Router history={new MemoryHistory('/one')} onUpdate={execNextStep}>
        <Route path="one" component={One}/>
        <Route path="two" component={Two}/>
      </Router>
    ), div, execNextStep);
  });
});
