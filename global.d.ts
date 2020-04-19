export {};

declare global {
  // @ts-ignore
  const __DEV__: boolean;
}

declare module 'react'{

  export interface TimeoutConfig {
    /**
     * This timeout (in milliseconds) tells React how long to wait before showing the next state.
     *
     * React will always try to use a shorter lag when network and device allows it.
     *
     * **NOTE: We recommend that you share Suspense Config between different modules.**
     */
    timeoutMs: number;
}

  export interface SuspenseConfig extends TimeoutConfig {
    busyDelayMs?: number;
    busyMinDurationMs?: number;
}
  // must be synchronous
  export type TransitionFunction = () => void | undefined;
  // strange definition to allow vscode to show documentation on the invocation
  export interface TransitionStartFunction {
      /**
       * State updates caused inside the callback are allowed to be deferred.
       *
       * **If some state update causes a component to suspend, that state update should be wrapped in a transition.**
       *
       * @param callback A _synchronous_ function which causes state updates that can be deferred.
       */
      (callback: TransitionFunction): void;
  }
   /**
     * Allows components to avoid undesirable loading states by waiting for content to load
     * before transitioning to the next screen. It also allows components to defer slower,
     * data fetching updates until subsequent renders so that more crucial updates can be
     * rendered immediately.
     *
     * The `useTransition` hook returns two values in an array.
     *
     * The first is a function that takes a callback. We can use it to tell React which state we want to defer.
     * The seconda boolean. It’s React’s way of informing us whether we’re waiting for the transition to finish.
     *
     * **If some state update causes a component to suspend, that state update should be wrapped in a transition.**
     *
     * @param config An optional object with `timeoutMs`
     *
     * @see https://reactjs.org/docs/concurrent-mode-reference.html#usetransition
     */
    export function useTransition(config?: SuspenseConfig | null): [TransitionStartFunction, boolean];
}