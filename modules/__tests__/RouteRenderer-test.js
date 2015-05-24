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

  var props = {
    params: { one: '1' },
    query: { two: '2'},
    location: new Location('/test'),
    children: <Renderer/>
  };

  it('renders elements and passes as `props.element` to its child', function () {
    // we know it passes `props.element` because the render works
    // in `Renderer`, which seems like a more straightforward way
    // to test than asserting against props
    var html = React.renderToString(
      <RouteRenderer {...props}
        branch={[makeRoute(() => <div>one</div>)]}
      />
    );
    expect(html).toMatch(/one/);
  });

  it('passes the next route component as `children`', function () {
    var html = React.renderToString(
      <RouteRenderer {...props}
        branch={[
          makeRoute(() => <div>one {this.props.children}</div>),
          makeRoute(() => <div>two</div>),
        ]}
      />
    );
    expect(html).toMatch(/two/);
  });

  it('passes the next route components as `props[name]`', function () {
    var childRoute = {
      components: {
        sidebar: makeComponent(() => { <div>sidebar</div> }),
        main: makeComponent(() => { <div>main</div> }),
      }
    };

    var parentRoute = makeRoute(() => (
      <div>{this.props.sidebar} {this.props.main}</div>
    ));

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

    var parent = makeRoute(() => (
      <div>{this.props.sidebar} {this.props.main}</div>
    ));

    var child = {
      components: {
        sidebar: makeComponent(() => { <div>first {this.props.children}</div> }),
        main: makeComponent(() => { <div>second {this.props.children}</div> }),
      }
    };

    var counter = 0;
    var grandChild = makeRoute(() => (
      <div>{++counter}</div>
    ));

    var html = React.renderToString(
      <RouteRenderer {...props}
        branch={[parent, child, grandChild]}
      />
    );

    expect(html).toMatch(/first 1/);
    expect(html).toMatch(/second 2/);
  });

  it('passes params to elements', function () {
    var html = React.renderToString(
      <RouteRenderer {...props}
        branch={[makeRoute(() => <div>{this.props.params.one}</div>)]}
      />
    );
    expect(html).toMatch(/1/);
  });

  it('passes query to elements', function () {
    var html = React.renderToString(
      <RouteRenderer {...props}
        branch={[makeRoute(() => <div>{this.props.query.two}</div>)]}
      />
    );
    expect(html).toMatch(/2/);
  });

  it('passes location to elements', function () {
    var html = React.renderToString(
      <RouteRenderer
        branch={[makeRoute(() => <div>{this.props.location.path}</div>)]}
      />
    );
    expect(html).toMatch(/\/test/);
  });
});

