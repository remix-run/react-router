import { Basename, History, Location, LocationDescriptor } from 'history'
import { ParseQueryString, RouteConfig, StringifyQuery } from '..'

export interface MatchArgs {
  routes: RouteConfig;
  basename?: Basename | undefined;
  parseQueryString?: ParseQueryString | undefined;
  stringifyQuery?: StringifyQuery | undefined;
}

export interface MatchLocationArgs extends MatchArgs {
  location: LocationDescriptor;
  history?: History | undefined;
}

export interface MatchHistoryArgs extends MatchArgs {
  location?: LocationDescriptor | undefined;
  history: History;
}

export type MatchCallback = (
  error: any,
  redirectLocation: Location,
  renderProps: any
) => void;

export default function match(
  args: MatchLocationArgs | MatchHistoryArgs,
  cb: MatchCallback
): void
