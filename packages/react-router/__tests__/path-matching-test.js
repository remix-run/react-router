import { matchRoutes } from 'react-router';

describe('path matching', () => {
  function pick(routes, pathname) {
    let matches = matchRoutes(routes, { pathname });
    return matches ? matches.map(match => match.route.value).join('.') : null;
  }

  test('root vs. dynamic', () => {
    let routes = [
      { path: '/', value: 'Root' },
      { path: ':id', value: 'Dynamic' }
    ];

    expect(pick(routes, '/')).toBe('Root');
    expect(pick(routes, '/123')).toBe('Dynamic');
  });

  test('precedence of a bunch of routes in a flat route config', () => {
    let routes = [
      { path: '/groups/main/users/me', value: 'MainGroupMe' },
      { path: '/groups/:groupId/users/me', value: 'GroupMe' },
      { path: '/groups/:groupId/users/:userId', value: 'GroupUser' },
      { path: '/groups/:groupId/users/*', value: 'GroupUsersSplat' },
      { path: '/groups/main/users', value: 'MainGroupUsers' },
      { path: '/groups/:groupId/users', value: 'GroupUsers' },
      { path: '/groups/main', value: 'MainGroup' },
      { path: '/groups/:groupId', value: 'Group' },
      { path: '/groups', value: 'Groups' },
      { path: '/files/*', value: 'FilesSplat' },
      { path: '/files', value: 'Files' },
      { path: '/:one/:two/:three/:four/:five', value: 'Fiver' },
      { path: '/', value: 'Root' },
      { path: '*', value: 'Default' }
    ];

    expect(pick(routes, '/groups/main/users/me')).toBe('MainGroupMe');
    expect(pick(routes, '/groups/other/users/me')).toBe('GroupMe');
    expect(pick(routes, '/groups/123/users/456')).toBe('GroupUser');
    expect(pick(routes, '/groups/main/users/a/b')).toBe('GroupUsersSplat');
    expect(pick(routes, '/groups/main/users')).toBe('MainGroupUsers');
    expect(pick(routes, '/groups/123/users')).toBe('GroupUsers');
    expect(pick(routes, '/groups/main')).toBe('MainGroup');
    expect(pick(routes, '/groups/123')).toBe('Group');
    expect(pick(routes, '/groups')).toBe('Groups');
    expect(pick(routes, '/files/some/long/path')).toBe('FilesSplat');
    expect(pick(routes, '/files')).toBe('Files');
    expect(pick(routes, '/one/two/three/four/five')).toBe('Fiver');
    expect(pick(routes, '/')).toBe('Root');
    expect(pick(routes, '/no/where')).toBe('Default');
  });

  test('precedence of a bunch of routes in a nested route config', () => {
    let routes = [
      {
        path: 'courses',
        value: 'Courses',
        children: [
          {
            path: ':id',
            value: 'Course',
            children: [{ path: 'subjects', value: 'CourseSubjects' }]
          },
          { path: 'new', value: 'NewCourse' },
          { path: '/', value: 'CoursesIndex' },
          { path: '*', value: 'CoursesNotFound' }
        ]
      },
      {
        path: 'courses',
        value: 'Landing',
        children: [
          { path: 'react-fundamentals', value: 'ReactFundamentals' },
          { path: 'advanced-react', value: 'AdvancedReact' },
          { path: '*', value: 'NeverRender' }
        ]
      },
      { path: '/', value: 'Home' },
      { path: '*', value: 'NotFound' }
    ];

    expect(pick(routes, '/courses')).toBe('Courses.CoursesIndex');
    expect(pick(routes, '/courses/routing')).toBe('Courses.Course');
    expect(pick(routes, '/courses/routing/subjects')).toBe(
      'Courses.Course.CourseSubjects'
    );
    expect(pick(routes, '/courses/new')).toBe('Courses.NewCourse');
    expect(pick(routes, '/courses/whatever/path')).toBe(
      'Courses.CoursesNotFound'
    );
    expect(pick(routes, '/courses/react-fundamentals')).toBe(
      'Landing.ReactFundamentals'
    );
    expect(pick(routes, '/courses/advanced-react')).toBe(
      'Landing.AdvancedReact'
    );
    expect(pick(routes, '/')).toBe('Home');
    expect(pick(routes, '/whatever')).toBe('NotFound');
  });

  test('nested index route vs sibling static route', () => {
    let routes = [
      {
        path: ':page',
        value: 'PageLayout',
        children: [{ path: '/', value: 'PageIndex' }]
      },
      { path: 'page', value: 'Page' }
    ];

    expect(pick(routes, '/page')).toBe('Page');
  });
});

describe('path matching with a basename', () => {
  let routes = [
    {
      path: '/users/:userId',
      children: [
        {
          path: 'subjects',
          children: [
            {
              path: ':courseId'
            }
          ]
        }
      ]
    }
  ];

  test('top-level route', () => {
    let location = { pathname: '/app/users/michael' };
    let matches = matchRoutes(routes, location, '/app');

    expect(matches).not.toBeNull();
    expect(matches).toHaveLength(1);
    expect(matches).toMatchObject([
      {
        pathname: '/users/michael',
        params: { userId: 'michael' }
      }
    ]);
  });

  test('deeply nested route', () => {
    let location = { pathname: '/app/users/michael/subjects/react' };
    let matches = matchRoutes(routes, location, '/app');

    expect(matches).not.toBeNull();
    expect(matches).toHaveLength(3);
    expect(matches).toMatchObject([
      {
        pathname: '/users/michael',
        params: { userId: 'michael' }
      },
      {
        pathname: '/users/michael/subjects',
        params: { userId: 'michael' }
      },
      {
        pathname: '/users/michael/subjects/react',
        params: { userId: 'michael', courseId: 'react' }
      }
    ]);
  });
});

describe('path matching with splats', () => {
  test('splat after /', () => {
    let match = matchRoutes(
      [{ path: 'users/:id/files/*' }],
      '/users/mj/files/secrets.md'
    );

    expect(match).not.toBeNull();
    expect(match[0]).toMatchObject({
      params: { id: 'mj', '*': 'secrets.md' },
      pathname: '/users/mj/files'
    });
  });

  test('splat after something other than /', () => {
    let match = matchRoutes(
      [{ path: 'users/:id/files-*' }],
      '/users/mj/files-secrets.md'
    );

    expect(match).not.toBeNull();
    expect(match[0]).toMatchObject({
      params: { id: 'mj', '*': 'secrets.md' },
      pathname: '/users/mj/files-'
    });
  });

  test('parent route with splat after /', () => {
    let match = matchRoutes(
      [{ path: 'users/:id/files/*', children: [{ path: 'secrets.md' }] }],
      '/users/mj/files/secrets.md'
    );

    expect(match).not.toBeNull();
    expect(match[0]).toMatchObject({
      params: { id: 'mj', '*': 'secrets.md' },
      pathname: '/users/mj/files'
    });
    expect(match[1]).toMatchObject({
      params: { id: 'mj' },
      pathname: '/users/mj/files/secrets.md'
    });
  });

  test('parent route with splat after something other than /', () => {
    let match = matchRoutes(
      [{ path: 'users/:id/files-*', children: [{ path: 'secrets.md' }] }],
      '/users/mj/files-secrets.md'
    );

    expect(match).not.toBeNull();
    expect(match[0]).toMatchObject({
      params: { id: 'mj', '*': 'secrets.md' },
      pathname: '/users/mj/files-'
    });
    expect(match[1]).toMatchObject({
      params: { id: 'mj' },
      pathname: '/users/mj/files-secrets.md'
    });
  });
});
