function isObject(val) {
  return typeof val === 'object';
}

function isRegExp(val) {
  return val instanceof RegExp;
}

var Constrainable = {
  statics: {
    willTransitionTo : function(transition, params) {
      if (!this.validatePath(transition.path) || !this.validateParams(params)) {
        transition.redirect(this.redirectTo);
      }
    },

    /**
     * Uses this.pathConstraint (defined in the component's statics) to validate
     * the current matched path. If this.pathConstraint is not defined, or it is
     * not a RegExp, then this method will return true (permissive by default).
     *
     * @param  {string} path The path to validate against this.pathConstraint
     * @return {bool}        Whether the path matches the given constraint
     */
    validatePath : function(path) {
      if (! isRegExp(this.pathConstraint)) {
        return true;
      }

      return this.pathConstraint.test(path);
    },

    /**
     * Uses this.paramConstraints (defined in the component's statics) to
     * validate the current path's parameters. If this.paramConstraints is not
     * defined or is not an object, then this method will return true. If a
     * constraint is not provided for a particular parameter, it will assume
     * that anything should match.
     *
     * @param  {string} params The matched params to validate
     * @return {bool}          Whether the params matche the given constraints
     */
    validateParams : function(params) {
      if (! isObject(this.paramConstraints)) {
        return true;
      }

      for (var param in params) {
        if (! params.hasOwnProperty(param)) {
          continue;
        }

        if (! isRegExp(this.paramConstraints[param])) {
          continue;
        }

        if (! this.paramConstraints[param].test(params[param])) {
          return false;
        }
      }

      return true;
    }
  }
};

module.exports = Constrainable;
