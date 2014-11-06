var LocationActions = require('../actions/LocationActions');

var makeTestLocation = function(path) {

  return {

    path: '',

    history: [],

    onChange: function(){},

    setup: function(onChange) {
      this.onChange = onChange;
      if (path)
        this.push(path);
    },

    setPath: function(type) {
      this.path = this.history[this.history.length - 1];
      this.onChange({type: type, path: this.path});
    },

    push: function (path) {
      this.history.push(path);
      this.setPath(LocationActions.PUSH);
    },

    replace: function (path) {
      this.history[this.history.length - 1] = path;
      this.setPath(LocationActions.REPLACE);
    },

    pop: function () {
      this.history.pop();
      this.setPath(LocationActions.POP);
    },

    getCurrentPath: function() {
      return this.path;
    },

    toString: function () {
      return '<TestLocation>';
    }

  };

};

module.exports = makeTestLocation;
