function requireAll(context) {
  context.keys().forEach(context);
}

requireAll(require.context('./tests', true, /-test\.js$/));
requireAll(require.context('./components/tests', true, /-test\.js$/));
requireAll(require.context('./locations/tests', true, /-test\.js$/));
requireAll(require.context('./mixins/tests', true, /-test\.js$/));
requireAll(require.context('./utils/tests', true, /-test\.js$/));
