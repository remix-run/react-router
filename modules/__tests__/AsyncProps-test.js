import expect from 'expect';
import React from 'react';
import AsyncProps from '../AsyncProps';
import Location from '../Location';

var branchData = [
  { one: 1 },
  {
    main: { two: 2 },
    sidebar: { three: 3 }
  }
];

class Parent extends React.Component {
  static loadAsyncProps (env, cb) {
    // settimeout to force asynchrony, otherwise componentDidMount's call to load
    // resolves everything synchronously and testing the initial load blank screen
    // fails
    setTimeout(() => cb(null, branchData[0]), 0);
  }

  render () {
    return <div>{this.props.one}</div>;
  }
}

class Main extends React.Component {
  static loadAsyncProps (env, cb) {
    cb(null, branchData[1].main);
  }

  render () {
    return <div>{this.props.two}</div>;
  }
}

class Sidebar extends React.Component {
  static loadAsyncProps (env, cb) {
    cb(null, branchData[1].sidebar);
  }

  render () {
    return <div>{this.props.three}</div>;
  }
}

var branch = [
  { component: Parent },
  { components: { main: Main, sidebar: Sidebar } },
];

function setServerCache (data) {
  window.__ASYNC_PROPS__ = data || branchData;
}

function cleanupServerCache () {
  delete window.__ASYNC_PROPS__;
}

describe('AsyncProps', function () {

  describe('when server rendering', function () {
    var props = {
      branch,
      params: {},
      location: new Location('/test'),
    };

    beforeEach(function () {
      setServerCache();
    });

    afterEach(function () {
      cleanupServerCache();
    });

    it('sends server rendered data as props.branchData', function (done) {
      class Assertions extends React.Component {
        render () {
          expect(this.props.branchData).toEqual(branchData);
          done();
          return null;
        }
      }
      React.renderToString(
        <AsyncProps {...props}><Assertions/></AsyncProps>
      );
    });
  });

  describe('after initial render', function () {
    var div = document.createElement('div');

    var props = {
      branch,
      params: {},
      location: new Location('/test'),
    };

    afterEach(function () {
      React.unmountComponentAtNode(div);
    });

    it('renders with previous props when receiving new props', function (done) {
      setServerCache();
      var numberOfRenders = 0;
      class Assertions extends React.Component {
        render () {
          numberOfRenders++;
          if (numberOfRenders == 2) {
            expect(this.props.branch).toEqual(props.branch);
            expect(this.props.params).toEqual(props.params);
            expect(this.props.location).toEqual(props.location);
            cleanupServerCache();
            done();
          }
          return null;
        }
      }
      React.render((
        <AsyncProps {...props}><Assertions/></AsyncProps>
      ), div, function () {
        var newProps = {
          branch: [{ component: Parent }],
          params: { foo: 'bar' },
          location: new Location('/'),
        };
        React.render((
          <AsyncProps {...newProps}><Assertions/></AsyncProps>
        ), div);
      });
    });

    it('renders nothing on initial load with an empty cache', function (done) {
      class Assertions extends React.Component {
        render () { throw new Error('should not render child') }
      }

      React.render(<AsyncProps {...props}><Assertions/></AsyncProps>, div, () => {
        expect(div.textContent.trim()).toEqual('');
        done();
      });
    });

    it('loads data after render with an empty cache', function (done) {
      var props = {
        branch: [
          { component: Parent },
          { components: { main: Main, sidebar: Sidebar } },
        ],
        params: {},
        location: new Location('/test'),
      };

      class Assertions extends React.Component {
        render () {
          expect(this.props.branchData).toEqual(branchData);
          done();
          return null;
        }
      }

      React.render((
        <AsyncProps {...props}><Assertions/></AsyncProps>
      ), div);
    });
  });

  it('sends `env` to loaders');
  it('only loads the data from the branch diff');
  it('ignores previous data loading when new props come in before it finishes');
  it('sends `loading` prop');
  it('handles errors well (whatever that means)');

  describe('hydrate', function () {
    it('adds serverContext to `env`');
  });
});

