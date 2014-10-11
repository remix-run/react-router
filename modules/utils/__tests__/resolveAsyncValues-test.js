var assert = require('assert');
var expect = require('expect');
var copyProperties = require('react/lib/copyProperties');
var resolveAsyncValues = require('../resolveAsyncValues');
var Promise = require('../Promise');

describe('resolveAsyncValues', function () {

  var setValues, receivedValues;
  beforeEach(function () {
    receivedValues = {};
    setValues = function (newValues) {
      copyProperties(receivedValues, newValues);
    };
  });

  describe('when asyncValues has no async values', function () {
    it('resolves immediately', function () {
      var resolved = false;

      resolveAsyncValues({ a: 'b' }, setValues, function (error) {
        assert(error == null);
        expect(receivedValues).toEqual({ a: 'b' });
        resolved = true;
      });

      assert(resolved);
    });
  });

  describe('when asyncValues has an async value', function () {
    it('resolves asynchronously', function (done) {
      var resolved = false;

      resolveAsyncValues({ a: Promise.resolve('b') }, setValues, function (error) {
        assert(error == null);
        expect(receivedValues).toEqual({ a: 'b' });
        resolved = true;
        done(error);
      });

      assert(!resolved);
    });
  });

  describe('when asyncValues has a rejected async value', function () {
    it('passes the error/reason to the callback', function (done) {
      resolveAsyncValues({ a: Promise.reject('boom!') }, setValues, function (error) {
        expect(error).toEqual('boom!');
        done();
      });
    });
  });

});
