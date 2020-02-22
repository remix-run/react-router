import { generatePath } from 'react-router';

describe('generatePath', () => {
  describe('with no params', () => {
    it('returns the unmodified path', () => {
      expect(generatePath('/')).toBe('/');
      expect(generatePath('/courses')).toBe('/courses');
    });
  });

  describe('with params', () => {
    it('returns the path without those params interpolated', () => {
      expect(generatePath('/courses/:id', { id: 'routing' })).toBe(
        '/courses/routing'
      );
      expect(generatePath('/courses/*', { '*': 'routing/grades' })).toBe(
        '/courses/routing/grades'
      );
    });
  });

  describe('with extraneous params', () => {
    it('ignores them', () => {
      expect(generatePath('/', { course: 'routing' })).toBe('/');
      expect(generatePath('/courses', { course: 'routing' })).toBe('/courses');
      expect(generatePath('/courses/*', { course: 'routing' })).toBe(
        '/courses/*'
      );
    });
  });

  describe('with missing params', () => {
    it('returns the path without those params interpolated', () => {
      expect(generatePath('/courses/:id', {})).toBe('/courses/:id');
    });
  });
});
