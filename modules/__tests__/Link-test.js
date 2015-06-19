import assert from 'assert';
import expect from 'expect';
import React, { render } from 'react/addons';
import Router from '../Router';
import MemoryHistory from '../MemoryHistory';
import HashHistory from '../HashHistory';
import Route from '../Route';
import Link from '../Link';

var { click } = React.addons.TestUtils.Simulate;

describe('A <Link>', function () {

  var Parent = React.createClass({
    render() {
      return (
        <div>
          <h1>Parent</h1>
          {this.props.children}
        </div>
      );
    }
  });

  var Hello = React.createClass({
    render() {
      return <div>Hello {this.props.params.name}!</div>;
    }
  });

  var Goodbye = React.createClass({
    render() {
      return <div>Goodbye</div>;
    }
  });

  var div;
  beforeEach(function () {
    div = document.createElement('div');
  });

  it('knows how to make its href', function () {
    var LinkWrapper = React.createClass({
      render() {
        return <Link to="/hello/michael" query={{the: 'query'}}>Link</Link>;
      }
    });

    render((
      <Router history={new MemoryHistory('/link')}>
        <Route path="link" component={LinkWrapper}/>
      </Router>
    ), div, function () {
      var a = div.querySelector('a');
      expect(a.getAttribute('href')).toEqual('/hello/michael?the=query');
    });
  });

  it('knows how to make its href with HashHistory', function () {
    var LinkWrapper = React.createClass({
      render() {
        return <Link to="/hello/michael" query={{the: 'query'}}>Link</Link>;
      }
    });

    render((
      <Router history={new HashHistory}>
        <Route path="/" component={LinkWrapper}/>
      </Router>
    ), div, function () {
      var a = div.querySelector('a');
      expect(a.getAttribute('href')).toEqual('#/hello/michael?the=query');
    });
  });

  describe('with params', function () {
    var App = React.createClass({
      render() {
        return (
          <div>
            <Link to="/hello/michael">Michael</Link>
            <Link to="/hello/ryan">Ryan</Link>
          </div>
        );
      }
    });

    it('is active when its params match', function (done) {
      render((
        <Router history={new MemoryHistory('/hello/michael')}>
          <Route path="/" component={App}>
            <Route path="/hello/:name" component={Hello}/>
          </Route>
        </Router>
      ), div, function () {
        var a = div.querySelectorAll('a')[0];
        expect(a.className.trim()).toEqual('active');
        done();
      });
    });

    it('is not active when its params do not match', function (done) {
      render((
        <Router history={new MemoryHistory('/hello/michael')}>
          <Route path="/" component={App}>
            <Route path="/hello/:name" component={Hello}/>
          </Route>
        </Router>
      ), div, function () {
        var a = div.querySelectorAll('a')[1];
        expect(a.className.trim()).toEqual('');
        done();
      });
    });
  });

  describe('when its route is active', function () {
    it('has its activeClassName', function (done) {
      var LinkWrapper = React.createClass({
        render() {
          return (
            <div>
              <Link to="hello" className="dontKillMe" activeClassName="highlight">Link</Link>
              {this.props.children}
            </div>
          );
        }
      });

      var a, steps = [
        function () {
          a = div.querySelector('a');
          expect(a.className).toEqual('dontKillMe');
          this.transitionTo('hello');
        },
        function () {
          expect(a.className).toEqual('dontKillMe highlight');
          done();
        }
      ];

      function execNextStep() {
        try {
          steps.shift().apply(this, arguments);
        } catch (error) {
          done(error);
        }
      }

      render((
        <Router history={new MemoryHistory('/goodbye')} onUpdate={execNextStep}>
          <Route path="/" component={LinkWrapper}>
            <Route path="goodbye" component={Goodbye}/>
            <Route path="hello" component={Hello}/>
          </Route>
        </Router>
      ), div, execNextStep);
    });

    it('has its activeStyle', function (done) {
      var LinkWrapper = React.createClass({
        render() {
          return (
            <div>
              <Link to="/hello" style={{color: 'white'}} activeStyle={{color: 'red'}}>Link</Link>
              {this.props.children}
            </div>
          );
        }
      });

      var a, steps = [
        function () {
          a = div.querySelector('a');
          expect(a.style.color).toEqual('white');
          this.transitionTo('hello');
        },
        function () {
          expect(a.style.color).toEqual('red');
          done();
        }
      ];

      function execNextStep() {
        try {
          steps.shift().apply(this, arguments);
        } catch (error) {
          done(error);
        }
      }

      render((
        <Router history={new MemoryHistory("/goodbye")} onUpdate={execNextStep}>
          <Route path="/" component={LinkWrapper}>
            <Route path="hello" component={Hello}/>
            <Route path="goodbye" component={Goodbye}/>
          </Route>
        </Router>
      ), div, execNextStep);
    });
  });

  describe('when clicked', function () {
    it('calls a user defined click handler', function (done) {
      var LinkWrapper = React.createClass({
        handleClick(event) {
          event.preventDefault();
          assert.ok(true);
          done();
        },
        render() {
          return <Link to="hello" onClick={this.handleClick}>Link</Link>;
        }
      });

      render((
        <Router history={new MemoryHistory("/link")}>
          <Route path="hello" component={Hello}/>
          <Route path="link" component={LinkWrapper}/>
        </Router>
      ), div, () => {
        click(div.querySelector('a'));
      });
    });

    it('transitions to the correct route', function (done) {
      var LinkWrapper = React.createClass({
        handleClick() {
          // just here to make sure click handlers don't prevent it from happening
        },
        render() {
          return <Link to="hello" onClick={this.handleClick}>Link</Link>;
        }
      });

      var steps = [
        function () {
          click(div.querySelector('a'), { button: 0 });
        },
        function () {
          expect(div.innerHTML).toMatch(/Hello/);
          done();
        }
      ];

      function execNextStep() {
        try {
          steps.shift().apply(this, arguments);
        } catch (error) {
          done(error);
        }
      }

      render((
        <Router history={new MemoryHistory("/link")} onUpdate={execNextStep}>
          <Route path="hello" component={Hello}/>
          <Route path="link" component={LinkWrapper}/>
        </Router>
      ), div, execNextStep);
    });
  });

});
