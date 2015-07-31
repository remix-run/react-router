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
  it('selectively calls routerWillLeave by route, in the correct order', function (done) {
    var div = document.createElement('div');
    var calls = [];
    var timeout = 0;

    var Grandparent = React.createClass({
      mixins: [ TransitionHook ],
      routerWillLeave(nextState, router, callback) {
        setTimeout(function() {
          calls.push("grandparent-leave")
          callback();
        }, timeout)
      },
      render() {
        return <div>grandparent<div>{this.props.children}</div></div>;
      }
    });

    var ParentA = React.createClass({
      componentDidMount() {
        calls.push("parentA-enter");
      },
      render() {
        return <div>parentA</div>;
      }
    });

    var ParentB = React.createClass({
      mixins: [ TransitionHook ],
      routerWillLeave(nextState, router, callback) {
        setTimeout(function() {
          calls.push("parentB-leave");
          callback();
        }, timeout)
      },
      render() {
        return <div>parentB<div>{this.props.children}</div></div>;
      }
    });

    var Child = React.createClass({
      mixins: [ TransitionHook ],
      routerWillLeave(nextState, router, callback) {
        setTimeout(function() {
          calls.push("child-leave");
          callback();
        }, timeout)
      },
      render() {
        return <div>child</div>;
      }
    });


    var steps = [
      function () {
        expect(this.state.location.pathname).toEqual('/grandparent/parentB/child');
        expect(div.textContent.trim()).toEqual('grandparentparentBchild');
        this.transitionTo('/grandparent/parentA')
      },
      function () {
        expect(this.state.location.pathname).toEqual('/grandparent/parentA');
        expect(div.textContent.trim()).toEqual('grandparentparentA');
        expect(calls).toEqual(["child-leave", "parentB-leave", "parentA-enter"]);
        done();
      }
    ];

    function execNextStep() {
      steps.shift().apply(this, arguments);
    }

    render((
      <Router history={new MemoryHistory('/grandparent/parentB/child')} onUpdate={execNextStep}>
        <Route path="grandparent" component={Grandparent}>
            <Route path="parentA" component={ParentA}/>
            <Route path="parentB" component={ParentB}>
                <Route path="child" component={Child}/>
            </Route>
        </Route>
      </Router>
    ), div, execNextStep);
  });
});
