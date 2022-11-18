export type WriteChannel<T> = {
  write: (data: T) => void;
};
export type ReadChannel<T> = {
  read: () => Promise<T>;
};
export type Channel<T> = WriteChannel<T> & ReadChannel<T>;

export const createChannel = <T>(): Channel<T> => {
  let promiseResolve: (value: T) => void;

  let promise = new Promise<T>((resolve) => {
    promiseResolve = resolve;
  });

  return {
    write: promiseResolve!,
    read: () => promise,
  };
};
