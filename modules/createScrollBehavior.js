var React = require('react');
var PropTypes = require('./PropTypes');

function createScrollBehavior(applyScrollPosition) {
  class ScrollBehavior extends React.Component {
    static propTypes = {
      location: PropTypes.location,
      children: React.PropTypes.element.isRequired
    }

    componentDidUpdate(prevProps) {
      var prevLocation = prevProps.location;
      var location = this.props.location;

      if (prevLocation.path === location.path)
        return;

      applyScrollPosition(location.scrollPosition);
    }

    render() {
      return React.Children.only(this.props.children);
    }
  }

  return ScrollBehavior;
}

module.exports = createScrollBehavior;