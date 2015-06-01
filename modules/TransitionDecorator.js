import TransitionMixin from './TransitionMixin';

export default function TransitionDecorator(DecoratedComponent) {
  const { displayName, name } = DecoratedComponent;

  return React.createClass({
    displayName: `Transition(${displayName || name || 'Component'})`,
    mixins: [ TransitionMixin ],
    render() {
      var transitionMixinApi = {
        cancelTransition,
        retryLastCancelledTransition,
        addTransitionHook,
        removeTransitionHook
      } = this;

      return <DecoratedComponent {...transitionMixinApi} {...this.props} />;
    }
  });
}
