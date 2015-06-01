import NavigationMixin from './NavigationMixin';

export default function NavigationDecorator(DecoratedComponent) {
  const { displayName, name } = DecoratedComponent;

  return React.createClass({
    displayName: `Navigation(${displayName || name || 'Component'})`,
    mixins: [ NavigationMixin ],
    render() {
      var navigationMixinApi = {
        makePath,
        makeHref,
        transitionTo,
        replaceWith,
        go,
        goBack,
        goForward,
        canGo,
        canGoBack,
        canGoForward
      } = this;

      return <DecoratedComponent {...navigationMixinApi} {...this.props} />;
    }
  })
}
