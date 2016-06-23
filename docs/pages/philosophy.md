# Philosophy: Declarative Composability

React components are the heart of React's powerful programming model.
Their declarative nature makes them incredibly composable. React Router
is a declarative way to render, at any location, any UI that you and your
team can think up. You should be able to solve these use-cases elegantly
with component composition.

React Router desires to have no public interface outside of components
and props. If you need to redirect, or block transitions, or match a
location you should be able to do so declaratively.

