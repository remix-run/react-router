import expect from 'expect';
import React from 'react';
import RouteRenderer from '../RouteRenderer';
import Location from '../Location';
import Renderer from '../Renderer';

function makeComponent (render) {
  return React.createClass({ render })
}

function makeRoute (render) {
  return { component: makeComponent(render) };
}

describe('RouteRenderer', function () {

  var location = new Location('/test');

  var props = {
    params: { one: '1' },
    query: { two: '2'},
    location,
    historyContext: { location },
    children: <Renderer/>
  };

  it('renders elements and passes as `props.element` to its child', function () {
    // we know it passes `props.element` because the render works
    // in `Renderer`, which seems like a more straightforward way
    // to test than asserting against props
    var html = React.renderToString(
      <RouteRenderer {...props}
        branch={[makeRoute(function() { return <div>one</div>; })]}
      />
    );
    expect(html).toMatch(/one/);
  });

  it('passes the next route component as `children`', function () {
    var html = React.renderToString(
      <RouteRenderer {...props}
        branch={[
          makeRoute(function() { return <div>one {this.props.children}</div>; }),
          makeRoute(function() { return <div>two</div>; }),
        ]}
      />
    );
    expect(html).toMatch(/two/);
  });

  it('passes the next route components as `props[name]`', function () {
    var childRoute = {
      components: {
        sidebar: makeComponent(function() { return <div>sidebar</div>; }),
        main: makeComponent(function() { return <div>main</div> }),
      }
    };

    var parentRoute = makeRoute(function() { return (
      <div>{this.props.sidebar} {this.props.main}</div>
    );});

    var html = React.renderToString(
      <RouteRenderer {...props}
        branch={[parentRoute, childRoute]}
      />
    );

    expect(html).toMatch(/sidebar/);
    expect(html).toMatch(/main/);
  });

  it('passes the next route component as `children` to each parent named component', function () {
    /*
    imagine this:

    ```
    <Route component={App}>
      <Route components={{main: Main, sidebar: Sidebar}}>
        <Router component={NowWhat}/>
      </Route>
    </Route>
    ```

    only objective thing to do is give `NowWhat` to both `Main`
    and Sidebar as `children`. The app will have to pick who
    renders it
    */

    var parent = makeRoute(function() { return (
      <div>{this.props.sidebar} {this.props.main}</div>
    );});

    var child = {
      components: {
        sidebar: makeComponent(function() { return <div>{this.props.children}</div>; }),
        main: makeComponent(function() { return <div>{this.props.children}</div>; }),
      }
    };

    var counter = -1;
    var text = ['one', 'two'];
    var grandChild = makeRoute(function() {
      counter++;
      return (
        <div>{text[counter]}</div>
      );
    });

    var html = React.renderToString(
      <RouteRenderer {...props}
        branch={[parent, child, grandChild]}
      />
    );

    expect(html).toMatch(/one/);
    expect(html).toMatch(/two/);
  });

  it('passes params to elements', function () {
    var html = React.renderToString(
      <RouteRenderer {...props}
        branch={[makeRoute(function() { return <div>{this.props.params.one}</div>; })]}
      />
    );
    expect(html).toMatch(/1/);
  });

  it('passes query to elements', function () {
    var html = React.renderToString(
      <RouteRenderer {...props}
        branch={[makeRoute(function() { return <div>{this.props.query.two}</div>; })]}
      />
    );
    expect(html).toMatch(/2/);
  });

  it('passes location to elements', function () {
    var html = React.renderToString(
      <RouteRenderer {...props}
        branch={[makeRoute(function() { return <div>{this.props.location.path}</div>; })]}
      />
    );
    expect(html).toMatch(/\/test/);
  });

  it('passes the route to elements', function () {
    var route = {
      name: 'test',
      component: makeComponent(function() { return (
        <div>{this.props.route.name}</div>
      );})
    };
    var html = React.renderToString(
      <RouteRenderer {...props} branch={[route]} />
    );
    expect(html).toMatch(/test/);
  });

  it('passes branchData to elements', function () {
    var route = {
      component: makeComponent(function() { return (
        <div>{this.props.name}</div>
      );})
    };
    var html = React.renderToString(
      <RouteRenderer {...props} branch={[route]} branchData={[{name: 'test'}]} />
    );
    expect(html).toMatch(/test/);
  });

  it('passes branchData to elements of multiple component routes', function () {
    var branch = [{

      component: makeComponent(function () { return (
        <div><div>{this.props.sidebar}</div><div>{this.props.main}</div></div>
      );})
    }, {
      components: {
        sidebar: makeComponent(function() { return (
          <div>{this.props.name}</div>
        );}),
        main: makeComponent(function() { return (
          <div>{this.props.name}</div>
        );})
      }
    }];
    var html = React.renderToString(
      <RouteRenderer {...props} branch={branch} branchData={[
        {},
        {sidebar: {name: 'sidebar test'}, main: { name: 'main test' }}
      ]}/>
    );
    expect(html).toMatch(/sidebar test/);
    expect(html).toMatch(/main test/);
  });

  it('renders route components with history context', function () {
    class Component extends React.Component {
      static contextTypes = { history: React.PropTypes.any };
      render () {
        return <div>{this.context.history.location.path}</div>;
      }
    }
    var branch = [{ component: Component }];

    var html = React.renderToString(
      <RouteRenderer {...props} branch={branch} />
    );
    expect(html).toMatch(/\/test/);
  });
});

