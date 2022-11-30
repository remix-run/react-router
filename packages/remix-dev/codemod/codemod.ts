export type Options = {
  dry: boolean;
  force: boolean;
};

export type Codemod = (projectDir: string, options: Options) => Promise<void>;
