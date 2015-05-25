import React from 'react';
export default function createPropAssertions (assertionsFunc, onRenderCount) {
  onRenderCount = onRenderCount || 1;
  var renderCount = 0;
  return class extends React.Component {
    render () {
      renderCount++;
      if (renderCount === onRenderCount)
        assertionsFunc(this.props);
      return null;
    }
  }
}

