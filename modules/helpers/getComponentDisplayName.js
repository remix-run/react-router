function getComponentDisplayName(component) {
  return component.type.displayName || 'UnnamedComponent';
}

module.exports = getComponentDisplayName;
