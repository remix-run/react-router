var expect = require('expect');
var React = require('react');
var Router = require('../index');
var Route = require('../components/Route');
var TestLocation = require('../locations/TestLocation');
var ScrollToTopBehavior = require('../behaviors/ScrollToTopBehavior');
var getWindowScrollPosition = require('../utils/getWindowScrollPosition');

var {
  Foo,
  Bar,
  Baz,
  Async,
  Nested,
  EchoFooProp,
  EchoBarParam,
  RedirectToFoo,
  RedirectToFooAsync,
  Abort,
  AbortAsync
} = require('./TestHandlers');

describe('Router', function () {
  describe('transitions', function () {

    var routes = [
      <Route path="/redirect" handler={RedirectToFoo}/>,
      <Route path="/redirect-async" handler={RedirectToFooAsync}/>,
      <Route path="/abort" handler={Abort}/>,
      <Route path="/abort-async" handler={AbortAsync}/>,
      <Route path="/foo" handler={Foo}/>,
      <Route path="/bar" handler={Bar}/>,
      <Route path="/baz" handler={Baz}/>,
      <Route path="/async" handler={Async}/>
    ];

    describe('transition.wait', function () {
      it('waits asynchronously in willTransitionTo', function (done) {
        TestLocation.history = [ '/bar' ];

        var div = document.createElement('div');
        var steps = [];
        var router;

        steps.push(function () {
          expect(div.innerHTML).toMatch(/Bar/);
          router.transitionTo('/async');
          expect(div.innerHTML).toMatch(/Bar/);

          setTimeout(function () {
            expect(div.innerHTML).toMatch(/Async/);
            done();
          }, Async.delay + 10);
        });

        steps.push(function () {
          expect(div.innerHTML).toMatch(/Async/);
        });

        router = Router.create({
          routes: routes,
          location: TestLocation
        });

        router.run(function (Handler) {
          React.render(<Handler/>, div, function () {
            steps.shift()();
          });
        });
      });

      it('stops waiting asynchronously in willTransitionTo on location.pop', function (done) {
        TestLocation.history = [ '/bar' ];

        var div = document.createElement('div');
        var steps = [];
        var router;

        steps.push(function () {
          expect(div.innerHTML).toMatch(/Bar/);
          router.transitionTo('/async');
          expect(div.innerHTML).toMatch(/Bar/);

          setTimeout(function () {
            expect(div.innerHTML).toMatch(/Bar/);
            TestLocation.pop();
            expect(div.innerHTML).toMatch(/Bar/);
          }, Async.delay / 2);

          setTimeout(function () {
            expect(div.innerHTML).toMatch(/Bar/);
            done();
          }, Async.delay + 10);
        });

        router = Router.create({
          routes: routes,
          location: TestLocation
        });

        router.run(function (Handler) {
          React.render(<Handler/>, div, function () {
            steps.shift()();
          });
        });
      });

      it('stops waiting asynchronously in willTransitionTo on router.transitionTo', function (done) {
        TestLocation.history = [ '/bar' ];

        var div = document.createElement('div');
        var steps = [];
        var router;

        steps.push(function () {
          expect(div.innerHTML).toMatch(/Bar/);
          router.transitionTo('/async');
          expect(div.innerHTML).toMatch(/Bar/);

          setTimeout(function () {
            expect(div.innerHTML).toMatch(/Bar/);
            router.transitionTo('/foo');
            expect(div.innerHTML).toMatch(/Foo/);
          }, Async.delay / 2);
        });

        steps.push(function () {
          setTimeout(function () {
            expect(div.innerHTML).toMatch(/Foo/);
            TestLocation.pop();
          }, Async.delay / 2 + 10);
        });

        steps.push(function () {
          expect(div.innerHTML).toMatch(/Bar/);
          done();
        });

        router = Router.create({
          routes: routes,
          location: TestLocation
        });

        router.run(function (Handler) {
          React.render(<Handler/>, div, function () {
            steps.shift()();
          });
        });
      });

      it('stops waiting asynchronously in willTransitionTo on router.replaceWith', function (done) {
        TestLocation.history = [ '/bar' ];

        var div = document.createElement('div');
        var steps = [];
        var router;

        steps.push(function () {
          expect(div.innerHTML).toMatch(/Bar/);
          router.transitionTo('/async');
          expect(div.innerHTML).toMatch(/Bar/);

          setTimeout(function () {
            expect(div.innerHTML).toMatch(/Bar/);
            router.replaceWith('/foo');
            expect(div.innerHTML).toMatch(/Foo/);
          }, Async.delay / 2);
        });

        steps.push(function () {
          setTimeout(function () {
            expect(div.innerHTML).toMatch(/Foo/);
            done();
          }, Async.delay / 2 + 10);
        });

        router = Router.create({
          routes: routes,
          location: TestLocation
        });

        router.run(function (Handler) {
          React.render(<Handler/>, div, function () {
            steps.shift()();
          });
        });
      });
    });

    describe('transition.redirect', function () {
      it('redirects synchronously in willTransitionTo', function (done) {
        TestLocation.history = [ '/redirect' ];

        var div = document.createElement('div');

        Router.run(routes, TestLocation, function (Handler) {
          React.render(<Handler/>, div, function () {
            expect(div.innerHTML).toMatch(/Foo/);
            done();
          });
        });
      });

      it('redirects asynchronously in willTransitionTo', function (done) {
        TestLocation.history = [ '/bar' ];

        var div = document.createElement('div');
        var steps = [];
        var router;

        steps.push(function () {
          expect(div.innerHTML).toMatch(/Bar/);
          router.transitionTo('/redirect-async');
          expect(div.innerHTML).toMatch(/Bar/);

          setTimeout(function () {
            expect(div.innerHTML).toMatch(/Foo/);
            done();
          }, RedirectToFooAsync.delay + 10);
        });

        steps.push(function () {
          expect(div.innerHTML).toMatch(/Foo/);
          done();
        });

        router = Router.create({
          routes: routes,
          location: TestLocation
        });

        router.run(function (Handler) {
          React.render(<Handler/>, div, function () {
            steps.shift()();
          });
        });
      });

      it('cancels redirecting asynchronously in willTransitionTo on location.pop', function (done) {
        TestLocation.history = [ '/bar' ];

        var div = document.createElement('div');
        var steps = [];
        var router;

        steps.push(function () {
          expect(div.innerHTML).toMatch(/Bar/);
          router.transitionTo('/redirect-async');
          expect(div.innerHTML).toMatch(/Bar/);

          setTimeout(function () {
            expect(div.innerHTML).toMatch(/Bar/);
            TestLocation.pop();
            expect(div.innerHTML).toMatch(/Bar/);
          }, RedirectToFooAsync.delay / 2);

          setTimeout(function () {
            expect(div.innerHTML).toMatch(/Bar/);
            done();
          }, RedirectToFooAsync.delay + 10);
        });

        router = Router.create({
          routes: routes,
          location: TestLocation
        });

        router.run(function (Handler) {
          React.render(<Handler/>, div, function () {
            steps.shift()();
          });
        });
      });

      it('cancels redirecting asynchronously in willTransitionTo on router.transitionTo', function (done) {
        TestLocation.history = [ '/bar' ];

        var div = document.createElement('div');
        var steps = [];
        var router;

        steps.push(function () {
          expect(div.innerHTML).toMatch(/Bar/);
          router.transitionTo('/redirect-async');
          expect(div.innerHTML).toMatch(/Bar/);

          setTimeout(function () {
            expect(div.innerHTML).toMatch(/Bar/);
            router.transitionTo('/baz');
            expect(div.innerHTML).toMatch(/Baz/);
          }, RedirectToFooAsync.delay / 2);
        });

        steps.push(function () {
          setTimeout(function () {
            expect(div.innerHTML).toMatch(/Baz/);
            TestLocation.pop();
          }, RedirectToFooAsync.delay / 2 + 10);
        });

        steps.push(function () {
          expect(div.innerHTML).toMatch(/Bar/);
          done();
        });

        router = Router.create({
          routes: routes,
          location: TestLocation
        });

        router.run(function (Handler) {
          React.render(<Handler/>, div, function () {
            steps.shift()();
          });
        });
      });

      it('cancels redirecting asynchronously in willTransitionTo on router.replaceWith', function (done) {
        TestLocation.history = [ '/bar' ];

        var div = document.createElement('div');
        var steps = [];
        var router;

        steps.push(function () {
          expect(div.innerHTML).toMatch(/Bar/);
          router.transitionTo('/redirect-async');
          expect(div.innerHTML).toMatch(/Bar/);

          setTimeout(function () {
            expect(div.innerHTML).toMatch(/Bar/);
            router.replaceWith('/baz');
            expect(div.innerHTML).toMatch(/Baz/);
          }, RedirectToFooAsync.delay / 2);
        });

        steps.push(function () {
          setTimeout(function () {
            expect(div.innerHTML).toMatch(/Baz/);
            done();
          }, RedirectToFooAsync.delay / 2 + 10);
        });

        router = Router.create({
          routes: routes,
          location: TestLocation
        });

        router.run(function (Handler) {
          React.render(<Handler/>, div, function () {
            steps.shift()();
          });
        });
      });
    });

    describe('transition.abort', function () {
      it('aborts synchronously in willTransitionTo', function (done) {
        TestLocation.history = [ '/foo' ];

        var div = document.createElement('div');

        Router.run(routes, TestLocation, function (Handler) {
          React.render(<Handler/>, div, function () {
            TestLocation.push('/abort');
            expect(div.innerHTML).toMatch(/Foo/);
            expect(TestLocation.getCurrentPath()).toEqual('/foo');
            done();
          });
        });
      });

      it('aborts asynchronously in willTransitionTo', function (done) {
        TestLocation.history = [ '/bar' ];

        var div = document.createElement('div');
        var steps = [];
        var router;

        steps.push(function () {
          expect(div.innerHTML).toMatch(/Bar/);
          router.transitionTo('/abort-async');
          expect(div.innerHTML).toMatch(/Bar/);

          setTimeout(function () {
            expect(div.innerHTML).toMatch(/Bar/);
            done();
          }, AbortAsync.delay + 10);
        });

        steps.push(function () {
          expect(div.innerHTML).toMatch(/Bar/);
        });

        router = Router.create({
          routes: routes,
          location: TestLocation
        });

        router.run(function (Handler) {
          React.render(<Handler/>, div, function () {
            steps.shift()();
          });
        });
      });

      it('ignores aborting asynchronously in willTransitionTo on location.pop', function (done) {
        TestLocation.history = [ '/bar' ];

        var div = document.createElement('div');
        var steps = [];
        var router;

        steps.push(function () {
          expect(div.innerHTML).toMatch(/Bar/);
          router.transitionTo('/abort-async');
          expect(div.innerHTML).toMatch(/Bar/);

          setTimeout(function () {
            expect(div.innerHTML).toMatch(/Bar/);
            TestLocation.pop();
            expect(div.innerHTML).toMatch(/Bar/);
          }, Async.delay / 2);

          setTimeout(function () {
            expect(div.innerHTML).toMatch(/Bar/);
            done();
          }, Async.delay + 10);
        });

        router = Router.create({
          routes: routes,
          location: TestLocation
        });

        router.run(function (Handler) {
          React.render(<Handler/>, div, function () {
            steps.shift()();
          });
        });
      });

      it('ignores aborting asynchronously in willTransitionTo on router.transitionTo', function (done) {
        TestLocation.history = [ '/bar' ];

        var div = document.createElement('div');
        var steps = [];
        var router;

        steps.push(function () {
          expect(div.innerHTML).toMatch(/Bar/);
          router.transitionTo('/abort-async');
          expect(div.innerHTML).toMatch(/Bar/);

          setTimeout(function () {
            expect(div.innerHTML).toMatch(/Bar/);
            router.transitionTo('/foo');
            expect(div.innerHTML).toMatch(/Foo/);
          }, Async.delay / 2);
        });

        steps.push(function () {
          setTimeout(function () {
            expect(div.innerHTML).toMatch(/Foo/);
            TestLocation.pop();
          }, Async.delay / 2 + 10);
        });

        steps.push(function () {
          expect(div.innerHTML).toMatch(/Bar/);
          done();
        });

        router = Router.create({
          routes: routes,
          location: TestLocation
        });

        router.run(function (Handler) {
          React.render(<Handler/>, div, function () {
            steps.shift()();
          });
        });
      });

      it('ignores aborting asynchronously in willTransitionTo on router.replaceWith', function (done) {
        TestLocation.history = [ '/bar' ];

        var div = document.createElement('div');
        var steps = [];
        var router;

        steps.push(function () {
          expect(div.innerHTML).toMatch(/Bar/);
          router.transitionTo('/abort-async');
          expect(div.innerHTML).toMatch(/Bar/);

          setTimeout(function () {
            expect(div.innerHTML).toMatch(/Bar/);
            router.replaceWith('/foo');
            expect(div.innerHTML).toMatch(/Foo/);
          }, Async.delay / 2);
        });

        steps.push(function () {
          setTimeout(function () {
            expect(div.innerHTML).toMatch(/Foo/);
            done();
          }, Async.delay / 2 + 10);
        });

        router = Router.create({
          routes: routes,
          location: TestLocation
        });

        router.run(function (Handler) {
          React.render(<Handler/>, div, function () {
            steps.shift()();
          });
        });
      });
    });
  });

  describe('query params', function () {
    it('renders with query params', function (done) {
      var routes = <Route handler={EchoFooProp} path='/'/>;
      Router.run(routes, '/?foo=bar', function (Handler, state) {
        var html = React.renderToString(<Handler foo={state.query.foo} />);
        expect(html).toMatch(/bar/);
        done();
      });
    });
  });

  describe('willTransitionFrom', function () {
    it('sends a component instance', function (done) {
      var div = document.createElement('div');

      var Bar = React.createClass({
        statics: {
          willTransitionFrom: function (transition, component) {
            expect(div.querySelector('#bar')).toEqual(component.getDOMNode());
            done();
          }
        },

        render: function () {
          return <div id="bar">bar</div>;
        }
      });

      var routes = (
        <Route handler={Nested} path='/'>
          <Route name="bar" handler={Bar}/>
          <Route name="baz" handler={Bar}/>
        </Route>
      );

      TestLocation.history = [ '/bar' ];

      Router.run(routes, TestLocation, function (Handler, state) {
        React.render(<Handler/>, div, function () {
          TestLocation.push('/baz');
        });
      });
    });

  });

});

describe('Router.run', function () {

  it('matches a root route', function (done) {
    var routes = <Route path="/" handler={EchoFooProp} />;
    Router.run(routes, '/', function (Handler, state) {
      // TODO: figure out why we're getting this warning here
      // WARN: 'Warning: You cannot pass children to a RouteHandler'
      var html = React.renderToString(<Handler foo="bar"/>);
      expect(html).toMatch(/bar/);
      done();
    });
  });

  it('matches an array of routes', function (done) {
    var routes = [
      <Route handler={Foo} path="/foo"/>,
      <Route handler={Bar} path="/bar"/>
    ];
    Router.run(routes, '/foo', function (Handler, state) {
      var html = React.renderToString(<Handler/>);
      expect(html).toMatch(/Foo/);
      done();
    });
  });

  it('matches nested routes', function (done) {
    var routes = (
      <Route handler={Nested} path='/'>
        <Route handler={Foo} path='/foo'/>
      </Route>
    );
    Router.run(routes, '/foo', function (Handler, state) {
      var html = React.renderToString(<Handler/>);
      expect(html).toMatch(/Nested/);
      expect(html).toMatch(/Foo/);
      done();
    });
  });

  it('renders root handler only once', function (done) {
    var div = document.createElement('div');
    var routes = (
      <Route handler={Nested} path='/'>
        <Route handler={Foo} path='/Foo'/>
      </Route>
    );
    Router.run(routes, '/Foo', function (Handler, state) {
      React.render(<Handler/>, div, function () {
        expect(div.querySelectorAll('.Nested').length).toEqual(1);
        done();
      });
    });
  });

  it('supports dynamic segments', function (done) {
    var routes = <Route handler={EchoBarParam} path='/:bar'/>;
    Router.run(routes, '/d00d3tt3', function (Handler, state) {
      var html = React.renderToString(<Handler/>);
      expect(html).toMatch(/d00d3tt3/);
      done();
    });
  });

  it('supports nested dynamic segments', function (done) {
    var routes = (
      <Route handler={Nested} path="/:foo">
        <Route handler={EchoBarParam} path=":bar"/>
      </Route>
    );
    Router.run(routes, '/foo/bar', function (Handler, state) {
      var html = React.renderToString(<Handler />);
      expect(html).toMatch(/bar/);
      done();
    });
  });

  it('does not blow away the previous HTML', function (done) {
    TestLocation.history = [ '/foo' ];

    var routes = (
      <Route handler={Nested} path='/'>
        <Route handler={EchoBarParam} path=':bar'/>
      </Route>
    );
    var div = document.createElement('div');
    var steps = [];

    steps.push(function () {
      expect(div.innerHTML).toMatch(/foo/);
      div.querySelector('h1').innerHTML = 'lol i changed you';
      TestLocation.push('/bar');
    });

    steps.push(function () {
      expect(div.innerHTML).toMatch(/bar/);
      expect(div.innerHTML).toMatch(/lol i changed you/);
      done();
    });

    Router.run(routes, TestLocation, function (Handler, state) {
      React.render(<Handler/>, div, function () {
        steps.shift()();
      });
    });
  });

  describe('locations', function () {
    it('defaults to HashLocation', function (done) {
      var routes = <Route path="/" handler={Foo}/>;
      var div = document.createElement('div');
      Router.run(routes, function (Handler) {
        React.render(<Handler/>, div, function () {
          expect(this.getLocation()).toBe(Router.HashLocation);
          done();
        });
      });
    });
  });

  describe('ScrollToTop scrolling', function () {
    var BigPage = React.createClass({
      render: function () {
        return <div style={{ width: 10000, height: 10000, background: 'green' }}/>;
      }
    });

    var routes = [
      <Route name="one" handler={BigPage}/>,
      <Route name="two" handler={BigPage}/>
    ];

    describe('when a page is scrolled', function () {
      var position, div, renderCount;
      beforeEach(function (done) {
        TestLocation.history = [ '/one' ];

        div = document.createElement('div');
        document.body.appendChild(div);

        renderCount = 0;

        Router.create({
          routes: routes,
          location: TestLocation,
          scrollBehavior: ScrollToTopBehavior
        }).run(function (Handler) {
          React.render(<Handler/>, div, function () {
            if (renderCount === 0) {
              position = { x: 20, y: 50 };
              window.scrollTo(position.x, position.y);

              setTimeout(function () {
                expect(getWindowScrollPosition()).toEqual(position);
                done();
              }, 20);
            }

            renderCount += 1;
          });
        });
      });

      afterEach(function () {
        div.parentNode.removeChild(div);
      });

      describe('navigating to a new page', function () {
        beforeEach(function () {
          TestLocation.push('/two');
        });

        it('resets the scroll position', function () {
          expect(getWindowScrollPosition()).toEqual({ x: 0, y: 0 });
        });

        describe('then returning to the previous page', function () {
          beforeEach(function () {
            TestLocation.pop();
          });

          it('resets the scroll position', function () {
            expect(getWindowScrollPosition()).toEqual({ x: 0, y: 0});
          });
        });
      });
    });
  });

  describe('ImitateBrowserBehavior scrolling', function () {
    var BigPage = React.createClass({
      render: function () {
        return <div style={{ width: 10000, height: 10000, background: 'green' }}/>;
      }
    });

    var routes = [
      <Route name="one" handler={BigPage}/>,
      <Route name="two" handler={BigPage}/>
    ];

    describe('when a page is scrolled', function () {
      var position, div, renderCount;
      beforeEach(function (done) {
        TestLocation.history = [ '/one' ];

        div = document.createElement('div');
        document.body.appendChild(div);

        renderCount = 0;

        Router.run(routes, TestLocation, function (Handler) {
          React.render(<Handler/>, div, function () {
            if (renderCount === 0) {
              position = { x: 20, y: 50 };
              window.scrollTo(position.x, position.y);

              setTimeout(function () {
                expect(getWindowScrollPosition()).toEqual(position);
                done();
              }, 20);
            }

            renderCount += 1;
          });
        });
      });

      afterEach(function () {
        div.parentNode.removeChild(div);
      });

      describe('navigating to a new page', function () {
        beforeEach(function () {
          TestLocation.push('/two');
        });

        it('resets the scroll position', function () {
          expect(getWindowScrollPosition()).toEqual({ x: 0, y: 0 });
        });

        describe('then returning to the previous page', function () {
          beforeEach(function () {
            TestLocation.pop();
          });

          it('remembers the scroll position', function () {
            expect(getWindowScrollPosition()).toEqual(position);
          });
        });
      });
    });
  });

  describe('ignoreScrollBehavior', function () {
    var routes = (
      <Route handler={Nested}>
        <Route handler={Foo} ignoreScrollBehavior>
          <Route handler={Foo} path='/feed' />
          <Route handler={Foo} path='/discover' />
        </Route>
        <Route path='/search/:q' handler={Foo} ignoreScrollBehavior />
        <Route path='/users/:id/posts' handler={Foo} />
        <Route path='/about' handler={Foo} />
      </Route>
    );

    var div, didUpdateScroll;
    beforeEach(function (done) {
      TestLocation.history = [ '/feed' ];

      div = document.createElement('div');
      document.body.appendChild(div);

      var MockScrollBehavior = {
        updateScrollPosition() {
          didUpdateScroll = true;
        }
      };

      Router.create({
        routes: routes,
        location: TestLocation,
        scrollBehavior: MockScrollBehavior
      }).run(function (Handler) {
        React.render(<Handler/>, div, function () {
          done();
        });
      });
    });

    afterEach(function () {
      div.parentNode.removeChild(div);
      didUpdateScroll = false;
    });

    it('calls updateScroll the first time', function () {
      expect(didUpdateScroll).toBe(true);
    });

    describe('decides whether to update scroll on transition', function () {
      beforeEach(function () {
        didUpdateScroll = false;
      });

      afterEach(function () {
        TestLocation.pop();
      });

      it('calls updateScroll when no ancestors ignore scroll', function () {
        TestLocation.push('/about');
        expect(didUpdateScroll).toBe(true);
      });

      it('calls updateScroll when no ancestors ignore scroll although source and target do', function () {
        TestLocation.push('/search/foo');
        expect(didUpdateScroll).toBe(true);
      });

      it('calls updateScroll when route does not ignore scroll and only params change', function () {
        TestLocation.replace('/users/3/posts');
        didUpdateScroll = false;

        TestLocation.push('/users/5/posts');
        expect(didUpdateScroll).toBe(true);
      });

      it('calls updateScroll when route does not ignore scroll and both params and query change', function () {
        TestLocation.replace('/users/3/posts');
        didUpdateScroll = false;

        TestLocation.push('/users/5/posts?page=2');
        expect(didUpdateScroll).toBe(true);
      });

      it('does not call updateScroll when route does not ignore scroll but only query changes', function () {
        TestLocation.replace('/users/3/posts');
        didUpdateScroll = false;

        TestLocation.push('/users/3/posts?page=2');
        expect(didUpdateScroll).toBe(false);
      });

      it('does not call updateScroll when common ancestor ignores scroll', function () {
        TestLocation.push('/discover');
        expect(didUpdateScroll).toBe(false);
      });

      it('does not call updateScroll when route ignores scroll', function () {
        TestLocation.replace('/search/foo');
        didUpdateScroll = false;

        TestLocation.push('/search/bar');
        expect(didUpdateScroll).toBe(false);

        TestLocation.replace('/search/bar?safe=0');
        expect(didUpdateScroll).toBe(false);

        TestLocation.replace('/search/whatever');
        expect(didUpdateScroll).toBe(false);
      });
    });
  });

  describe('makePath', function () {
    var router;
    beforeEach(function () {
      router = Router.create({
        routes: [
          <Route name="home" handler={Foo}>
            <Route name="users" handler={Foo}>
              <Route name="user" path=":id" handler={Foo}/>
            </Route>
          </Route>
        ]
      });
    });

    describe('when given an absolute path', function () {
      it('returns that path', function () {
        expect(router.makePath('/about')).toEqual('/about');
      });
    });

    describe('when there is a route with the given name', function () {
      it('returns the correct path', function () {
        expect(router.makePath('user', { id: 6 })).toEqual('/home/users/6');
      });
    });

    describe('when there is no route with the given name', function () {
      it('throws an error', function () {
        expect(function () {
          router.makePath('not-found');
        }).toThrow();
      });
    });
  });

});
