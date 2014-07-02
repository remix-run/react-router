require('./helper');
var Constrainable = require('../modules/mixins/constrainable');

describe('Constrainable', function() {
  describe('validatePath', function() {
    it('returns true when pathConstraint is not set', function () {
      var constrained = Object.create(Constrainable);

      expect(constrained.statics.validatePath('/abc')).toBe(true);
    });

    it('returns true when pathConstraint is set and matches', function () {
      var constrained = Object.create(Constrainable);
      constrained.statics.pathConstraint = /^\/[A-Za-z]+$/;
      expect(constrained.statics.validatePath('/abc')).toBe(true);
    });

    it('returns false when pathConstraint is set and does not match', function () {
      var constrained = Object.create(Constrainable);
      constrained.statics.pathConstraint = /^\/[A-Za-z]+$/;
      expect(constrained.statics.validatePath('/123')).toBe(false);
    });
  });

  describe('validateParams', function() {
    it('returns true when paramConstraints is not set', function () {
      var constrained = Object.create(Constrainable);

      expect(constrained.statics.validateParams({
        alpha : 'abc',
        numeric : '123'
      })).toBe(true);
    });

    it('returns true when paramConstraints is set and params match', function () {
      var constrained = Object.create(Constrainable);

      constrained.statics.paramConstraints = {
        alpha   : /^[A-Za-z]+$/,
        numeric : /^\d+$/
      };

      expect(constrained.statics.validateParams({
        alpha : 'abc',
        numeric : '123'
      })).toBe(true);
    });

    it('returns true when paramConstraints is set and params do not match', function () {
      var constrained = Object.create(Constrainable);

      constrained.statics.paramConstraints = {
        alpha   : /^[A-Za-z]+$/,
        numeric : /^\d+$/
      };

      expect(constrained.statics.validateParams({
        alpha : '123',
        numeric : 'abc'
      })).toBe(false);
    });

    it('returns correct value when not all params have constraints', function () {
      var constrained = Object.create(Constrainable);

      constrained.statics.paramConstraints = {
        alpha   : /^[A-Za-z]+$/
      };

      expect(constrained.statics.validateParams({
        alpha : 'abc',
        noConstraint : 'abc123'
      })).toBe(true);
    });
  });
});

// describe('Path.testConstraints', function () {
//   it('returns false when one or more constraints fail', function () {
//     var params = {
//       id   : 123,
//       name : 'Abc'
//     };

//     var constraints = {
//       id : /^\d+$/,
//       name : /^[a-z]+$/
//     };

//     expect(Path.testConstraints(params, constraints)).toBe(false);
//   });

//   it('returns true when constraints pass', function () {
//     var params = {
//       id   : 123,
//       name : 'Abc'
//     };

//     var constraints = {
//       id : /^\d+$/,
//       name : /^[A-Za-z]+$/
//     };

//     expect(Path.testConstraints(params, constraints)).toBe(true);
//   });
// });

// describe('when a pattern has dynamic segments with constraints', function() {
//     var pattern = '/comments/:id/edit',
//         constraints = {
//             id : /\d+/
//         };

//     describe('and the constraints match', function() {
//         expect(Path.extractParams(pattern, '/comments/123/edit', constraints))
//             .toEqual({ id : 123 });
//     });

//     describe('and the constraints do not match', function() {
//         expect(Path.extractParams(pattern, '/comments/abc/edit', constraints))
//             .toBe(null);
//     });
//   });
