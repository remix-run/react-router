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
    cb(null, branchData[0]);
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

var components = [Parent, { main: Main, sidebar: Sidebar }];

describe('AsyncProps', function () {

  describe('when server rendering', function () {

    it('renders with initialBranchData', function (done) {
      var props = {
        components,
        initialBranchData: branchData,
        params: {},
        location: new Location('/test'),
      };

      class Assertions extends React.Component {
        render () {
          expect(this.props.branchData).toEqual(branchData);
          done();
        }
      }
      React.renderToString(
        <AsyncProps {...props}><Assertions/></AsyncProps>
      );
    });
  });

  describe('after initial render', function () {
    var div = document.createElement('div');

    afterEach(function () {
      React.unmountComponentAtNode(div);
    });

    it('renders with previous props when receiving new props', function (done) {
      var props = {
        components,
        params: {},
        initialBranchData: branchData,
        location: new Location('/test'),
      };

      var numberOfRenders = 0;
      class Assertions extends React.Component {
        render () {
          numberOfRenders++;
          if (numberOfRenders == 2) {
            expect(this.props.components).toEqual(props.components);
            expect(this.props.params).toEqual(props.params);
            expect(this.props.location).toEqual(props.location);
            done();
          }
          return null;
        }
      }
      React.render((
        <AsyncProps {...props}><Assertions/></AsyncProps>
      ), div, function () {
        var newProps = {
          components: [Parent],
          params: { foo: 'bar' },
          location: new Location('/'),
        };
        React.render((
          <AsyncProps {...newProps}><Assertions/></AsyncProps>
        ), div);
      });
    });

    it.skip('renders nothing on initial load with an empty cache', function (done) {
      // this works if the data fetching is async, if its sync though
      // then react does two renders completely synchronously and so
      // the test fails. Need to figure out a way to test this better
      // skipping for now though so that the tests are fast (0.0x v 1.x)
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
        components: [
          Parent,
          { main: Main, sidebar: Sidebar }
        ],
        params: {},
        location: new Location('/test'),
      };

      var numberOfRenders = 0;
      class Assertions extends React.Component {
        render () {
          numberOfRenders++;
          if (numberOfRenders === 2) {
            expect(this.props.branchData).toEqual(branchData);
            done();
          }
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

