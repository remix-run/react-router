var expect = require('expect');
var Location = require('../Location');
var NavigationTypes = require('../NavigationTypes');

describe('Location', function () {
  var location;

  it('can be revived', function () {
    location = new Location('/the/path', NavigationTypes.POP);

    var serialized = JSON.stringify(location);
    var revived = JSON.parse(serialized, Location.revive);

    expect(revived instanceof Location).toEqual(true);
    expect(revived.path).toEqual(location.path);
    expect(revived.navigationType).toEqual(location.navigationType);
  });

  describe('with a query string', function () {
    beforeEach(function () {
      location = new Location('/the/path?the=query');
    });

    it('knows its pathname', function() {
      expect(location.getPathname()).toEqual('/the/path');
    });

    it('knows its query string', function() {
      expect(location.getQueryString()).toEqual('the=query');
    });
  });

  describe('without a query string', function () {
    beforeEach(function () {
      location = new Location('/the/path');
    });

    it('knows its pathname', function() {
      expect(location.getPathname()).toEqual('/the/path');
    });

    it('has an empty query string', function() {
      expect(location.getQueryString()).toEqual('');
    });
  });
});
