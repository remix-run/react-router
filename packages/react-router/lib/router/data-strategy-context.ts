export type DataStrategyInitiator = "navigation" | "fetcher" | "revalidation";

let requestInitiators = new WeakMap<Request, DataStrategyInitiator>();

export function setDataStrategyInitiator(
  request: Request,
  initiator: DataStrategyInitiator,
) {
  requestInitiators.set(request, initiator);
}

export function getDataStrategyInitiator(
  request: Request,
): DataStrategyInitiator | undefined {
  return requestInitiators.get(request);
}
