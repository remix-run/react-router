function mergeProperties(object, properties) {
  for (var property in properties) {
    if (properties.hasOwnProperty(property))
      object[property] = properties[property];
  }

  return object;
}

module.exports = mergeProperties;
