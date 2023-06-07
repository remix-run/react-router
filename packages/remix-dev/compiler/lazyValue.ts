import * as Channel from "../channel";

export type LazyValue<T> = {
  get: () => Promise<T>;
  cancel: () => void;
};

export const createLazyValue = <T>(args: {
  get: () => Promise<T>;
  onCancel?: (args: {
    resolve: (value: T) => void;
    reject: (err?: any) => void;
  }) => void;
}): LazyValue<T> => {
  let channel: Channel.Type<T> | undefined;

  return {
    async get() {
      // Create channel and request lazy value on first `get` call
      if (!channel) {
        channel = Channel.create();
        try {
          channel.ok(await args.get());
        } catch (err) {
          channel.err(err);
        }
      }

      // Share the same result with all callers
      let result = await channel.result;

      if (!result.ok) {
        throw result.error;
      }

      return result.value;
    },
    cancel() {
      args.onCancel?.({
        resolve: (value) => channel?.ok(value),
        reject: (error) => channel?.err(error),
      });
    },
  };
};
