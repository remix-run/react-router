
// Even you can import OrserUser from other file constants to transform the type in a more global way
// import { OrderUser } from './OrderUser';

export type TagsUserProps = 'uno' | 'dos' | 'tres' | 'react' | 'node' | 'typescript' | 'javascript';
export const paramsUsers = {
  mandatory: {
    page: 1,
    page_size: 10 as const, // Force to 10 as default
    only_is_active: false,
    tags: ['uno', 'dos', 'tres', 'tres'] as Array<TagsUserProps>, // Array de strings representados en la url como ej: tags=tag1,tag2,tag3

  },
  optional: {
    order: '',
    search: '',

  }
}
