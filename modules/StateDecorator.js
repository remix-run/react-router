import StateMixin from './StateMixin';

export default function StateDecorator(DecoratedComponent) {
  const { displayName, name } = DecoratedComponent;

  return React.createClass({
    displayName: `State(${displayName || name || 'Component'})`,
    mixins: [ StateMixin ],
    render() {
      var stateMixinApi = {
        getLocation,
        getPath,
        getPathname,
        getQueryString,
        getQuery,
        getBranch,
        getParams,
        getComponents,
        isActive
      } = this;

      return <DecoratedComponent {...stateMixinApi} {...this.props} />;
    }
  })
}
