import expect from 'expect';
import React, { render } from 'react';
import Router from '../Router';
import Route from '../Route';

describe('Router', function () {
  var div = document.createElement('div');

  afterEach(function () {
    React.unmountComponentAtNode(div);
  });

  it('renders routes', function (done) {
    class Component extends React.Component {
      render () {
        return <div>hello world!</div>;
      }
    }

    render((
      <Router>
        <Route path="/" component={Component}/>
      </Router>
    ), div, () => {
      expect(div.textContent.trim()).toEqual('hello world!');
      done();
    });
  });

});
