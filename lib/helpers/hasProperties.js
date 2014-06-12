function hasProperties(object, properties) {
  for (var property in object) {
    if (object[property] !== properties[property])
      return false;
  }

  return true;
}

module.exports = hasProperties;
