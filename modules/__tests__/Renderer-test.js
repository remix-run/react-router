import expect from 'expect';
import React from 'react';
import Renderer from '../Renderer';

describe('Renderer', function () {
  it('renders the element prop', function () {
    var html = React.renderToString(<Renderer element={<div>test</div>}/>);
    expect(html.trim()).toMatch(/test/);
  });
});

