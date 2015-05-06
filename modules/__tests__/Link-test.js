var assert = require('assert');
var expect = require('expect');
var React = require('react/addons');
var { render } = React;
var { click } = React.addons.TestUtils.Simulate;
var createRouter = require('../createRouter');
var History = require('../History');
var Route = require('../Route');
var Link = require('../Link');

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
        return <Link to="hello" params={{name: 'michael'}} query={{the: 'query'}}>Link</Link>;
      }
    }

    it('knows how to make its href', function () {
      var Router = createRouter([
        <Route name="hello" path="hello/:name" component={Hello}/>,
        <Route name="link" component={LinkWrapper}/>
      ]);

      render(<Router location="/link"/>, div, function () {
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

      var Router = createRouter(
        <Route path="/" component={LinkWrapper}>
          <Route name="hello" component={Hello}/>
          <Route name="goodbye" component={Goodbye}/>
        </Route>
      );

      render(<Router location="/hello"/>, div, function () {
        var a = div.querySelector('a');
        expect(a.className).toEqual('dontKillMe highlight');
        render(<Router location="/goodbye"/>, div, function () {
          expect(a.className).toEqual('dontKillMe');
          render(<Router location="/hello"/>, div, function () {
            expect(a.className).toEqual('dontKillMe highlight');
            done();
          });
        });
      });
    });

    it('has its activeStyle', function (done) {
      class LinkWrapper extends React.Component {
        render() {
          return (
            <div>
              <Link to="hello" style={{color: 'white'}} activeStyle={{color: 'red'}}>Link</Link>
              {this.props.children}
            </div>
          );
        }
      }

      var Router = createRouter(
        <Route path="/" component={LinkWrapper}>
          <Route name="hello" component={Hello}/>
          <Route name="goodbye" component={Goodbye}/>
        </Route>
      );

      render(<Router location="/hello"/>, div, function () {
        var a = div.querySelector('a');
        expect(a.style.color).toEqual('red');
        render(<Router location="/goodbye"/>, div, function () {
          expect(a.style.color).toEqual('white');
          render(<Router location="/hello"/>, div, function () {
            expect(a.style.color).toEqual('red');
            done();
          });
        });
      });
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

      var Router = createRouter([
        <Route name="hello" component={Hello}/>,
        <Route name="link" component={LinkWrapper}/>
      ]);

      React.render(<Router location="/link"/>, div, function () {
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

      var history = new History('/link');
      var Router = createRouter({
        history,
        routes: [
          <Route name="hello" component={Hello}/>,
          <Route name="link" component={LinkWrapper}/>
        ],
        onUpdate() {
          steps.shift()();
        }
      });

      render(<Router/>, div);
    });

  });

});
