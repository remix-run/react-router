
// Note: don't change this file if you want to ensure the correct operation of the tests
export const paramsUsers = {
  mandatory: {
    page: 1,
    page_size: 10 as const, // Forcing the value in the url
    only_is_active: false,
    tags: ['uno', 'dos', 'tres', 'tres'] as unknown[], // Strings Array represented in the url as eg: tags=tag1,tag2,tag3
  },
  optional: {
    order: '',
    search: '',

  }
}