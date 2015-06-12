import expect from 'expect';
import Location from '../Location';

describe('Location.isLocation', function () {
  it('returns true for Location objects', function () {
    expect(Location.isLocation(new Location)).toBe(true);
  });

  it('returns false for other objects', function () {
    expect(Location.isLocation('path')).toBe(false);
    expect(Location.isLocation(1)).toBe(false);
    expect(Location.isLocation(true)).toBe(false);
    expect(Location.isLocation(undefined)).toBe(false);
    expect(Location.isLocation(null)).toBe(false);
  });
});
