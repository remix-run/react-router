type BaseOptions = {
  /**
   Number of concurrently pending promises returned by `mapper`.

   Must be an integer from 1 and up or `Infinity`.

   @default Infinity
   */
  readonly concurrency?: number;
};

export type Options = BaseOptions & {
  /**
   When `true`, the first mapper rejection will be rejected back to the consumer.

   When `false`, instead of stopping when a promise rejects, it will wait for all the promises to settle and then reject with an [`AggregateError`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/AggregateError) containing all the errors from the rejected promises.

   Caveat: When `true`, any already-started async mappers will continue to run until they resolve or reject. In the case of infinite concurrency with sync iterables, *all* mappers are invoked on startup and will continue after the first rejection. [Issue #51](https://github.com/sindresorhus/p-map/issues/51) can be implemented for abort control.

   @default true
   */
  readonly stopOnError?: boolean;

  /**
   You can abort the promises using [`AbortController`](https://developer.mozilla.org/en-US/docs/Web/API/AbortController).

   @example
   ```
   import pMap from 'p-map';
   import delay from 'delay';

   const abortController = new AbortController();

   setTimeout(() => {
   abortController.abort();
   }, 500);

   const mapper = async value => value;

   await pMap([delay(1000), delay(1000)], mapper, {signal: abortController.signal});
   // Throws AbortError (DOMException) after 500 ms.
   ```
   */
  readonly signal?: AbortSignal;
};

export type IterableOptions = BaseOptions & {
  /**
   Maximum number of promises returned by `mapper` that have resolved but not yet collected by the consumer of the async iterable. Calls to `mapper` will be limited so that there is never too much backpressure.

   Useful whenever you are consuming the iterable slower than what the mapper function can produce concurrently. For example, to avoid making an overwhelming number of HTTP requests if you are saving each of the results to a database.

   Default: `options.concurrency`
   */
  readonly backpressure?: number;
};

type MaybePromise<T> = T | Promise<T>;

/**
 Function which is called for every item in `input`. Expected to return a `Promise` or value.

 @param element - Iterated element.
 @param index - Index of the element in the source array.
 */
export type Mapper<Element = any, NewElement = unknown> = (
  element: Element,
  index: number
) => MaybePromise<NewElement | typeof pMapSkip>;

/**
 @param input - Synchronous or asynchronous iterable that is iterated over concurrently, calling the `mapper` function for each element. Each iterated item is `await`'d before the `mapper` is invoked so the iterable may return a `Promise` that resolves to an item. Asynchronous iterables (different from synchronous iterables that return `Promise` that resolves to an item) can be used when the next item may not be ready without waiting for an asynchronous process to complete and/or the end of the iterable may be reached after the asynchronous process completes. For example, reading from a remote queue when the queue has reached empty, or reading lines from a stream.
 @param mapper - Function which is called for every item in `input`. Expected to return a `Promise` or value.
 @returns A `Promise` that is fulfilled when all promises in `input` and ones returned from `mapper` are fulfilled, or rejects if any of the promises reject. The fulfilled value is an `Array` of the fulfilled values returned from `mapper` in `input` order.

 @example
 ```
 import pMap from 'p-map';
 import got from 'got';

 const sites = [
 getWebsiteFromUsername('sindresorhus'), //=> Promise
 'https://avajs.dev',
 'https://github.com'
 ];

 const mapper = async site => {
 const {requestUrl} = await got.head(site);
 return requestUrl;
 };

 const result = await pMap(sites, mapper, {concurrency: 2});

 console.log(result);
 //=> ['https://sindresorhus.com/', 'https://avajs.dev/', 'https://github.com/']
 ```
 */
export function pMap<Element, NewElement>(
  input: AsyncIterable<Element | Promise<Element>> | Iterable<Element | Promise<Element>>,
  mapper: Mapper<Element, NewElement>,
  options?: Options
): Promise<Array<Exclude<NewElement, typeof pMapSkip>>>;

/**
 @param input - Synchronous or asynchronous iterable that is iterated over concurrently, calling the `mapper` function for each element. Each iterated item is `await`'d before the `mapper` is invoked so the iterable may return a `Promise` that resolves to an item. Asynchronous iterables (different from synchronous iterables that return `Promise` that resolves to an item) can be used when the next item may not be ready without waiting for an asynchronous process to complete and/or the end of the iterable may be reached after the asynchronous process completes. For example, reading from a remote queue when the queue has reached empty, or reading lines from a stream.
 @param mapper - Function which is called for every item in `input`. Expected to return a `Promise` or value.
 @returns An async iterable that streams each return value from `mapper` in order.

 @example
 ```
 import {pMapIterable} from 'p-map';

 // Multiple posts are fetched concurrently, with limited concurrency and backpressure
 for await (const post of pMapIterable(postIds, getPostMetadata, {concurrency: 8})) {
 console.log(post);
 };
 ```
 */
export function pMapIterable<Element, NewElement>(
  input: AsyncIterable<Element | Promise<Element>> | Iterable<Element | Promise<Element>>,
  mapper: Mapper<Element, NewElement>,
  options?: IterableOptions
): AsyncIterable<Exclude<NewElement, typeof pMapSkip>>;

/**
 Return this value from a `mapper` function to skip including the value in the returned array.

 @example
 ```
 import pMap, {pMapSkip} from 'p-map';
 import got from 'got';

 const sites = [
 getWebsiteFromUsername('sindresorhus'), //=> Promise
 'https://avajs.dev',
 'https://example.invalid',
 'https://github.com'
 ];

 const mapper = async site => {
 try {
 const {requestUrl} = await got.head(site);
 return requestUrl;
 } catch {
 return pMapSkip;
 }
 };

 const result = await pMap(sites, mapper, {concurrency: 2});

 console.log(result);
 //=> ['https://sindresorhus.com/', 'https://avajs.dev/', 'https://github.com/']
 ```
 */
export const pMapSkip: unique symbol;
