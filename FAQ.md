# Frequently Asked Questions

This is a list of support questions that frequently show up in GitHub issues. This list is intended to minimize the frequency of this happening. The issues section is intended for bug reports, not developer support. Support questions should be asked at StackOverflow or in the Reactiflux chat. 

If there is a support question that you frequently see being asked, please open a PR to add it to this list.

* [Why aren't my components updating when the location changes?](#why-arent-my-components-updating-when-the-location-changes)

### Why aren't my components updating when the location changes?

React Router relies on updates propagating from your router component to every child component. If you (or a component you use) implements `shouldComponentUpdate` or is a `React.PureComponent`, you may run into issues where your components do not update when the location changes. For a detailed review of the problem, please see the [blocked updates guide](packages/react-router/docs/guides/blocked-updates.md).
