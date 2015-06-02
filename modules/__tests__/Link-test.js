import assert from 'assert';
import expect from 'expect';
import React, { render } from 'react/addons';
import Router from '../Router';
import MemoryHistory from '../MemoryHistory';
import Route from '../Route';
import Link from '../Link';

var { click } = React.addons.TestUtils.Simulate;

describe('A <Link>', function () {

  class Parent extends React.Component {
    render() {
      return (
        <div>
          <h1>Parent</h1>
          {this.props.children}
        </div>
      );
    }
  }

  class Hello extends React.Component {
    render() {
      return <div>Hello {this.props.params.name}!</div>;
    }
  }

  class Goodbye extends React.Component {
    render() {
      return <div>Goodbye</div>;
    }
  }

  var div;
  beforeEach(function () {
    div = document.createElement('div');
  });

  describe('with params and a query', function () {
    class LinkWrapper extends React.Component {
      render() {
        return <Link to="/hello/michael" query={{the: 'query'}}>Link</Link>;
      }
    }

    it('knows how to make its href', function () {
      render((
        <Router location="/link">
          <Route path="hello/:name" component={Hello}/>
          <Route path="link" component={LinkWrapper}/>
        </Router>
      ), div, () => {
        var a = div.querySelector('a');
        expect(a.getAttribute('href')).toEqual('/hello/michael?the=query');
      });
    });
  });

  describe('when its route is active', function () {
    it('has its activeClassName', function (done) {
      class LinkWrapper extends React.Component {
        render() {
          return (
            <div>
              <Link to="hello" className="dontKillMe" activeClassName="highlight">Link</Link>
              {this.props.children}
            </div>
          );
        }
      }

      var steps = [], a;

      steps.push(function () {
        a = div.querySelector('a');
        expect(a.className).toEqual('dontKillMe highlight');
        this.transitionTo('goodbye');
      });

      steps.push(function () {
        expect(a.className).toEqual('dontKillMe');
        this.transitionTo('hello');
      });

      steps.push(function () {
        expect(a.className).toEqual('dontKillMe highlight');
        done();
      });

      function execNextStep() {
        steps.shift().apply(this, arguments);
      }

      var history = new MemoryHistory('/hello');

      render((
        <Router history={history} onUpdate={execNextStep}>
          <Route path="/" component={LinkWrapper}>
            <Route path="goodbye" component={Goodbye}/>
            <Route path="hello" component={Hello}/>
          </Route>
        </Router>
      ), div, execNextStep);
    });

    it('has its activeStyle', function (done) {
      class LinkWrapper extends React.Component {
        render() {
          return (
            <div>
              <Link to="/hello" style={{color: 'white'}} activeStyle={{color: 'red'}}>Link</Link>
              {this.props.children}
            </div>
          );
        }
      }

      var steps = [], a;

      steps.push(function () {
        a = div.querySelector('a');
        expect(a.style.color).toEqual('red');
        this.transitionTo('goodbye');
      });

      steps.push(function () {
        expect(a.style.color).toEqual('white');
        this.transitionTo('hello');
      });

      steps.push(function () {
        expect(a.style.color).toEqual('red');
        done();
      });

      function execNextStep() {
        steps.shift().apply(this, arguments);
      }

      render((
        <Router location="/hello" onUpdate={execNextStep}>
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
      class LinkWrapper extends React.Component {
        handleClick(event) {
          event.preventDefault();
          assert.ok(true);
          done();
        }
        render() {
          return <Link to="hello" onClick={this.handleClick}>Link</Link>;
        }
      }

      render((
        <Router location="/link">
          <Route path="hello" component={Hello}/>
          <Route path="link" component={LinkWrapper}/>
        </Router>
      ), div, () => {
        click(div.querySelector('a'));
      });
    });

    it('transitions to the correct route', function (done) {
      class LinkWrapper extends React.Component {
        handleClick() {
          // just here to make sure click handlers don't prevent it from happening
        }
        render() {
          return <Link to="hello" onClick={this.handleClick}>Link</Link>;
        }
      }

      var steps = [];

      steps.push(function () {
        click(div.querySelector('a'), { button: 0 });
      });

      steps.push(function () {
        expect(div.innerHTML).toMatch(/Hello/);
        done();
      });

      function execNextStep() {
        steps.shift().apply(this, arguments);
      }

      render((
        <Router location="/link" onUpdate={execNextStep}>
          <Route path="hello" component={Hello}/>
          <Route path="link" component={LinkWrapper}/>
        </Router>
      ), div, execNextStep);
    });
  });

});
