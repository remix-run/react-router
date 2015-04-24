class PluginDispatcher {
  constructor() {
    this._plugins = [];
  }

  register(plugin) {
    this._plugins.push(plugin);
  }

  validateParams(params, route, pathname) {
    for (var i = 0; i < this._plugins.length; i++) {
      const plugin = this._plugins[i];

      if (plugin.validateParams && !plugin.validateParams(params, route, pathname)) {
        return false;
      }
    }

    return true;
  }

  transformMatch(match) {
    for (var i = 0; i < this._plugins.length; i++) {
      const plugin = this._plugins[i];

      if (plugin.transformMatch) {
        match = plugin.transformMatch(match);
      }
    }

    return match;
  }
}

module.exports = PluginDispatcher;
