/**
 * react-router v8.0.1
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */
import { PROTOCOL_RELATIVE_URL_REGEX, normalizeProtocolRelativeUrl } from "./url.js";
import { createBrowserURLImpl, createLocation, createPath, invariant, parsePath, warning } from "./history.js";
import { ErrorResponseImpl, RouterContextProvider, convertRouteMatchToUiMatch, convertRoutesToDataRoutes, flattenAndRankRoutes, getPathContributingMatches, getResolveToMatches, getRoutePattern, isAbsoluteUrl, isRouteErrorResponse, isUnsupportedLazyRouteFunctionKey, isUnsupportedLazyRouteObjectKey, matchRoutesImpl, prependBasename, removeDoubleSlashes, resolveTo, stripBasename } from "./utils.js";
import { getRouteInstrumentationUpdates, instrumentClientSideRouter } from "./instrumentation.js";
//#region lib/router/router.ts
const validMutationMethodsArr = [
	"POST",
	"PUT",
	"PATCH",
	"DELETE"
];
const validMutationMethods = new Set(validMutationMethodsArr);
const validRequestMethodsArr = ["GET", ...validMutationMethodsArr];
const validRequestMethods = new Set(validRequestMethodsArr);
const redirectStatusCodes = new Set([
	301,
	302,
	303,
	307,
	308
]);
const redirectPreserveMethodStatusCodes = new Set([307, 308]);
const IDLE_NAVIGATION = {
	state: "idle",
	location: void 0,
	matches: void 0,
	historyAction: void 0,
	formMethod: void 0,
	formAction: void 0,
	formEncType: void 0,
	formData: void 0,
	json: void 0,
	text: void 0
};
const IDLE_FETCHER = {
	state: "idle",
	data: void 0,
	formMethod: void 0,
	formAction: void 0,
	formEncType: void 0,
	formData: void 0,
	json: void 0,
	text: void 0
};
const IDLE_BLOCKER = {
	state: "unblocked",
	proceed: void 0,
	reset: void 0,
	location: void 0
};
const TRANSITIONS_STORAGE_KEY = "remix-router-transitions";
const ResetLoaderDataSymbol = Symbol("ResetLoaderData");
/**
* Encapsulates the stable and in-flight route trees together with their
* pre-computed branch caches so the structures always stay in sync.
*/
var DataRoutes = class {
	#routes;
	#branches;
	#hmrRoutes;
	#hmrBranches;
	constructor(routes) {
		this.#routes = routes;
		this.#branches = flattenAndRankRoutes(routes);
	}
	/** The stable route tree */
	get stableRoutes() {
		return this.#routes;
	}
	/** The in-flight route tree if one is active, otherwise the stable tree */
	get activeRoutes() {
		return this.#hmrRoutes ?? this.#routes;
	}
	/** Pre-computed branches */
	get branches() {
		return this.#hmrBranches ?? this.#branches;
	}
	get hasHMRRoutes() {
		return this.#hmrRoutes != null;
	}
	/** Replace the stable route tree and recompute its branches */
	setRoutes(routes) {
		this.#routes = routes;
		this.#branches = flattenAndRankRoutes(routes);
	}
	/** Set a new in-flight route tree and recompute its branches */
	setHmrRoutes(routes) {
		this.#hmrRoutes = routes;
		this.#hmrBranches = flattenAndRankRoutes(routes);
	}
	/** Commit in-flight routes/branches to the stable slot and clear in-flight */
	commitHmrRoutes() {
		if (this.#hmrRoutes) {
			this.#routes = this.#hmrRoutes;
			this.#branches = this.#hmrBranches;
			this.#hmrRoutes = void 0;
			this.#hmrBranches = void 0;
		}
	}
};
/**
* Create a router and listen to history POP navigations
*/
function createRouter(init) {
	const routerWindow = init.window ? init.window : typeof window !== "undefined" ? window : void 0;
	const isBrowser = typeof routerWindow !== "undefined" && typeof routerWindow.document !== "undefined" && typeof routerWindow.document.createElement !== "undefined";
	invariant(init.routes.length > 0, "You must provide a non-empty routes array to createRouter");
	let hydrationRouteProperties = init.hydrationRouteProperties || [];
	let _mapRouteProperties = init.mapRouteProperties;
	let mapRouteProperties = _mapRouteProperties ? _mapRouteProperties : () => ({});
	if (init.instrumentations) {
		let instrumentations = init.instrumentations;
		mapRouteProperties = (route) => {
			return {
				..._mapRouteProperties?.(route),
				...getRouteInstrumentationUpdates(instrumentations.map((i) => i.route).filter(Boolean), route)
			};
		};
	}
	let manifest = {};
	let dataRoutes = new DataRoutes(convertRoutesToDataRoutes(init.routes, mapRouteProperties, void 0, manifest));
	let basename = init.basename || "/";
	if (!basename.startsWith("/")) basename = `/${basename}`;
	let dataStrategyImpl = init.dataStrategy || defaultDataStrategyWithMiddleware;
	let future = { ...init.future };
	let unlistenHistory = null;
	let subscribers = /* @__PURE__ */ new Set();
	let bufferedInitialStateUpdate = null;
	let savedScrollPositions = null;
	let getScrollRestorationKey = null;
	let getScrollPosition = null;
	let initialScrollRestored = init.hydrationData != null;
	let initialMatches = matchRoutesImpl(dataRoutes.activeRoutes, init.history.location, basename, false, dataRoutes.branches);
	let initialMatchesIsFOW = false;
	let initialErrors = null;
	let initialized;
	let renderFallback;
	if (initialMatches == null && !init.patchRoutesOnNavigation) {
		let error = getInternalRouterError(404, { pathname: init.history.location.pathname });
		let { matches, route } = getShortCircuitMatches(dataRoutes.activeRoutes);
		initialized = true;
		renderFallback = !initialized;
		initialMatches = matches;
		initialErrors = { [route.id]: error };
	} else {
		if (initialMatches && !init.hydrationData) {
			if (checkFogOfWar(initialMatches, dataRoutes.activeRoutes, init.history.location.pathname).active) initialMatches = null;
		}
		if (!initialMatches) {
			initialized = false;
			renderFallback = !initialized;
			initialMatches = [];
			let fogOfWar = checkFogOfWar(null, dataRoutes.activeRoutes, init.history.location.pathname);
			if (fogOfWar.active && fogOfWar.matches) {
				initialMatchesIsFOW = true;
				initialMatches = fogOfWar.matches;
			}
		} else if (initialMatches.some((m) => m.route.lazy)) {
			initialized = false;
			renderFallback = !initialized;
		} else if (!initialMatches.some((m) => routeHasLoaderOrMiddleware(m.route))) {
			initialized = true;
			renderFallback = !initialized;
		} else {
			let loaderData = init.hydrationData ? init.hydrationData.loaderData : null;
			let errors = init.hydrationData ? init.hydrationData.errors : null;
			let relevantMatches = initialMatches;
			if (errors) {
				let idx = initialMatches.findIndex((m) => errors[m.route.id] !== void 0);
				relevantMatches = relevantMatches.slice(0, idx + 1);
			}
			renderFallback = false;
			initialized = true;
			relevantMatches.forEach((m) => {
				let status = getRouteHydrationStatus(m.route, loaderData, errors);
				renderFallback = renderFallback || status.renderFallback;
				initialized = initialized && !status.shouldLoad;
			});
		}
	}
	let router;
	let state = {
		historyAction: init.history.action,
		location: init.history.location,
		matches: initialMatches,
		initialized,
		renderFallback,
		navigation: IDLE_NAVIGATION,
		restoreScrollPosition: init.hydrationData != null ? false : null,
		preventScrollReset: false,
		revalidation: "idle",
		loaderData: init.hydrationData && init.hydrationData.loaderData || {},
		actionData: init.hydrationData && init.hydrationData.actionData || null,
		errors: init.hydrationData && init.hydrationData.errors || initialErrors,
		fetchers: /* @__PURE__ */ new Map(),
		blockers: /* @__PURE__ */ new Map()
	};
	let pendingAction = "POP";
	let pendingPopstateNavigationDfd = null;
	let pendingPreventScrollReset = false;
	let pendingNavigationController;
	let pendingViewTransitionEnabled = false;
	let appliedViewTransitions = /* @__PURE__ */ new Map();
	let removePageHideEventListener = null;
	let isUninterruptedRevalidation = false;
	let isRevalidationRequired = false;
	let cancelledFetcherLoads = /* @__PURE__ */ new Set();
	let fetchControllers = /* @__PURE__ */ new Map();
	let incrementingLoadId = 0;
	let pendingNavigationLoadId = -1;
	let fetchReloadIds = /* @__PURE__ */ new Map();
	let fetchRedirectIds = /* @__PURE__ */ new Set();
	let fetchLoadMatches = /* @__PURE__ */ new Map();
	let activeFetchers = /* @__PURE__ */ new Map();
	let fetchersQueuedForDeletion = /* @__PURE__ */ new Set();
	let blockerFunctions = /* @__PURE__ */ new Map();
	let unblockBlockerHistoryUpdate = void 0;
	let pendingRevalidationDfd = null;
	function initialize() {
		unlistenHistory = init.history.listen(({ action: historyAction, location, delta }) => {
			if (unblockBlockerHistoryUpdate) {
				unblockBlockerHistoryUpdate();
				unblockBlockerHistoryUpdate = void 0;
				return;
			}
			warning(blockerFunctions.size === 0 || delta != null, "You are trying to use a blocker on a POP navigation to a location that was not created by @remix-run/router. This will fail silently in production. This can happen if you are navigating outside the router via `window.history.pushState`/`window.location.hash` instead of using router navigation APIs.  This can also happen if you are using createHashRouter and the user manually changes the URL.");
			let blockerKey = shouldBlockNavigation({
				currentLocation: state.location,
				nextLocation: location,
				historyAction
			});
			if (blockerKey && delta != null) {
				let nextHistoryUpdatePromise = new Promise((resolve) => {
					unblockBlockerHistoryUpdate = resolve;
				});
				init.history.go(delta * -1);
				updateBlocker(blockerKey, {
					state: "blocked",
					location,
					proceed() {
						updateBlocker(blockerKey, {
							state: "proceeding",
							proceed: void 0,
							reset: void 0,
							location
						});
						nextHistoryUpdatePromise.then(() => init.history.go(delta));
					},
					reset() {
						let blockers = new Map(state.blockers);
						blockers.set(blockerKey, IDLE_BLOCKER);
						updateState({ blockers });
					}
				});
				pendingPopstateNavigationDfd?.resolve();
				pendingPopstateNavigationDfd = null;
				return;
			}
			return startNavigation(historyAction, location);
		});
		if (isBrowser) {
			restoreAppliedTransitions(routerWindow, appliedViewTransitions);
			let _saveAppliedTransitions = () => persistAppliedTransitions(routerWindow, appliedViewTransitions);
			routerWindow.addEventListener("pagehide", _saveAppliedTransitions);
			removePageHideEventListener = () => routerWindow.removeEventListener("pagehide", _saveAppliedTransitions);
		}
		if (!state.initialized) startNavigation("POP", state.location, { initialHydration: true });
		return router;
	}
	function dispose() {
		if (unlistenHistory) unlistenHistory();
		if (removePageHideEventListener) removePageHideEventListener();
		subscribers.clear();
		pendingNavigationController && pendingNavigationController.abort();
		state.fetchers.forEach((_, key) => deleteFetcher(state.fetchers, key));
		state.blockers.forEach((_, key) => deleteBlocker(key));
	}
	function subscribe(fn) {
		subscribers.add(fn);
		if (bufferedInitialStateUpdate) {
			let { newErrors } = bufferedInitialStateUpdate;
			bufferedInitialStateUpdate = null;
			fn(state, {
				deletedFetchers: [],
				newErrors,
				viewTransitionOpts: void 0,
				flushSync: false
			});
		}
		return () => subscribers.delete(fn);
	}
	function updateState(newState, opts = {}) {
		if (newState.matches) newState.matches = newState.matches.map((m) => {
			let route = manifest[m.route.id];
			let matchRoute = m.route;
			if (matchRoute.element !== route.element || matchRoute.errorElement !== route.errorElement || matchRoute.hydrateFallbackElement !== route.hydrateFallbackElement) return {
				...m,
				route
			};
			return m;
		});
		state = {
			...state,
			...newState
		};
		let unmountedFetchers = [];
		let mountedFetchers = [];
		state.fetchers.forEach((fetcher, key) => {
			if (fetcher.state === "idle") if (fetchersQueuedForDeletion.has(key)) unmountedFetchers.push(key);
			else mountedFetchers.push(key);
		});
		fetchersQueuedForDeletion.forEach((key) => {
			if (!state.fetchers.has(key) && !fetchControllers.has(key)) unmountedFetchers.push(key);
		});
		if (subscribers.size === 0) bufferedInitialStateUpdate = { newErrors: newState.errors ?? null };
		[...subscribers].forEach((subscriber) => subscriber(state, {
			deletedFetchers: unmountedFetchers,
			newErrors: newState.errors ?? null,
			viewTransitionOpts: opts.viewTransitionOpts,
			flushSync: opts.flushSync === true
		}));
		unmountedFetchers.forEach((key) => deleteFetcher(state.fetchers, key));
		mountedFetchers.forEach((key) => state.fetchers.delete(key));
	}
	function completeNavigation(location, newState, { flushSync } = {}) {
		let isActionReload = state.actionData != null && state.navigation.formMethod != null && isMutationMethod(state.navigation.formMethod) && state.navigation.state === "loading" && location.state?._isRedirect !== true;
		let actionData;
		if (newState.actionData) if (Object.keys(newState.actionData).length > 0) actionData = newState.actionData;
		else actionData = null;
		else if (isActionReload) actionData = state.actionData;
		else actionData = null;
		let loaderData = newState.loaderData ? mergeLoaderData(state.loaderData, newState.loaderData, newState.matches || [], newState.errors) : state.loaderData;
		let blockers = state.blockers;
		if (blockers.size > 0) {
			blockers = new Map(blockers);
			blockers.forEach((_, k) => blockers.set(k, IDLE_BLOCKER));
		}
		let restoreScrollPosition = isUninterruptedRevalidation ? false : getSavedScrollPosition(location, newState.matches || state.matches);
		let preventScrollReset = pendingPreventScrollReset === true || state.navigation.formMethod != null && isMutationMethod(state.navigation.formMethod) && location.state?._isRedirect !== true;
		dataRoutes.commitHmrRoutes();
		if (isUninterruptedRevalidation) {} else if (pendingAction === "POP") {} else if (pendingAction === "PUSH") init.history.push(location, location.state);
		else if (pendingAction === "REPLACE") init.history.replace(location, location.state);
		let viewTransitionOpts;
		if (pendingAction === "POP") {
			let priorPaths = appliedViewTransitions.get(state.location.pathname);
			if (priorPaths && priorPaths.has(location.pathname)) viewTransitionOpts = {
				currentLocation: state.location,
				nextLocation: location
			};
			else if (appliedViewTransitions.has(location.pathname)) viewTransitionOpts = {
				currentLocation: location,
				nextLocation: state.location
			};
		} else if (pendingViewTransitionEnabled) {
			let toPaths = appliedViewTransitions.get(state.location.pathname);
			if (toPaths) toPaths.add(location.pathname);
			else {
				toPaths = new Set([location.pathname]);
				appliedViewTransitions.set(state.location.pathname, toPaths);
			}
			viewTransitionOpts = {
				currentLocation: state.location,
				nextLocation: location
			};
		}
		updateState({
			...newState,
			actionData,
			loaderData,
			historyAction: pendingAction,
			location,
			initialized: true,
			renderFallback: false,
			navigation: IDLE_NAVIGATION,
			revalidation: "idle",
			restoreScrollPosition,
			preventScrollReset,
			blockers
		}, {
			viewTransitionOpts,
			flushSync: flushSync === true
		});
		pendingAction = "POP";
		pendingPreventScrollReset = false;
		pendingViewTransitionEnabled = false;
		isUninterruptedRevalidation = false;
		isRevalidationRequired = false;
		pendingPopstateNavigationDfd?.resolve();
		pendingPopstateNavigationDfd = null;
		pendingRevalidationDfd?.resolve();
		pendingRevalidationDfd = null;
	}
	async function navigate(to, opts) {
		pendingPopstateNavigationDfd?.resolve();
		pendingPopstateNavigationDfd = null;
		if (typeof to === "number") {
			if (!pendingPopstateNavigationDfd) pendingPopstateNavigationDfd = createDeferred();
			let promise = pendingPopstateNavigationDfd.promise;
			init.history.go(to);
			return promise;
		}
		let { path, submission, error } = normalizeNavigateOptions(false, normalizeTo(state.location, state.matches, basename, to, opts?.fromRouteId, opts?.relative), opts);
		let maskPath;
		if (opts?.mask) maskPath = {
			pathname: "",
			search: "",
			hash: "",
			...typeof opts.mask === "string" ? parsePath(opts.mask) : {
				...state.location.mask,
				...opts.mask
			}
		};
		let currentLocation = state.location;
		let nextLocation = createLocation(currentLocation, path, opts && opts.state, void 0, maskPath);
		nextLocation = {
			...nextLocation,
			...init.history.encodeLocation(nextLocation)
		};
		let userReplace = opts && opts.replace != null ? opts.replace : void 0;
		let historyAction = "PUSH";
		if (userReplace === true) historyAction = "REPLACE";
		else if (userReplace === false) {} else if (submission != null && isMutationMethod(submission.formMethod) && submission.formAction === state.location.pathname + state.location.search) historyAction = "REPLACE";
		let preventScrollReset = opts && "preventScrollReset" in opts ? opts.preventScrollReset === true : void 0;
		let flushSync = (opts && opts.flushSync) === true;
		let blockerKey = shouldBlockNavigation({
			currentLocation,
			nextLocation,
			historyAction
		});
		if (blockerKey) {
			updateBlocker(blockerKey, {
				state: "blocked",
				location: nextLocation,
				proceed() {
					updateBlocker(blockerKey, {
						state: "proceeding",
						proceed: void 0,
						reset: void 0,
						location: nextLocation
					});
					navigate(to, opts);
				},
				reset() {
					let blockers = new Map(state.blockers);
					blockers.set(blockerKey, IDLE_BLOCKER);
					updateState({ blockers });
				}
			});
			return;
		}
		await startNavigation(historyAction, nextLocation, {
			submission,
			pendingError: error,
			preventScrollReset,
			replace: opts && opts.replace,
			enableViewTransition: opts && opts.viewTransition,
			flushSync,
			callSiteDefaultShouldRevalidate: opts && opts.defaultShouldRevalidate
		});
	}
	function revalidate() {
		if (!pendingRevalidationDfd) pendingRevalidationDfd = createDeferred();
		interruptActiveLoads();
		updateState({ revalidation: "loading" });
		let promise = pendingRevalidationDfd.promise;
		if (state.navigation.state === "submitting") return promise;
		if (state.navigation.state === "idle") {
			startNavigation(state.historyAction, state.location, { startUninterruptedRevalidation: true });
			return promise;
		}
		startNavigation(pendingAction || state.historyAction, state.navigation.location, {
			overrideNavigation: state.navigation,
			enableViewTransition: pendingViewTransitionEnabled === true
		});
		return promise;
	}
	async function startNavigation(historyAction, location, opts) {
		pendingNavigationController && pendingNavigationController.abort();
		pendingNavigationController = null;
		pendingAction = historyAction;
		isUninterruptedRevalidation = (opts && opts.startUninterruptedRevalidation) === true;
		saveScrollPosition(state.location, state.matches);
		pendingPreventScrollReset = (opts && opts.preventScrollReset) === true;
		pendingViewTransitionEnabled = (opts && opts.enableViewTransition) === true;
		let routesToUse = dataRoutes.activeRoutes;
		let matches = opts?.initialHydration && state.matches && state.matches.length > 0 && !initialMatchesIsFOW ? state.matches : matchRoutesImpl(routesToUse, location, basename, false, dataRoutes.branches);
		let flushSync = (opts && opts.flushSync) === true;
		if (matches && state.initialized && !isRevalidationRequired && isHashChangeOnly(state.location, location) && !(opts && opts.submission && isMutationMethod(opts.submission.formMethod))) {
			completeNavigation(location, { matches }, { flushSync });
			return;
		}
		let fogOfWar = checkFogOfWar(matches, routesToUse, location.pathname);
		if (fogOfWar.active && fogOfWar.matches) matches = fogOfWar.matches;
		if (!matches) {
			let { error, notFoundMatches, route } = handleNavigational404(location.pathname);
			completeNavigation(location, {
				matches: notFoundMatches,
				loaderData: {},
				errors: { [route.id]: error }
			}, { flushSync });
			return;
		}
		let loadingNavigation = opts && opts.overrideNavigation ? {
			...opts.overrideNavigation,
			matches,
			historyAction
		} : void 0;
		pendingNavigationController = new AbortController();
		let request = createClientSideRequest(init.history, location, pendingNavigationController.signal, opts && opts.submission);
		let scopedContext = init.getContext ? await init.getContext() : new RouterContextProvider();
		let pendingActionResult;
		if (opts && opts.pendingError) pendingActionResult = [findNearestBoundary(matches).route.id, {
			type: "error",
			error: opts.pendingError
		}];
		else if (opts && opts.submission && isMutationMethod(opts.submission.formMethod)) {
			let actionResult = await handleAction(request, location, opts.submission, matches, historyAction, scopedContext, fogOfWar.active, opts && opts.initialHydration === true, {
				replace: opts.replace,
				flushSync
			});
			if (actionResult.shortCircuited) return;
			if (actionResult.pendingActionResult) {
				let [routeId, result] = actionResult.pendingActionResult;
				if (isErrorResult(result) && isRouteErrorResponse(result.error) && result.error.status === 404) {
					pendingNavigationController = null;
					completeNavigation(location, {
						matches: actionResult.matches,
						loaderData: {},
						errors: { [routeId]: result.error }
					});
					return;
				}
			}
			matches = actionResult.matches || matches;
			pendingActionResult = actionResult.pendingActionResult;
			loadingNavigation = getLoadingNavigation(location, matches, historyAction, opts.submission);
			flushSync = false;
			fogOfWar.active = false;
			request = createClientSideRequest(init.history, request.url, request.signal);
		}
		let { shortCircuited, matches: updatedMatches, loaderData, errors, workingFetchers } = await handleLoaders(request, location, matches, historyAction, scopedContext, fogOfWar.active, loadingNavigation, opts && opts.submission, opts && opts.fetcherSubmission, opts && opts.replace, opts && opts.initialHydration === true, flushSync, pendingActionResult, opts && opts.callSiteDefaultShouldRevalidate);
		if (shortCircuited) return;
		pendingNavigationController = null;
		completeNavigation(location, {
			matches: updatedMatches || matches,
			...getActionDataForCommit(pendingActionResult),
			loaderData,
			errors,
			...workingFetchers ? { fetchers: workingFetchers } : {}
		});
	}
	async function handleAction(request, location, submission, matches, historyAction, scopedContext, isFogOfWar, initialHydration, opts = {}) {
		interruptActiveLoads();
		updateState({ navigation: getSubmittingNavigation(location, matches, historyAction, submission) }, { flushSync: opts.flushSync === true });
		if (isFogOfWar) {
			let discoverResult = await discoverRoutes(matches, location.pathname, request.signal);
			if (discoverResult.type === "aborted") return { shortCircuited: true };
			else if (discoverResult.type === "error") {
				if (discoverResult.partialMatches.length === 0) {
					let { matches, route } = getShortCircuitMatches(dataRoutes.activeRoutes);
					return {
						matches,
						pendingActionResult: [route.id, {
							type: "error",
							error: discoverResult.error
						}]
					};
				}
				let boundaryId = findNearestBoundary(discoverResult.partialMatches).route.id;
				return {
					matches: discoverResult.partialMatches,
					pendingActionResult: [boundaryId, {
						type: "error",
						error: discoverResult.error
					}]
				};
			} else if (!discoverResult.matches) {
				let { notFoundMatches, error, route } = handleNavigational404(location.pathname);
				return {
					matches: notFoundMatches,
					pendingActionResult: [route.id, {
						type: "error",
						error
					}]
				};
			} else matches = discoverResult.matches;
		}
		let result;
		let actionMatch = getTargetMatch(matches, location);
		if (!actionMatch.route.action && !actionMatch.route.lazy) result = {
			type: "error",
			error: getInternalRouterError(405, {
				method: request.method,
				pathname: location.pathname,
				routeId: actionMatch.route.id
			})
		};
		else {
			let results = await callDataStrategy(request, location, getTargetedDataStrategyMatches(mapRouteProperties, manifest, request, location, matches, actionMatch, initialHydration ? [] : hydrationRouteProperties, scopedContext), scopedContext, null);
			result = results[actionMatch.route.id];
			if (!result) {
				for (let match of matches) if (results[match.route.id]) {
					result = results[match.route.id];
					break;
				}
			}
			if (request.signal.aborted) return { shortCircuited: true };
		}
		if (isRedirectResult(result)) {
			let replace;
			if (opts && opts.replace != null) replace = opts.replace;
			else replace = normalizeRedirectLocation(result.response.headers.get("Location"), new URL(request.url), basename, init.history) === state.location.pathname + state.location.search;
			await startRedirectNavigation(request, result, true, {
				submission,
				replace
			});
			return { shortCircuited: true };
		}
		if (isErrorResult(result)) {
			let boundaryMatch = findNearestBoundary(matches, actionMatch.route.id);
			if ((opts && opts.replace) !== true) pendingAction = "PUSH";
			return {
				matches,
				pendingActionResult: [
					boundaryMatch.route.id,
					result,
					actionMatch.route.id
				]
			};
		}
		return {
			matches,
			pendingActionResult: [actionMatch.route.id, result]
		};
	}
	async function handleLoaders(request, location, matches, historyAction, scopedContext, isFogOfWar, overrideNavigation, submission, fetcherSubmission, replace, initialHydration, flushSync, pendingActionResult, callSiteDefaultShouldRevalidate) {
		let loadingNavigation = overrideNavigation || getLoadingNavigation(location, matches, historyAction, submission);
		let activeSubmission = submission || fetcherSubmission || getSubmissionFromNavigation(loadingNavigation);
		let shouldUpdateNavigationState = !isUninterruptedRevalidation && !initialHydration;
		if (isFogOfWar) {
			if (shouldUpdateNavigationState) {
				let actionData = getUpdatedActionData(pendingActionResult);
				updateState({
					navigation: loadingNavigation,
					...actionData !== void 0 ? { actionData } : {}
				}, { flushSync });
			}
			let discoverResult = await discoverRoutes(matches, location.pathname, request.signal);
			if (discoverResult.type === "aborted") return { shortCircuited: true };
			else if (discoverResult.type === "error") {
				if (discoverResult.partialMatches.length === 0) {
					let { matches, route } = getShortCircuitMatches(dataRoutes.activeRoutes);
					return {
						matches,
						loaderData: {},
						errors: { [route.id]: discoverResult.error }
					};
				}
				let boundaryId = findNearestBoundary(discoverResult.partialMatches).route.id;
				return {
					matches: discoverResult.partialMatches,
					loaderData: {},
					errors: { [boundaryId]: discoverResult.error }
				};
			} else if (!discoverResult.matches) {
				let { error, notFoundMatches, route } = handleNavigational404(location.pathname);
				return {
					matches: notFoundMatches,
					loaderData: {},
					errors: { [route.id]: error }
				};
			} else matches = discoverResult.matches;
		}
		let routesToUse = dataRoutes.activeRoutes;
		let { dsMatches, revalidatingFetchers } = getMatchesToLoad(request, scopedContext, mapRouteProperties, manifest, init.history, state, matches, activeSubmission, location, initialHydration ? [] : hydrationRouteProperties, initialHydration === true, isRevalidationRequired, cancelledFetcherLoads, fetchersQueuedForDeletion, fetchLoadMatches, fetchRedirectIds, routesToUse, basename, init.patchRoutesOnNavigation != null, dataRoutes.branches, pendingActionResult, callSiteDefaultShouldRevalidate);
		pendingNavigationLoadId = ++incrementingLoadId;
		if (!init.dataStrategy && !dsMatches.some((m) => m.shouldLoad) && !dsMatches.some((m) => m.route.middleware && m.route.middleware.length > 0) && revalidatingFetchers.length === 0) {
			let workingFetchers = new Map(state.fetchers);
			let didUpdateFetcherRedirects = markFetchRedirectsDone(workingFetchers);
			completeNavigation(location, {
				matches,
				loaderData: {},
				errors: pendingActionResult && isErrorResult(pendingActionResult[1]) ? { [pendingActionResult[0]]: pendingActionResult[1].error } : null,
				...getActionDataForCommit(pendingActionResult),
				...didUpdateFetcherRedirects ? { fetchers: workingFetchers } : {}
			}, { flushSync });
			return { shortCircuited: true };
		}
		if (shouldUpdateNavigationState) {
			let updates = {};
			if (!isFogOfWar) {
				updates.navigation = loadingNavigation;
				let actionData = getUpdatedActionData(pendingActionResult);
				if (actionData !== void 0) updates.actionData = actionData;
			}
			if (revalidatingFetchers.length > 0) updates.fetchers = getUpdatedRevalidatingFetchers(revalidatingFetchers);
			updateState(updates, { flushSync });
		}
		revalidatingFetchers.forEach((rf) => {
			abortFetcher(rf.key);
			if (rf.controller) fetchControllers.set(rf.key, rf.controller);
		});
		let abortPendingFetchRevalidations = () => revalidatingFetchers.forEach((f) => abortFetcher(f.key));
		if (pendingNavigationController) pendingNavigationController.signal.addEventListener("abort", abortPendingFetchRevalidations);
		let { loaderResults, fetcherResults } = await callLoadersAndMaybeResolveData(dsMatches, revalidatingFetchers, request, location, scopedContext);
		if (request.signal.aborted) return { shortCircuited: true };
		if (pendingNavigationController) pendingNavigationController.signal.removeEventListener("abort", abortPendingFetchRevalidations);
		revalidatingFetchers.forEach((rf) => fetchControllers.delete(rf.key));
		let redirect = findRedirect(loaderResults);
		if (redirect) {
			await startRedirectNavigation(request, redirect.result, true, { replace });
			return { shortCircuited: true };
		}
		redirect = findRedirect(fetcherResults);
		if (redirect) {
			fetchRedirectIds.add(redirect.key);
			await startRedirectNavigation(request, redirect.result, true, { replace });
			return { shortCircuited: true };
		}
		let workingFetchers = new Map(state.fetchers);
		let { loaderData, errors } = processLoaderData(state, matches, loaderResults, pendingActionResult, revalidatingFetchers, fetcherResults, workingFetchers);
		if (initialHydration && state.errors) errors = {
			...state.errors,
			...errors
		};
		let didUpdateFetcherRedirects = markFetchRedirectsDone(workingFetchers);
		let didAbortFetchLoads = abortStaleFetchLoads(pendingNavigationLoadId, workingFetchers);
		let shouldUpdateFetchers = didUpdateFetcherRedirects || didAbortFetchLoads || revalidatingFetchers.length > 0;
		return {
			matches,
			loaderData,
			errors,
			...shouldUpdateFetchers ? { workingFetchers } : {}
		};
	}
	function getUpdatedActionData(pendingActionResult) {
		if (pendingActionResult && !isErrorResult(pendingActionResult[1])) return { [pendingActionResult[0]]: pendingActionResult[1].data };
		else if (state.actionData) if (Object.keys(state.actionData).length === 0) return null;
		else return state.actionData;
	}
	function getUpdatedRevalidatingFetchers(revalidatingFetchers) {
		let workingFetchers = new Map(state.fetchers);
		revalidatingFetchers.forEach((rf) => {
			let fetcher = workingFetchers.get(rf.key);
			let revalidatingFetcher = getLoadingFetcher(void 0, fetcher ? fetcher.data : void 0);
			workingFetchers.set(rf.key, revalidatingFetcher);
		});
		return workingFetchers;
	}
	async function fetch(key, routeId, href, opts) {
		abortFetcher(key);
		let flushSync = (opts && opts.flushSync) === true;
		let routesToUse = dataRoutes.activeRoutes;
		let normalizedPath = normalizeTo(state.location, state.matches, basename, href, routeId, opts?.relative);
		let matches = matchRoutesImpl(routesToUse, normalizedPath, basename, false, dataRoutes.branches);
		let fogOfWar = checkFogOfWar(matches, routesToUse, normalizedPath);
		if (fogOfWar.active && fogOfWar.matches) matches = fogOfWar.matches;
		if (!matches) {
			setFetcherError(key, routeId, getInternalRouterError(404, { pathname: normalizedPath }), { flushSync });
			return;
		}
		let { path, submission, error } = normalizeNavigateOptions(true, normalizedPath, opts);
		if (error) {
			setFetcherError(key, routeId, error, { flushSync });
			return;
		}
		let scopedContext = init.getContext ? await init.getContext() : new RouterContextProvider();
		let preventScrollReset = (opts && opts.preventScrollReset) === true;
		if (submission && isMutationMethod(submission.formMethod)) {
			await handleFetcherAction(key, routeId, path, matches, scopedContext, fogOfWar.active, flushSync, preventScrollReset, submission, opts && opts.defaultShouldRevalidate);
			return;
		}
		fetchLoadMatches.set(key, {
			routeId,
			path
		});
		await handleFetcherLoader(key, routeId, path, matches, scopedContext, fogOfWar.active, flushSync, preventScrollReset, submission);
	}
	async function handleFetcherAction(key, routeId, path, requestMatches, scopedContext, isFogOfWar, flushSync, preventScrollReset, submission, callSiteDefaultShouldRevalidate) {
		interruptActiveLoads();
		fetchLoadMatches.delete(key);
		updateFetcherState(key, getSubmittingFetcher(submission, state.fetchers.get(key)), { flushSync });
		let abortController = new AbortController();
		let fetchRequest = createClientSideRequest(init.history, path, abortController.signal, submission);
		if (isFogOfWar) {
			let discoverResult = await discoverRoutes(requestMatches, new URL(fetchRequest.url).pathname, fetchRequest.signal, key);
			if (discoverResult.type === "aborted") return;
			else if (discoverResult.type === "error") {
				setFetcherError(key, routeId, discoverResult.error, { flushSync });
				return;
			} else if (!discoverResult.matches) {
				setFetcherError(key, routeId, getInternalRouterError(404, { pathname: path }), { flushSync });
				return;
			} else requestMatches = discoverResult.matches;
		}
		let match = getTargetMatch(requestMatches, path);
		if (!match.route.action && !match.route.lazy) {
			setFetcherError(key, routeId, getInternalRouterError(405, {
				method: submission.formMethod,
				pathname: path,
				routeId
			}), { flushSync });
			return;
		}
		fetchControllers.set(key, abortController);
		let originatingLoadId = incrementingLoadId;
		let fetchMatches = getTargetedDataStrategyMatches(mapRouteProperties, manifest, fetchRequest, path, requestMatches, match, hydrationRouteProperties, scopedContext);
		let actionResults = await callDataStrategy(fetchRequest, path, fetchMatches, scopedContext, key);
		let actionResult = actionResults[match.route.id];
		if (!actionResult) {
			for (let match of fetchMatches) if (actionResults[match.route.id]) {
				actionResult = actionResults[match.route.id];
				break;
			}
		}
		if (fetchRequest.signal.aborted) {
			if (fetchControllers.get(key) === abortController) fetchControllers.delete(key);
			return;
		}
		if (fetchersQueuedForDeletion.has(key)) {
			if (isRedirectResult(actionResult) || isErrorResult(actionResult)) {
				updateFetcherState(key, getDoneFetcher(void 0));
				return;
			}
		} else {
			if (isRedirectResult(actionResult)) {
				fetchControllers.delete(key);
				if (pendingNavigationLoadId > originatingLoadId) {
					updateFetcherState(key, getDoneFetcher(void 0));
					return;
				} else {
					fetchRedirectIds.add(key);
					updateFetcherState(key, getLoadingFetcher(submission));
					return startRedirectNavigation(fetchRequest, actionResult, false, {
						fetcherSubmission: submission,
						preventScrollReset
					});
				}
			}
			if (isErrorResult(actionResult)) {
				setFetcherError(key, routeId, actionResult.error);
				return;
			}
		}
		let nextLocation = state.navigation.location || state.location;
		let revalidationRequest = createClientSideRequest(init.history, nextLocation, abortController.signal);
		let routesToUse = dataRoutes.activeRoutes;
		let matches = state.navigation.state !== "idle" ? matchRoutesImpl(routesToUse, state.navigation.location, basename, false, dataRoutes.branches) : state.matches;
		invariant(matches, "Didn't find any matches after fetcher action");
		let loadId = ++incrementingLoadId;
		fetchReloadIds.set(key, loadId);
		let { dsMatches, revalidatingFetchers } = getMatchesToLoad(revalidationRequest, scopedContext, mapRouteProperties, manifest, init.history, state, matches, submission, nextLocation, hydrationRouteProperties, false, isRevalidationRequired, cancelledFetcherLoads, fetchersQueuedForDeletion, fetchLoadMatches, fetchRedirectIds, routesToUse, basename, init.patchRoutesOnNavigation != null, dataRoutes.branches, [match.route.id, actionResult], callSiteDefaultShouldRevalidate);
		let loadFetcher = getLoadingFetcher(submission, actionResult.data);
		let workingFetchers = new Map(state.fetchers);
		workingFetchers.set(key, loadFetcher);
		revalidatingFetchers.filter((rf) => rf.key !== key).forEach((rf) => {
			let staleKey = rf.key;
			let existingFetcher = workingFetchers.get(staleKey);
			let revalidatingFetcher = getLoadingFetcher(void 0, existingFetcher ? existingFetcher.data : void 0);
			workingFetchers.set(staleKey, revalidatingFetcher);
			abortFetcher(staleKey);
			if (rf.controller) fetchControllers.set(staleKey, rf.controller);
		});
		updateState({ fetchers: workingFetchers });
		let abortPendingFetchRevalidations = () => revalidatingFetchers.forEach((rf) => abortFetcher(rf.key));
		abortController.signal.addEventListener("abort", abortPendingFetchRevalidations);
		let { loaderResults, fetcherResults } = await callLoadersAndMaybeResolveData(dsMatches, revalidatingFetchers, revalidationRequest, nextLocation, scopedContext);
		if (abortController.signal.aborted) return;
		abortController.signal.removeEventListener("abort", abortPendingFetchRevalidations);
		fetchReloadIds.delete(key);
		fetchControllers.delete(key);
		revalidatingFetchers.forEach((r) => fetchControllers.delete(r.key));
		let fetcherIsMounted = state.fetchers.has(key);
		let getRedirectStateWithDoneFetcher = (s) => {
			if (!fetcherIsMounted) return s;
			let workingFetchers = new Map(s.fetchers);
			workingFetchers.set(key, getDoneFetcher(actionResult.data));
			return {
				...s,
				fetchers: workingFetchers
			};
		};
		let redirect = findRedirect(loaderResults);
		if (redirect) {
			state = getRedirectStateWithDoneFetcher(state);
			return startRedirectNavigation(revalidationRequest, redirect.result, false, { preventScrollReset });
		}
		redirect = findRedirect(fetcherResults);
		if (redirect) {
			fetchRedirectIds.add(redirect.key);
			state = getRedirectStateWithDoneFetcher(state);
			return startRedirectNavigation(revalidationRequest, redirect.result, false, { preventScrollReset });
		}
		let finalFetchers = new Map(state.fetchers);
		if (fetcherIsMounted) finalFetchers.set(key, getDoneFetcher(actionResult.data));
		let { loaderData, errors } = processLoaderData(state, matches, loaderResults, void 0, revalidatingFetchers, fetcherResults, finalFetchers);
		abortStaleFetchLoads(loadId, finalFetchers);
		if (state.navigation.state === "loading" && loadId > pendingNavigationLoadId) {
			invariant(pendingAction, "Expected pending action");
			pendingNavigationController && pendingNavigationController.abort();
			completeNavigation(state.navigation.location, {
				matches,
				loaderData,
				errors,
				fetchers: finalFetchers
			});
		} else {
			updateState({
				errors,
				loaderData: mergeLoaderData(state.loaderData, loaderData, matches, errors),
				fetchers: finalFetchers
			});
			isRevalidationRequired = false;
		}
	}
	async function handleFetcherLoader(key, routeId, path, matches, scopedContext, isFogOfWar, flushSync, preventScrollReset, submission) {
		let existingFetcher = state.fetchers.get(key);
		updateFetcherState(key, getLoadingFetcher(submission, existingFetcher ? existingFetcher.data : void 0), { flushSync });
		let abortController = new AbortController();
		let fetchRequest = createClientSideRequest(init.history, path, abortController.signal);
		if (isFogOfWar) {
			let discoverResult = await discoverRoutes(matches, new URL(fetchRequest.url).pathname, fetchRequest.signal, key);
			if (discoverResult.type === "aborted") return;
			else if (discoverResult.type === "error") {
				setFetcherError(key, routeId, discoverResult.error, { flushSync });
				return;
			} else if (!discoverResult.matches) {
				setFetcherError(key, routeId, getInternalRouterError(404, { pathname: path }), { flushSync });
				return;
			} else matches = discoverResult.matches;
		}
		let match = getTargetMatch(matches, path);
		fetchControllers.set(key, abortController);
		let originatingLoadId = incrementingLoadId;
		let results = await callDataStrategy(fetchRequest, path, getTargetedDataStrategyMatches(mapRouteProperties, manifest, fetchRequest, path, matches, match, hydrationRouteProperties, scopedContext), scopedContext, key);
		let result = results[match.route.id];
		if (!result) {
			for (let match of matches) if (results[match.route.id]) {
				result = results[match.route.id];
				break;
			}
		}
		if (fetchControllers.get(key) === abortController) fetchControllers.delete(key);
		if (fetchRequest.signal.aborted) return;
		if (fetchersQueuedForDeletion.has(key)) {
			updateFetcherState(key, getDoneFetcher(void 0));
			return;
		}
		if (isRedirectResult(result)) if (pendingNavigationLoadId > originatingLoadId) {
			updateFetcherState(key, getDoneFetcher(void 0));
			return;
		} else {
			fetchRedirectIds.add(key);
			await startRedirectNavigation(fetchRequest, result, false, { preventScrollReset });
			return;
		}
		if (isErrorResult(result)) {
			setFetcherError(key, routeId, result.error);
			return;
		}
		updateFetcherState(key, getDoneFetcher(result.data));
	}
	/**
	* Utility function to handle redirects returned from an action or loader.
	* Normally, a redirect "replaces" the navigation that triggered it.  So, for
	* example:
	*
	*  - user is on /a
	*  - user clicks a link to /b
	*  - loader for /b redirects to /c
	*
	* In a non-JS app the browser would track the in-flight navigation to /b and
	* then replace it with /c when it encountered the redirect response.  In
	* the end it would only ever update the URL bar with /c.
	*
	* In client-side routing using pushState/replaceState, we aim to emulate
	* this behavior and we also do not update history until the end of the
	* navigation (including processed redirects).  This means that we never
	* actually touch history until we've processed redirects, so we just use
	* the history action from the original navigation (PUSH or REPLACE).
	*/
	async function startRedirectNavigation(request, redirect, isNavigation, { submission, fetcherSubmission, preventScrollReset, replace } = {}) {
		if (!isNavigation) {
			pendingPopstateNavigationDfd?.resolve();
			pendingPopstateNavigationDfd = null;
		}
		if (redirect.response.headers.has("X-Remix-Revalidate")) isRevalidationRequired = true;
		let location = redirect.response.headers.get("Location");
		invariant(location, "Expected a Location header on the redirect Response");
		location = normalizeRedirectLocation(location, new URL(request.url), basename, init.history);
		let redirectLocation = createLocation(state.location, location, { _isRedirect: true });
		if (isBrowser) {
			let isDocumentReload = false;
			if (redirect.response.headers.has("X-Remix-Reload-Document")) isDocumentReload = true;
			else if (isAbsoluteUrl(location)) {
				const url = createBrowserURLImpl(routerWindow, location, true);
				isDocumentReload = url.origin !== routerWindow.location.origin || stripBasename(url.pathname, basename) == null;
			}
			if (isDocumentReload) {
				if (replace) routerWindow.location.replace(location);
				else routerWindow.location.assign(location);
				return;
			}
		}
		pendingNavigationController = null;
		let redirectNavigationType = replace === true || redirect.response.headers.has("X-Remix-Replace") ? "REPLACE" : "PUSH";
		let { formMethod, formAction, formEncType } = state.navigation;
		if (!submission && !fetcherSubmission && formMethod && formAction && formEncType) submission = getSubmissionFromNavigation(state.navigation);
		let activeSubmission = submission || fetcherSubmission;
		if (redirectPreserveMethodStatusCodes.has(redirect.response.status) && activeSubmission && isMutationMethod(activeSubmission.formMethod)) await startNavigation(redirectNavigationType, redirectLocation, {
			submission: {
				...activeSubmission,
				formAction: location
			},
			preventScrollReset: preventScrollReset || pendingPreventScrollReset,
			enableViewTransition: isNavigation ? pendingViewTransitionEnabled : void 0
		});
		else await startNavigation(redirectNavigationType, redirectLocation, {
			overrideNavigation: getLoadingNavigation(redirectLocation, [], redirectNavigationType, submission),
			fetcherSubmission,
			preventScrollReset: preventScrollReset || pendingPreventScrollReset,
			enableViewTransition: isNavigation ? pendingViewTransitionEnabled : void 0
		});
	}
	async function callDataStrategy(request, path, matches, scopedContext, fetcherKey) {
		let results;
		let dataResults = {};
		try {
			results = await callDataStrategyImpl(dataStrategyImpl, request, path, matches, fetcherKey, scopedContext, false);
		} catch (e) {
			matches.filter((m) => m.shouldLoad).forEach((m) => {
				dataResults[m.route.id] = {
					type: "error",
					error: e
				};
			});
			return dataResults;
		}
		if (request.signal.aborted) return dataResults;
		if (!isMutationMethod(request.method)) for (let match of matches) {
			if (results[match.route.id]?.type === "error") break;
			if (!results.hasOwnProperty(match.route.id) && !state.loaderData.hasOwnProperty(match.route.id) && (!state.errors || !state.errors.hasOwnProperty(match.route.id)) && match.shouldCallHandler()) results[match.route.id] = {
				type: "error",
				result: /* @__PURE__ */ new Error(`No result returned from dataStrategy for route ${match.route.id}`)
			};
		}
		for (let [routeId, result] of Object.entries(results)) if (isRedirectDataStrategyResult(result)) {
			let response = result.result;
			dataResults[routeId] = {
				type: "redirect",
				response: normalizeRelativeRoutingRedirectResponse(response, request, routeId, matches, basename)
			};
		} else dataResults[routeId] = await convertDataStrategyResultToDataResult(result);
		return dataResults;
	}
	async function callLoadersAndMaybeResolveData(matches, fetchersToLoad, request, location, scopedContext) {
		let loaderResultsPromise = callDataStrategy(request, location, matches, scopedContext, null);
		let fetcherResultsPromise = Promise.all(fetchersToLoad.map(async (f) => {
			if (f.matches && f.match && f.request && f.controller) {
				let result = (await callDataStrategy(f.request, f.path, f.matches, scopedContext, f.key))[f.match.route.id];
				return { [f.key]: result };
			} else return Promise.resolve({ [f.key]: {
				type: "error",
				error: getInternalRouterError(404, { pathname: f.path })
			} });
		}));
		return {
			loaderResults: await loaderResultsPromise,
			fetcherResults: (await fetcherResultsPromise).reduce((acc, r) => Object.assign(acc, r), {})
		};
	}
	function interruptActiveLoads() {
		isRevalidationRequired = true;
		fetchLoadMatches.forEach((_, key) => {
			if (fetchControllers.has(key)) cancelledFetcherLoads.add(key);
			abortFetcher(key);
		});
	}
	function updateFetcherState(key, fetcher, opts = {}) {
		let workingFetchers = new Map(state.fetchers);
		workingFetchers.set(key, fetcher);
		updateState({ fetchers: workingFetchers }, { flushSync: (opts && opts.flushSync) === true });
	}
	function setFetcherError(key, routeId, error, opts = {}) {
		let boundaryMatch = findNearestBoundary(state.matches, routeId);
		let workingFetchers = new Map(state.fetchers);
		deleteFetcher(workingFetchers, key);
		updateState({
			errors: { [boundaryMatch.route.id]: error },
			fetchers: workingFetchers
		}, { flushSync: (opts && opts.flushSync) === true });
	}
	function getFetcher(key) {
		activeFetchers.set(key, (activeFetchers.get(key) || 0) + 1);
		if (fetchersQueuedForDeletion.has(key)) fetchersQueuedForDeletion.delete(key);
		return state.fetchers.get(key) || IDLE_FETCHER;
	}
	function resetFetcher(key, opts) {
		abortFetcher(key, opts?.reason);
		updateFetcherState(key, getDoneFetcher(null));
	}
	function deleteFetcher(fetchers, key) {
		let fetcher = state.fetchers.get(key);
		if (fetchControllers.has(key) && !(fetcher && fetcher.state === "loading" && fetchReloadIds.has(key))) abortFetcher(key);
		fetchLoadMatches.delete(key);
		fetchReloadIds.delete(key);
		fetchRedirectIds.delete(key);
		fetchersQueuedForDeletion.delete(key);
		cancelledFetcherLoads.delete(key);
		fetchers.delete(key);
	}
	function queueFetcherForDeletion(key) {
		let count = (activeFetchers.get(key) || 0) - 1;
		if (count <= 0) {
			activeFetchers.delete(key);
			fetchersQueuedForDeletion.add(key);
		} else activeFetchers.set(key, count);
		updateState({ fetchers: new Map(state.fetchers) });
	}
	function abortFetcher(key, reason) {
		let controller = fetchControllers.get(key);
		if (controller) {
			controller.abort(reason);
			fetchControllers.delete(key);
		}
	}
	function markFetchersDone(keys, fetchers) {
		for (let key of keys) {
			let fetcher = fetchers.get(key);
			invariant(fetcher, `Expected fetcher: ${key}`);
			let doneFetcher = getDoneFetcher(fetcher.data);
			fetchers.set(key, doneFetcher);
		}
	}
	function markFetchRedirectsDone(fetchers) {
		let doneKeys = [];
		let didUpdateFetchers = false;
		for (let key of fetchRedirectIds) {
			let fetcher = fetchers.get(key);
			invariant(fetcher, `Expected fetcher: ${key}`);
			if (fetcher.state === "loading") {
				fetchRedirectIds.delete(key);
				doneKeys.push(key);
				didUpdateFetchers = true;
			}
		}
		markFetchersDone(doneKeys, fetchers);
		return didUpdateFetchers;
	}
	function abortStaleFetchLoads(landedId, fetchers) {
		let yeetedKeys = [];
		for (let [key, id] of fetchReloadIds) if (id < landedId) {
			let fetcher = fetchers.get(key);
			invariant(fetcher, `Expected fetcher: ${key}`);
			if (fetcher.state === "loading") {
				abortFetcher(key);
				fetchReloadIds.delete(key);
				yeetedKeys.push(key);
			}
		}
		markFetchersDone(yeetedKeys, fetchers);
		return yeetedKeys.length > 0;
	}
	function getBlocker(key, fn) {
		let blocker = state.blockers.get(key) || IDLE_BLOCKER;
		if (blockerFunctions.get(key) !== fn) blockerFunctions.set(key, fn);
		return blocker;
	}
	function deleteBlocker(key) {
		state.blockers.delete(key);
		blockerFunctions.delete(key);
	}
	function updateBlocker(key, newBlocker) {
		let blocker = state.blockers.get(key) || IDLE_BLOCKER;
		invariant(blocker.state === "unblocked" && newBlocker.state === "blocked" || blocker.state === "blocked" && newBlocker.state === "blocked" || blocker.state === "blocked" && newBlocker.state === "proceeding" || blocker.state === "blocked" && newBlocker.state === "unblocked" || blocker.state === "proceeding" && newBlocker.state === "unblocked", `Invalid blocker state transition: ${blocker.state} -> ${newBlocker.state}`);
		let blockers = new Map(state.blockers);
		blockers.set(key, newBlocker);
		updateState({ blockers });
	}
	function shouldBlockNavigation({ currentLocation, nextLocation, historyAction }) {
		if (blockerFunctions.size === 0) return;
		if (blockerFunctions.size > 1) warning(false, "A router only supports one blocker at a time");
		let entries = Array.from(blockerFunctions.entries());
		let [blockerKey, blockerFunction] = entries[entries.length - 1];
		let blocker = state.blockers.get(blockerKey);
		if (blocker && blocker.state === "proceeding") return;
		if (blockerFunction({
			currentLocation,
			nextLocation,
			historyAction
		})) return blockerKey;
	}
	function handleNavigational404(pathname) {
		let error = getInternalRouterError(404, { pathname });
		let routesToUse = dataRoutes.activeRoutes;
		let { matches, route } = getShortCircuitMatches(routesToUse);
		return {
			notFoundMatches: matches,
			route,
			error
		};
	}
	function enableScrollRestoration(positions, getPosition, getKey) {
		savedScrollPositions = positions;
		getScrollPosition = getPosition;
		getScrollRestorationKey = getKey || null;
		if (!initialScrollRestored && state.navigation === IDLE_NAVIGATION) {
			initialScrollRestored = true;
			let y = getSavedScrollPosition(state.location, state.matches);
			if (y != null) updateState({ restoreScrollPosition: y });
		}
		return () => {
			savedScrollPositions = null;
			getScrollPosition = null;
			getScrollRestorationKey = null;
		};
	}
	function getScrollKey(location, matches) {
		if (getScrollRestorationKey) return getScrollRestorationKey(location, matches.map((m) => convertRouteMatchToUiMatch(m, state.loaderData))) || location.key;
		return location.key;
	}
	function saveScrollPosition(location, matches) {
		if (savedScrollPositions && getScrollPosition) {
			let key = getScrollKey(location, matches);
			savedScrollPositions[key] = getScrollPosition();
		}
	}
	function getSavedScrollPosition(location, matches) {
		if (savedScrollPositions) {
			let key = getScrollKey(location, matches);
			let y = savedScrollPositions[key];
			if (typeof y === "number") return y;
		}
		return null;
	}
	function checkFogOfWar(matches, routesToUse, pathname) {
		if (init.patchRoutesOnNavigation) {
			let activeBranches = dataRoutes.branches;
			if (!matches) return {
				active: true,
				matches: matchRoutesImpl(routesToUse, pathname, basename, true, activeBranches) || []
			};
			else if (Object.keys(matches[0].params).length > 0) return {
				active: true,
				matches: matchRoutesImpl(routesToUse, pathname, basename, true, activeBranches)
			};
		}
		return {
			active: false,
			matches: null
		};
	}
	async function discoverRoutes(matches, pathname, signal, fetcherKey) {
		if (!init.patchRoutesOnNavigation) return {
			type: "success",
			matches
		};
		let partialMatches = matches;
		while (true) {
			let localManifest = manifest;
			try {
				await init.patchRoutesOnNavigation({
					signal,
					path: pathname,
					matches: partialMatches,
					fetcherKey,
					patch: (routeId, children) => {
						if (signal.aborted) return;
						patchRoutesImpl(routeId, children, dataRoutes, localManifest, mapRouteProperties, false);
					}
				});
			} catch (e) {
				return {
					type: "error",
					error: e,
					partialMatches
				};
			}
			if (signal.aborted) return { type: "aborted" };
			let activeBranches = dataRoutes.branches;
			let newMatches = matchRoutesImpl(dataRoutes.activeRoutes, pathname, basename, false, activeBranches);
			let newPartialMatches = null;
			if (newMatches) if (Object.keys(newMatches[0].params).length === 0) return {
				type: "success",
				matches: newMatches
			};
			else {
				newPartialMatches = matchRoutesImpl(dataRoutes.activeRoutes, pathname, basename, true, activeBranches);
				if (!(newPartialMatches && partialMatches.length < newPartialMatches.length && compareMatches(partialMatches, newPartialMatches.slice(0, partialMatches.length)))) return {
					type: "success",
					matches: newMatches
				};
			}
			if (!newPartialMatches) newPartialMatches = matchRoutesImpl(dataRoutes.activeRoutes, pathname, basename, true, activeBranches);
			if (!newPartialMatches || compareMatches(partialMatches, newPartialMatches)) return {
				type: "success",
				matches: null
			};
			partialMatches = newPartialMatches;
		}
	}
	function compareMatches(a, b) {
		return a.length === b.length && a.every((m, i) => m.route.id === b[i].route.id);
	}
	function _internalSetRoutes(newRoutes) {
		manifest = {};
		dataRoutes.setHmrRoutes(convertRoutesToDataRoutes(newRoutes, mapRouteProperties, void 0, manifest));
	}
	function patchRoutes(routeId, children, unstable_allowElementMutations = false) {
		patchRoutesImpl(routeId, children, dataRoutes, manifest, mapRouteProperties, unstable_allowElementMutations);
		if (!dataRoutes.hasHMRRoutes) updateState({});
	}
	router = {
		get basename() {
			return basename;
		},
		get future() {
			return future;
		},
		get state() {
			return state;
		},
		get routes() {
			return dataRoutes.stableRoutes;
		},
		get branches() {
			return dataRoutes.branches;
		},
		get manifest() {
			return manifest;
		},
		get window() {
			return routerWindow;
		},
		initialize,
		subscribe,
		enableScrollRestoration,
		navigate,
		fetch,
		revalidate,
		createHref: (to) => init.history.createHref(to),
		encodeLocation: (to) => init.history.encodeLocation(to),
		getFetcher,
		resetFetcher,
		deleteFetcher: queueFetcherForDeletion,
		dispose,
		getBlocker,
		deleteBlocker,
		patchRoutes,
		_internalFetchControllers: fetchControllers,
		_internalSetRoutes,
		_internalSetStateDoNotUseOrYouWillBreakYourApp(newState) {
			updateState(newState);
		}
	};
	if (init.instrumentations) router = instrumentClientSideRouter(router, init.instrumentations.map((i) => i.router).filter(Boolean));
	return router;
}
/**
* Create a static handler to perform server-side data loading
*
* @example
* export async function handleRequest(request: Request) {
*   let { query, dataRoutes } = createStaticHandler(routes);
*   let context = await query(request);
*
*   if (context instanceof Response) {
*     return context;
*   }
*
*   let router = createStaticRouter(dataRoutes, context);
*   return new Response(
*     ReactDOMServer.renderToString(<StaticRouterProvider ... />),
*     { headers: { "Content-Type": "text/html" } }
*   );
* }
*
* @public
* @category Data Routers
* @mode data
* @param routes The {@link RouteObject | route objects} to create a static
* handler for
* @param opts Options
* @param opts.basename The base URL for the static handler (default: `/`)
* @param opts.future Future flags for the static handler
* @returns A static handler that can be used to query data for the provided
* routes
*/
function createStaticHandler(routes, opts) {
	invariant(routes.length > 0, "You must provide a non-empty routes array to createStaticHandler");
	let manifest = {};
	let basename = (opts ? opts.basename : null) || "/";
	let _mapRouteProperties = opts?.mapRouteProperties;
	let mapRouteProperties = _mapRouteProperties ? _mapRouteProperties : () => ({});
	({ ...opts?.future });
	if (opts?.instrumentations) {
		let instrumentations = opts.instrumentations;
		mapRouteProperties = (route) => {
			return {
				..._mapRouteProperties?.(route),
				...getRouteInstrumentationUpdates(instrumentations.map((i) => i.route).filter(Boolean), route)
			};
		};
	}
	let dataRoutes = convertRoutesToDataRoutes(routes, mapRouteProperties, void 0, manifest);
	let routeBranches = flattenAndRankRoutes(dataRoutes);
	/**
	* The query() method is intended for document requests, in which we want to
	* call an optional action and potentially multiple loaders for all nested
	* routes.  It returns a StaticHandlerContext object, which is very similar
	* to the router state (location, loaderData, actionData, errors, etc.) and
	* also adds SSR-specific information such as the statusCode and headers
	* from action/loaders Responses.
	*
	* It _should_ never throw and should report all errors through the
	* returned handlerContext.errors object, properly associating errors to
	* their error boundary.  Additionally, it tracks _deepestRenderedBoundaryId
	* which can be used to emulate React error boundaries during SSR by performing
	* a second pass only down to the boundaryId.
	*
	* The one exception where we do not return a StaticHandlerContext is when a
	* redirect response is returned or thrown from any action/loader.  We
	* propagate that out and return the raw Response so the HTTP server can
	* return it directly.
	*
	* - `opts.requestContext` is an optional server context that will be passed
	*   to actions/loaders in the `context` parameter
	* - `opts.skipLoaderErrorBubbling` is an optional parameter that will prevent
	*   the bubbling of errors which allows single-fetch-type implementations
	*   where the client will handle the bubbling and we may need to return data
	*   for the handling route
	*/
	async function query(request, { requestContext, filterMatchesToLoad, skipLoaderErrorBubbling, skipRevalidation, dataStrategy, generateMiddlewareResponse, normalizePath } = {}) {
		let normalizePathImpl = normalizePath || defaultNormalizePath;
		let method = request.method;
		let location = createLocation("", normalizePathImpl(request), null, "default");
		let matches = matchRoutesImpl(dataRoutes, location, basename, false, routeBranches);
		requestContext = requestContext != null ? requestContext : new RouterContextProvider();
		if (!isValidMethod(method) && method !== "HEAD") {
			let error = getInternalRouterError(405, { method });
			let { matches: methodNotAllowedMatches, route } = getShortCircuitMatches(dataRoutes);
			let staticContext = {
				basename,
				location,
				matches: methodNotAllowedMatches,
				loaderData: {},
				actionData: null,
				errors: { [route.id]: error },
				statusCode: error.status,
				loaderHeaders: {},
				actionHeaders: {}
			};
			return generateMiddlewareResponse ? generateMiddlewareResponse(() => Promise.resolve(staticContext)) : staticContext;
		} else if (!matches) {
			let error = getInternalRouterError(404, { pathname: location.pathname });
			let { matches: notFoundMatches, route } = getShortCircuitMatches(dataRoutes);
			let staticContext = {
				basename,
				location,
				matches: notFoundMatches,
				loaderData: {},
				actionData: null,
				errors: { [route.id]: error },
				statusCode: error.status,
				loaderHeaders: {},
				actionHeaders: {}
			};
			return generateMiddlewareResponse ? generateMiddlewareResponse(() => Promise.resolve(staticContext)) : staticContext;
		}
		if (generateMiddlewareResponse) {
			invariant(requestContext instanceof RouterContextProvider, "When using middleware in `staticHandler.query()`, any provided `requestContext` must be an instance of `RouterContextProvider`");
			try {
				await loadLazyMiddlewareForMatches(matches, manifest, mapRouteProperties);
				let renderedStaticContext;
				let response = await runServerMiddlewarePipeline({
					request,
					url: createDataFunctionUrl(request, location),
					pattern: getRoutePattern(matches),
					matches,
					params: matches[0].params,
					context: requestContext
				}, async () => {
					return await generateMiddlewareResponse(async (revalidationRequest, opts = {}) => {
						let result = await queryImpl(revalidationRequest, location, matches, requestContext, dataStrategy || null, skipLoaderErrorBubbling === true, null, "filterMatchesToLoad" in opts ? opts.filterMatchesToLoad ?? null : filterMatchesToLoad ?? null, skipRevalidation === true);
						if (isResponse(result)) return result;
						renderedStaticContext = {
							location,
							basename,
							...result
						};
						return renderedStaticContext;
					});
				}, async (error, routeId) => {
					if (isRedirectResponse(error)) return error;
					if (isResponse(error)) try {
						error = new ErrorResponseImpl(error.status, error.statusText, await parseResponseBody(error));
					} catch (e) {
						error = e;
					}
					if (isDataWithResponseInit(error)) error = dataWithResponseInitToErrorResponse(error);
					if (renderedStaticContext) {
						if (routeId in renderedStaticContext.loaderData) renderedStaticContext.loaderData[routeId] = void 0;
						let staticContext = getStaticContextFromError(dataRoutes, renderedStaticContext, error, skipLoaderErrorBubbling ? routeId : findNearestBoundary(matches, routeId).route.id);
						return generateMiddlewareResponse(() => Promise.resolve(staticContext));
					} else {
						let staticContext = {
							matches,
							location,
							basename,
							loaderData: {},
							actionData: null,
							errors: { [skipLoaderErrorBubbling ? routeId : findNearestBoundary(matches, matches.find((m) => m.route.id === routeId || m.route.loader)?.route.id || routeId).route.id]: error },
							statusCode: isRouteErrorResponse(error) ? error.status : 500,
							actionHeaders: {},
							loaderHeaders: {}
						};
						return generateMiddlewareResponse(() => Promise.resolve(staticContext));
					}
				});
				invariant(isResponse(response), "Expected a response in query()");
				return response;
			} catch (e) {
				if (isResponse(e)) return e;
				throw e;
			}
		}
		let result = await queryImpl(request, location, matches, requestContext, dataStrategy || null, skipLoaderErrorBubbling === true, null, filterMatchesToLoad || null, skipRevalidation === true);
		if (isResponse(result)) return result;
		return {
			location,
			basename,
			...result
		};
	}
	/**
	* The queryRoute() method is intended for targeted route requests, either
	* for fetch ?_data requests or resource route requests.  In this case, we
	* are only ever calling a single action or loader, and we are returning the
	* returned value directly.  In most cases, this will be a Response returned
	* from the action/loader, but it may be a primitive or other value as well -
	* and in such cases the calling context should handle that accordingly.
	*
	* We do respect the throw/return differentiation, so if an action/loader
	* throws, then this method will throw the value.  This is important so we
	* can do proper boundary identification in Remix where a thrown Response
	* must go to the Catch Boundary but a returned Response is happy-path.
	*
	* One thing to note is that any Router-initiated Errors that make sense
	* to associate with a status code will be thrown as an ErrorResponse
	* instance which include the raw Error, such that the calling context can
	* serialize the error as they see fit while including the proper response
	* code.  Examples here are 404 and 405 errors that occur prior to reaching
	* any user-defined loaders.
	*
	* - `opts.routeId` allows you to specify the specific route handler to call.
	*   If not provided the handler will determine the proper route by matching
	*   against `request.url`
	* - `opts.requestContext` is an optional server context that will be passed
	*    to actions/loaders in the `context` parameter
	*/
	async function queryRoute(request, { routeId, requestContext, dataStrategy, generateMiddlewareResponse, normalizePath } = {}) {
		let normalizePathImpl = normalizePath || defaultNormalizePath;
		let method = request.method;
		let location = createLocation("", normalizePathImpl(request), null, "default");
		let matches = matchRoutesImpl(dataRoutes, location, basename, false, routeBranches);
		requestContext = requestContext != null ? requestContext : new RouterContextProvider();
		if (!isValidMethod(method) && method !== "HEAD" && method !== "OPTIONS") throw getInternalRouterError(405, { method });
		else if (!matches) throw getInternalRouterError(404, { pathname: location.pathname });
		let match = routeId ? matches.find((m) => m.route.id === routeId) : getTargetMatch(matches, location);
		if (routeId && !match) throw getInternalRouterError(403, {
			pathname: location.pathname,
			routeId
		});
		else if (!match) throw getInternalRouterError(404, { pathname: location.pathname });
		if (generateMiddlewareResponse) {
			invariant(requestContext instanceof RouterContextProvider, "When using middleware in `staticHandler.queryRoute()`, any provided `requestContext` must be an instance of `RouterContextProvider`");
			await loadLazyMiddlewareForMatches(matches, manifest, mapRouteProperties);
			return await runServerMiddlewarePipeline({
				request,
				url: createDataFunctionUrl(request, location),
				pattern: getRoutePattern(matches),
				matches,
				params: matches[0].params,
				context: requestContext
			}, async () => {
				return await generateMiddlewareResponse(async (innerRequest) => {
					let processed = handleQueryResult(await queryImpl(innerRequest, location, matches, requestContext, dataStrategy || null, false, match, null, false));
					return isResponse(processed) ? processed : typeof processed === "string" ? new Response(processed) : Response.json(processed);
				});
			}, (error) => {
				if (isDataWithResponseInit(error)) return Promise.resolve(dataWithResponseInitToResponse(error));
				if (isResponse(error)) return Promise.resolve(error);
				throw error;
			});
		}
		return handleQueryResult(await queryImpl(request, location, matches, requestContext, dataStrategy || null, false, match, null, false));
		function handleQueryResult(result) {
			if (isResponse(result)) return result;
			let error = result.errors ? Object.values(result.errors)[0] : void 0;
			if (error !== void 0) throw error;
			if (result.actionData) return Object.values(result.actionData)[0];
			if (result.loaderData) return Object.values(result.loaderData)[0];
		}
	}
	async function queryImpl(request, location, matches, requestContext, dataStrategy, skipLoaderErrorBubbling, routeMatch, filterMatchesToLoad, skipRevalidation) {
		invariant(request.signal, "query()/queryRoute() requests must contain an AbortController signal");
		try {
			if (isMutationMethod(request.method)) return await submit(request, location, matches, routeMatch || getTargetMatch(matches, location), requestContext, dataStrategy, skipLoaderErrorBubbling, routeMatch != null, filterMatchesToLoad, skipRevalidation);
			let result = await loadRouteData(request, location, matches, requestContext, dataStrategy, skipLoaderErrorBubbling, routeMatch, filterMatchesToLoad);
			return isResponse(result) ? result : {
				...result,
				actionData: null,
				actionHeaders: {}
			};
		} catch (e) {
			if (isDataStrategyResult(e) && isResponse(e.result)) {
				if (e.type === "error") throw e.result;
				return e.result;
			}
			if (isRedirectResponse(e)) return e;
			throw e;
		}
	}
	async function submit(request, location, matches, actionMatch, requestContext, dataStrategy, skipLoaderErrorBubbling, isRouteRequest, filterMatchesToLoad, skipRevalidation) {
		let result;
		if (!actionMatch.route.action && !actionMatch.route.lazy) {
			let error = getInternalRouterError(405, {
				method: request.method,
				pathname: new URL(request.url).pathname,
				routeId: actionMatch.route.id
			});
			if (isRouteRequest) throw error;
			result = {
				type: "error",
				error
			};
		} else {
			result = (await callDataStrategy(request, location, getTargetedDataStrategyMatches(mapRouteProperties, manifest, request, location, matches, actionMatch, [], requestContext), isRouteRequest, requestContext, dataStrategy))[actionMatch.route.id];
			if (request.signal.aborted) throwStaticHandlerAbortedError(request, isRouteRequest);
		}
		if (isRedirectResult(result)) throw new Response(null, {
			status: result.response.status,
			headers: { Location: result.response.headers.get("Location") }
		});
		if (isRouteRequest) {
			if (isErrorResult(result)) throw result.error;
			return {
				matches: [actionMatch],
				loaderData: {},
				actionData: { [actionMatch.route.id]: result.data },
				errors: null,
				statusCode: 200,
				loaderHeaders: {},
				actionHeaders: {}
			};
		}
		if (skipRevalidation) if (isErrorResult(result)) {
			let boundaryMatch = skipLoaderErrorBubbling ? actionMatch : findNearestBoundary(matches, actionMatch.route.id);
			return {
				statusCode: isRouteErrorResponse(result.error) ? result.error.status : result.statusCode != null ? result.statusCode : 500,
				actionData: null,
				actionHeaders: { ...result.headers ? { [actionMatch.route.id]: result.headers } : {} },
				matches,
				loaderData: {},
				errors: { [boundaryMatch.route.id]: result.error },
				loaderHeaders: {}
			};
		} else return {
			actionData: { [actionMatch.route.id]: result.data },
			actionHeaders: result.headers ? { [actionMatch.route.id]: result.headers } : {},
			matches,
			loaderData: {},
			errors: null,
			statusCode: result.statusCode || 200,
			loaderHeaders: {}
		};
		let loaderRequest = new Request(request.url, {
			headers: request.headers,
			redirect: request.redirect,
			signal: request.signal
		});
		if (isErrorResult(result)) return {
			...await loadRouteData(loaderRequest, location, matches, requestContext, dataStrategy, skipLoaderErrorBubbling, null, filterMatchesToLoad, [(skipLoaderErrorBubbling ? actionMatch : findNearestBoundary(matches, actionMatch.route.id)).route.id, result]),
			statusCode: isRouteErrorResponse(result.error) ? result.error.status : result.statusCode != null ? result.statusCode : 500,
			actionData: null,
			actionHeaders: { ...result.headers ? { [actionMatch.route.id]: result.headers } : {} }
		};
		return {
			...await loadRouteData(loaderRequest, location, matches, requestContext, dataStrategy, skipLoaderErrorBubbling, null, filterMatchesToLoad),
			actionData: { [actionMatch.route.id]: result.data },
			...result.statusCode ? { statusCode: result.statusCode } : {},
			actionHeaders: result.headers ? { [actionMatch.route.id]: result.headers } : {}
		};
	}
	async function loadRouteData(request, location, matches, requestContext, dataStrategy, skipLoaderErrorBubbling, routeMatch, filterMatchesToLoad, pendingActionResult) {
		let isRouteRequest = routeMatch != null;
		if (isRouteRequest && !routeMatch?.route.loader && !routeMatch?.route.lazy) throw getInternalRouterError(400, {
			method: request.method,
			pathname: new URL(request.url).pathname,
			routeId: routeMatch?.route.id
		});
		let dsMatches;
		if (routeMatch) dsMatches = getTargetedDataStrategyMatches(mapRouteProperties, manifest, request, location, matches, routeMatch, [], requestContext);
		else {
			let maxIdx = pendingActionResult && isErrorResult(pendingActionResult[1]) ? matches.findIndex((m) => m.route.id === pendingActionResult[0]) - 1 : void 0;
			let pattern = getRoutePattern(matches);
			dsMatches = matches.map((match, index) => {
				if (maxIdx != null && index > maxIdx) return getDataStrategyMatch(mapRouteProperties, manifest, request, location, pattern, match, [], requestContext, false);
				return getDataStrategyMatch(mapRouteProperties, manifest, request, location, pattern, match, [], requestContext, (match.route.loader || match.route.lazy) != null && (!filterMatchesToLoad || filterMatchesToLoad(match)));
			});
		}
		if (!dataStrategy && !dsMatches.some((m) => m.shouldLoad)) return {
			matches,
			loaderData: {},
			errors: pendingActionResult && isErrorResult(pendingActionResult[1]) ? { [pendingActionResult[0]]: pendingActionResult[1].error } : null,
			statusCode: 200,
			loaderHeaders: {}
		};
		let results = await callDataStrategy(request, location, dsMatches, isRouteRequest, requestContext, dataStrategy);
		if (request.signal.aborted) throwStaticHandlerAbortedError(request, isRouteRequest);
		return {
			...processRouteLoaderData(matches, results, pendingActionResult, true, skipLoaderErrorBubbling),
			matches
		};
	}
	async function callDataStrategy(request, location, matches, isRouteRequest, requestContext, dataStrategy) {
		let results = await callDataStrategyImpl(dataStrategy || defaultDataStrategy, request, location, matches, null, requestContext, true);
		let dataResults = {};
		await Promise.all(matches.map(async (match) => {
			if (!(match.route.id in results)) return;
			let result = results[match.route.id];
			if (isRedirectDataStrategyResult(result)) {
				let response = result.result;
				throw normalizeRelativeRoutingRedirectResponse(response, request, match.route.id, matches, basename);
			}
			if (isRouteRequest) {
				if (isResponse(result.result)) throw result;
				else if (isDataWithResponseInit(result.result)) throw dataWithResponseInitToResponse(result.result);
			}
			dataResults[match.route.id] = await convertDataStrategyResultToDataResult(result);
		}));
		return dataResults;
	}
	return {
		dataRoutes,
		_internalRouteBranches: routeBranches,
		query,
		queryRoute
	};
}
/**
* Given an existing StaticHandlerContext and an error thrown at render time,
* provide an updated StaticHandlerContext suitable for a second SSR render
*
* @category Utils
*/
function getStaticContextFromError(routes, handlerContext, error, boundaryId) {
	let errorBoundaryId = boundaryId || handlerContext._deepestRenderedBoundaryId || routes[0].id;
	return {
		...handlerContext,
		statusCode: isRouteErrorResponse(error) ? error.status : 500,
		errors: { [errorBoundaryId]: error }
	};
}
function throwStaticHandlerAbortedError(request, isRouteRequest) {
	if (request.signal.reason !== void 0) throw request.signal.reason;
	throw new Error(`${isRouteRequest ? "queryRoute" : "query"}() call aborted without an \`AbortSignal.reason\`: ${request.method} ${request.url}`);
}
function isSubmissionNavigation(opts) {
	return opts != null && ("formData" in opts && opts.formData != null || "body" in opts && opts.body !== void 0);
}
function defaultNormalizePath(request) {
	let url = new URL(request.url);
	return {
		pathname: url.pathname,
		search: url.search,
		hash: url.hash
	};
}
function normalizeTo(location, matches, basename, to, fromRouteId, relative) {
	let contextualMatches;
	let activeRouteMatch;
	if (fromRouteId) {
		contextualMatches = [];
		for (let match of matches) {
			contextualMatches.push(match);
			if (match.route.id === fromRouteId) {
				activeRouteMatch = match;
				break;
			}
		}
	} else {
		contextualMatches = matches;
		activeRouteMatch = matches[matches.length - 1];
	}
	let path = resolveTo(to ? to : ".", getResolveToMatches(contextualMatches), stripBasename(location.pathname, basename) || location.pathname, relative === "path");
	if (to == null) {
		path.search = location.search;
		path.hash = location.hash;
	}
	if ((to == null || to === "" || to === ".") && activeRouteMatch) {
		let nakedIndex = hasNakedIndexQuery(path.search);
		if (activeRouteMatch.route.index && !nakedIndex) path.search = path.search ? path.search.replace(/^\?/, "?index&") : "?index";
		else if (!activeRouteMatch.route.index && nakedIndex) {
			let params = new URLSearchParams(path.search);
			let indexValues = params.getAll("index");
			params.delete("index");
			indexValues.filter((v) => v).forEach((v) => params.append("index", v));
			let qs = params.toString();
			path.search = qs ? `?${qs}` : "";
		}
	}
	if (basename !== "/") path.pathname = prependBasename({
		basename,
		pathname: path.pathname
	});
	return createPath(path);
}
function normalizeNavigateOptions(isFetcher, path, opts) {
	if (!opts || !isSubmissionNavigation(opts)) return { path };
	if (opts.formMethod && !isValidMethod(opts.formMethod)) return {
		path,
		error: getInternalRouterError(405, { method: opts.formMethod })
	};
	let getInvalidBodyError = () => ({
		path,
		error: getInternalRouterError(400, { type: "invalid-body" })
	});
	let formMethod = (opts.formMethod || "get").toUpperCase();
	let formAction = stripHashFromPath(path);
	if (opts.body !== void 0) {
		if (opts.formEncType === "text/plain") {
			if (!isMutationMethod(formMethod)) return getInvalidBodyError();
			let text = typeof opts.body === "string" ? opts.body : opts.body instanceof FormData || opts.body instanceof URLSearchParams ? Array.from(opts.body.entries()).reduce((acc, [name, value]) => `${acc}${name}=${value}\n`, "") : String(opts.body);
			return {
				path,
				submission: {
					formMethod,
					formAction,
					formEncType: opts.formEncType,
					formData: void 0,
					json: void 0,
					text
				}
			};
		} else if (opts.formEncType === "application/json") {
			if (!isMutationMethod(formMethod)) return getInvalidBodyError();
			try {
				let json = typeof opts.body === "string" ? JSON.parse(opts.body) : opts.body;
				return {
					path,
					submission: {
						formMethod,
						formAction,
						formEncType: opts.formEncType,
						formData: void 0,
						json,
						text: void 0
					}
				};
			} catch (e) {
				return getInvalidBodyError();
			}
		}
	}
	invariant(typeof FormData === "function", "FormData is not available in this environment");
	let searchParams;
	let formData;
	if (opts.formData) {
		searchParams = convertFormDataToSearchParams(opts.formData);
		formData = opts.formData;
	} else if (opts.body instanceof FormData) {
		searchParams = convertFormDataToSearchParams(opts.body);
		formData = opts.body;
	} else if (opts.body instanceof URLSearchParams) {
		searchParams = opts.body;
		formData = convertSearchParamsToFormData(searchParams);
	} else if (opts.body == null) {
		searchParams = new URLSearchParams();
		formData = new FormData();
	} else try {
		searchParams = new URLSearchParams(opts.body);
		formData = convertSearchParamsToFormData(searchParams);
	} catch (e) {
		return getInvalidBodyError();
	}
	let submission = {
		formMethod,
		formAction,
		formEncType: opts && opts.formEncType || "application/x-www-form-urlencoded",
		formData,
		json: void 0,
		text: void 0
	};
	if (isMutationMethod(submission.formMethod)) return {
		path,
		submission
	};
	let parsedPath = parsePath(path);
	if (isFetcher && parsedPath.search && hasNakedIndexQuery(parsedPath.search)) searchParams.append("index", "");
	parsedPath.search = `?${searchParams}`;
	return {
		path: createPath(parsedPath),
		submission
	};
}
function getMatchesToLoad(request, scopedContext, mapRouteProperties, manifest, history, state, matches, submission, location, lazyRoutePropertiesToSkip, initialHydration, isRevalidationRequired, cancelledFetcherLoads, fetchersQueuedForDeletion, fetchLoadMatches, fetchRedirectIds, routesToUse, basename, hasPatchRoutesOnNavigation, branches, pendingActionResult, callSiteDefaultShouldRevalidate) {
	let actionResult = pendingActionResult ? isErrorResult(pendingActionResult[1]) ? pendingActionResult[1].error : pendingActionResult[1].data : void 0;
	let currentUrl = history.createURL(state.location);
	let nextUrl = history.createURL(location);
	let maxIdx;
	if (initialHydration && state.errors) {
		let boundaryId = Object.keys(state.errors)[0];
		maxIdx = matches.findIndex((m) => m.route.id === boundaryId);
	} else if (pendingActionResult && isErrorResult(pendingActionResult[1])) {
		let boundaryId = pendingActionResult[0];
		maxIdx = matches.findIndex((m) => m.route.id === boundaryId) - 1;
	}
	let actionStatus = pendingActionResult ? pendingActionResult[1].statusCode : void 0;
	let shouldSkipRevalidation = actionStatus && actionStatus >= 400;
	let baseShouldRevalidateArgs = {
		currentUrl,
		currentParams: state.matches[0]?.params || {},
		nextUrl,
		nextParams: matches[0].params,
		...submission,
		actionResult,
		actionStatus
	};
	let pattern = getRoutePattern(matches);
	let dsMatches = matches.map((match, index) => {
		let { route } = match;
		let forceShouldLoad = null;
		if (maxIdx != null && index > maxIdx) forceShouldLoad = false;
		else if (route.lazy) forceShouldLoad = true;
		else if (!routeHasLoaderOrMiddleware(route)) forceShouldLoad = false;
		else if (initialHydration) {
			let { shouldLoad } = getRouteHydrationStatus(route, state.loaderData, state.errors);
			forceShouldLoad = shouldLoad;
		} else if (isNewLoader(state.loaderData, state.matches[index], match)) forceShouldLoad = true;
		if (forceShouldLoad !== null) return getDataStrategyMatch(mapRouteProperties, manifest, request, location, pattern, match, lazyRoutePropertiesToSkip, scopedContext, forceShouldLoad);
		let defaultShouldRevalidate = false;
		if (typeof callSiteDefaultShouldRevalidate === "boolean") defaultShouldRevalidate = callSiteDefaultShouldRevalidate;
		else if (shouldSkipRevalidation) defaultShouldRevalidate = false;
		else if (isRevalidationRequired) defaultShouldRevalidate = true;
		else if (currentUrl.pathname + currentUrl.search === nextUrl.pathname + nextUrl.search) defaultShouldRevalidate = true;
		else if (currentUrl.search !== nextUrl.search) defaultShouldRevalidate = true;
		else if (isNewRouteInstance(state.matches[index], match)) defaultShouldRevalidate = true;
		let shouldRevalidateArgs = {
			...baseShouldRevalidateArgs,
			defaultShouldRevalidate
		};
		return getDataStrategyMatch(mapRouteProperties, manifest, request, location, pattern, match, lazyRoutePropertiesToSkip, scopedContext, shouldRevalidateLoader(match, shouldRevalidateArgs), shouldRevalidateArgs, callSiteDefaultShouldRevalidate);
	});
	let revalidatingFetchers = [];
	fetchLoadMatches.forEach((f, key) => {
		if (initialHydration || !matches.some((m) => m.route.id === f.routeId) || fetchersQueuedForDeletion.has(key)) return;
		let fetcher = state.fetchers.get(key);
		let isMidInitialLoad = fetcher && fetcher.state !== "idle" && fetcher.data === void 0;
		let fetcherMatches = matchRoutesImpl(routesToUse, f.path, basename ?? "/", false, branches);
		if (!fetcherMatches) {
			if (hasPatchRoutesOnNavigation && isMidInitialLoad) return;
			revalidatingFetchers.push({
				key,
				routeId: f.routeId,
				path: f.path,
				matches: null,
				match: null,
				request: null,
				controller: null
			});
			return;
		}
		if (fetchRedirectIds.has(key)) return;
		let fetcherMatch = getTargetMatch(fetcherMatches, f.path);
		let fetchController = new AbortController();
		let fetchRequest = createClientSideRequest(history, f.path, fetchController.signal);
		let fetcherDsMatches = null;
		if (cancelledFetcherLoads.has(key)) {
			cancelledFetcherLoads.delete(key);
			fetcherDsMatches = getTargetedDataStrategyMatches(mapRouteProperties, manifest, fetchRequest, f.path, fetcherMatches, fetcherMatch, lazyRoutePropertiesToSkip, scopedContext);
		} else if (isMidInitialLoad) {
			if (isRevalidationRequired) fetcherDsMatches = getTargetedDataStrategyMatches(mapRouteProperties, manifest, fetchRequest, f.path, fetcherMatches, fetcherMatch, lazyRoutePropertiesToSkip, scopedContext);
		} else {
			let defaultShouldRevalidate;
			if (typeof callSiteDefaultShouldRevalidate === "boolean") defaultShouldRevalidate = callSiteDefaultShouldRevalidate;
			else if (shouldSkipRevalidation) defaultShouldRevalidate = false;
			else defaultShouldRevalidate = isRevalidationRequired;
			let shouldRevalidateArgs = {
				...baseShouldRevalidateArgs,
				defaultShouldRevalidate
			};
			if (shouldRevalidateLoader(fetcherMatch, shouldRevalidateArgs)) fetcherDsMatches = getTargetedDataStrategyMatches(mapRouteProperties, manifest, fetchRequest, f.path, fetcherMatches, fetcherMatch, lazyRoutePropertiesToSkip, scopedContext, shouldRevalidateArgs);
		}
		if (fetcherDsMatches) revalidatingFetchers.push({
			key,
			routeId: f.routeId,
			path: f.path,
			matches: fetcherDsMatches,
			match: fetcherMatch,
			request: fetchRequest,
			controller: fetchController
		});
	});
	return {
		dsMatches,
		revalidatingFetchers
	};
}
function routeHasLoaderOrMiddleware(route) {
	return route.loader != null || route.middleware != null && route.middleware.length > 0;
}
function getRouteHydrationStatus(route, loaderData, errors) {
	if (route.lazy) return {
		shouldLoad: true,
		renderFallback: true
	};
	if (!routeHasLoaderOrMiddleware(route)) return {
		shouldLoad: false,
		renderFallback: false
	};
	let hasData = loaderData != null && route.id in loaderData;
	let hasError = errors != null && errors[route.id] !== void 0;
	if (!hasData && hasError) return {
		shouldLoad: false,
		renderFallback: false
	};
	if (typeof route.loader === "function" && route.loader.hydrate === true) return {
		shouldLoad: true,
		renderFallback: !hasData
	};
	let shouldLoad = !hasData && !hasError;
	return {
		shouldLoad,
		renderFallback: shouldLoad
	};
}
function isNewLoader(currentLoaderData, currentMatch, match) {
	let isNew = !currentMatch || match.route.id !== currentMatch.route.id;
	let isMissingData = !currentLoaderData.hasOwnProperty(match.route.id);
	return isNew || isMissingData;
}
function isNewRouteInstance(currentMatch, match) {
	let currentPath = currentMatch.route.path;
	return currentMatch.pathname !== match.pathname || currentPath != null && currentPath.endsWith("*") && currentMatch.params["*"] !== match.params["*"];
}
function shouldRevalidateLoader(loaderMatch, arg) {
	if (loaderMatch.route.shouldRevalidate) {
		let routeChoice = loaderMatch.route.shouldRevalidate(arg);
		if (typeof routeChoice === "boolean") return routeChoice;
	}
	return arg.defaultShouldRevalidate;
}
function patchRoutesImpl(routeId, children, dataRoutes, manifest, mapRouteProperties, allowElementMutations) {
	let childrenToPatch;
	if (routeId) {
		let route = manifest[routeId];
		invariant(route, `No route found to patch children into: routeId = ${routeId}`);
		if (!route.children) route.children = [];
		childrenToPatch = route.children;
	} else childrenToPatch = dataRoutes.activeRoutes;
	let uniqueChildren = [];
	let existingChildren = [];
	children.forEach((newRoute) => {
		let existingRoute = childrenToPatch.find((existingRoute) => isSameRoute(newRoute, existingRoute));
		if (existingRoute) existingChildren.push({
			existingRoute,
			newRoute
		});
		else uniqueChildren.push(newRoute);
	});
	if (uniqueChildren.length > 0) {
		let newRoutes = convertRoutesToDataRoutes(uniqueChildren, mapRouteProperties, [
			routeId || "_",
			"patch",
			String(childrenToPatch?.length || "0")
		], manifest);
		childrenToPatch.push(...newRoutes);
	}
	if (allowElementMutations && existingChildren.length > 0) for (let i = 0; i < existingChildren.length; i++) {
		let { existingRoute, newRoute } = existingChildren[i];
		let existingRouteTyped = existingRoute;
		let [newRouteTyped] = convertRoutesToDataRoutes([newRoute], mapRouteProperties, [], {}, true);
		Object.assign(existingRouteTyped, {
			element: newRouteTyped.element ? newRouteTyped.element : existingRouteTyped.element,
			errorElement: newRouteTyped.errorElement ? newRouteTyped.errorElement : existingRouteTyped.errorElement,
			hydrateFallbackElement: newRouteTyped.hydrateFallbackElement ? newRouteTyped.hydrateFallbackElement : existingRouteTyped.hydrateFallbackElement
		});
	}
	if (!dataRoutes.hasHMRRoutes) dataRoutes.setRoutes([...dataRoutes.activeRoutes]);
}
function isSameRoute(newRoute, existingRoute) {
	if ("id" in newRoute && "id" in existingRoute && newRoute.id === existingRoute.id) return true;
	if (!(newRoute.index === existingRoute.index && newRoute.path === existingRoute.path && newRoute.caseSensitive === existingRoute.caseSensitive)) return false;
	if ((!newRoute.children || newRoute.children.length === 0) && (!existingRoute.children || existingRoute.children.length === 0)) return true;
	return newRoute.children?.every((aChild, i) => existingRoute.children?.some((bChild) => isSameRoute(aChild, bChild))) ?? false;
}
const lazyRoutePropertyCache = /* @__PURE__ */ new WeakMap();
const loadLazyRouteProperty = ({ key, route, manifest, mapRouteProperties }) => {
	let routeToUpdate = manifest[route.id];
	invariant(routeToUpdate, "No route found in manifest");
	if (!routeToUpdate.lazy || typeof routeToUpdate.lazy !== "object") return;
	let lazyFn = routeToUpdate.lazy[key];
	if (!lazyFn) return;
	let cache = lazyRoutePropertyCache.get(routeToUpdate);
	if (!cache) {
		cache = {};
		lazyRoutePropertyCache.set(routeToUpdate, cache);
	}
	let cachedPromise = cache[key];
	if (cachedPromise) return cachedPromise;
	let propertyPromise = (async () => {
		let isUnsupported = isUnsupportedLazyRouteObjectKey(key);
		let isStaticallyDefined = routeToUpdate[key] !== void 0;
		if (isUnsupported) {
			warning(!isUnsupported, "Route property " + key + " is not a supported lazy route property. This property will be ignored.");
			cache[key] = Promise.resolve();
		} else if (isStaticallyDefined) warning(false, `Route "${routeToUpdate.id}" has a static property "${key}" defined. The lazy property will be ignored.`);
		else {
			let value = await lazyFn();
			if (value != null) {
				Object.assign(routeToUpdate, { [key]: value });
				Object.assign(routeToUpdate, mapRouteProperties(routeToUpdate));
			}
		}
		if (typeof routeToUpdate.lazy === "object") {
			routeToUpdate.lazy[key] = void 0;
			if (Object.values(routeToUpdate.lazy).every((value) => value === void 0)) routeToUpdate.lazy = void 0;
		}
	})();
	cache[key] = propertyPromise;
	return propertyPromise;
};
const lazyRouteFunctionCache = /* @__PURE__ */ new WeakMap();
/**
* Execute route.lazy functions to lazily load route modules (loader, action,
* shouldRevalidate) and update the routeManifest in place which shares objects
* with dataRoutes so those get updated as well.
*/
function loadLazyRoute(route, type, manifest, mapRouteProperties, lazyRoutePropertiesToSkip) {
	let routeToUpdate = manifest[route.id];
	invariant(routeToUpdate, "No route found in manifest");
	if (!route.lazy) return {
		lazyRoutePromise: void 0,
		lazyHandlerPromise: void 0
	};
	if (typeof route.lazy === "function") {
		let cachedPromise = lazyRouteFunctionCache.get(routeToUpdate);
		if (cachedPromise) return {
			lazyRoutePromise: cachedPromise,
			lazyHandlerPromise: cachedPromise
		};
		let lazyRoutePromise = (async () => {
			invariant(typeof route.lazy === "function", "No lazy route function found");
			let lazyRoute = await route.lazy();
			let routeUpdates = {};
			for (let lazyRouteProperty in lazyRoute) {
				let lazyValue = lazyRoute[lazyRouteProperty];
				if (lazyValue === void 0) continue;
				let isUnsupported = isUnsupportedLazyRouteFunctionKey(lazyRouteProperty);
				let isStaticallyDefined = routeToUpdate[lazyRouteProperty] !== void 0;
				if (isUnsupported) warning(!isUnsupported, "Route property " + lazyRouteProperty + " is not a supported property to be returned from a lazy route function. This property will be ignored.");
				else if (isStaticallyDefined) warning(!isStaticallyDefined, `Route "${routeToUpdate.id}" has a static property "${lazyRouteProperty}" defined but its lazy function is also returning a value for this property. The lazy route property "${lazyRouteProperty}" will be ignored.`);
				else routeUpdates[lazyRouteProperty] = lazyValue;
			}
			Object.assign(routeToUpdate, routeUpdates);
			Object.assign(routeToUpdate, {
				...mapRouteProperties(routeToUpdate),
				lazy: void 0
			});
		})();
		lazyRouteFunctionCache.set(routeToUpdate, lazyRoutePromise);
		lazyRoutePromise.catch(() => {});
		return {
			lazyRoutePromise,
			lazyHandlerPromise: lazyRoutePromise
		};
	}
	let lazyKeys = Object.keys(route.lazy);
	let lazyPropertyPromises = [];
	let lazyHandlerPromise = void 0;
	for (let key of lazyKeys) {
		if (lazyRoutePropertiesToSkip && lazyRoutePropertiesToSkip.includes(key)) continue;
		let promise = loadLazyRouteProperty({
			key,
			route,
			manifest,
			mapRouteProperties
		});
		if (promise) {
			lazyPropertyPromises.push(promise);
			if (key === type) lazyHandlerPromise = promise;
		}
	}
	let lazyRoutePromise = lazyPropertyPromises.length > 0 ? Promise.all(lazyPropertyPromises).then(() => {}) : void 0;
	lazyRoutePromise?.catch(() => {});
	lazyHandlerPromise?.catch(() => {});
	return {
		lazyRoutePromise,
		lazyHandlerPromise
	};
}
function isNonNullable(value) {
	return value !== void 0;
}
function loadLazyMiddlewareForMatches(matches, manifest, mapRouteProperties) {
	let promises = matches.map(({ route }) => {
		if (typeof route.lazy !== "object" || !route.lazy.middleware) return;
		return loadLazyRouteProperty({
			key: "middleware",
			route,
			manifest,
			mapRouteProperties
		});
	}).filter(isNonNullable);
	return promises.length > 0 ? Promise.all(promises) : void 0;
}
async function defaultDataStrategy(args) {
	let matchesToLoad = args.matches.filter((m) => m.shouldLoad);
	let keyedResults = {};
	(await Promise.all(matchesToLoad.map((m) => m.resolve()))).forEach((result, i) => {
		keyedResults[matchesToLoad[i].route.id] = result;
	});
	return keyedResults;
}
async function defaultDataStrategyWithMiddleware(args) {
	if (!args.matches.some((m) => m.route.middleware)) return defaultDataStrategy(args);
	return runClientMiddlewarePipeline(args, () => defaultDataStrategy(args));
}
function runServerMiddlewarePipeline(args, handler, errorHandler) {
	return runMiddlewarePipeline(args, handler, processResult, isResponse, errorHandler);
	function processResult(result) {
		return isDataWithResponseInit(result) ? dataWithResponseInitToResponse(result) : result;
	}
}
function runClientMiddlewarePipeline(args, handler) {
	return runMiddlewarePipeline(args, handler, (r) => {
		if (isRedirectResponse(r)) throw r;
		return r;
	}, isDataStrategyResults, errorHandler);
	async function errorHandler(error, routeId, nextResult) {
		if (nextResult) return Object.assign(nextResult.value, { [routeId]: {
			type: "error",
			result: error
		} });
		else {
			let { matches } = args;
			let maxBoundaryIdx = Math.min(Math.max(matches.findIndex((m) => m.route.id === routeId), 0), Math.max(matches.findIndex((m) => m.shouldCallHandler()), 0));
			let deepestRouteId = matches[maxBoundaryIdx].route.id;
			for (let match of matches.slice(0, maxBoundaryIdx + 1)) try {
				await match._lazyPromises?.route;
			} catch {
				deepestRouteId = match.route.id;
				break;
			}
			return { [findNearestBoundary(matches, deepestRouteId).route.id]: {
				type: "error",
				result: error
			} };
		}
	}
}
async function runMiddlewarePipeline(args, handler, processResult, isResult, errorHandler) {
	let { matches, ...dataFnArgs } = args;
	return await callRouteMiddleware(dataFnArgs, matches.flatMap((m) => m.route.middleware ? m.route.middleware.map((fn) => [m.route.id, fn]) : []), handler, processResult, isResult, errorHandler);
}
async function callRouteMiddleware(args, middlewares, handler, processResult, isResult, errorHandler, idx = 0) {
	let { request } = args;
	if (request.signal.aborted) throw request.signal.reason ?? /* @__PURE__ */ new Error(`Request aborted: ${request.method} ${request.url}`);
	let tuple = middlewares[idx];
	if (!tuple) return await handler();
	let [routeId, middleware] = tuple;
	let nextResult;
	let next = async () => {
		if (nextResult) throw new Error("You may only call `next()` once per middleware");
		try {
			nextResult = { value: await callRouteMiddleware(args, middlewares, handler, processResult, isResult, errorHandler, idx + 1) };
			return nextResult.value;
		} catch (error) {
			nextResult = { value: await errorHandler(error, routeId, nextResult) };
			return nextResult.value;
		}
	};
	try {
		let value = await middleware(args, next);
		let result = value != null ? processResult(value) : void 0;
		if (isResult(result)) return result;
		else if (nextResult) return result ?? nextResult.value;
		else {
			nextResult = { value: await next() };
			return nextResult.value;
		}
	} catch (error) {
		return await errorHandler(error, routeId, nextResult);
	}
}
function getDataStrategyMatchLazyPromises(mapRouteProperties, manifest, request, match, lazyRoutePropertiesToSkip) {
	let lazyMiddlewarePromise = loadLazyRouteProperty({
		key: "middleware",
		route: match.route,
		manifest,
		mapRouteProperties
	});
	let lazyRoutePromises = loadLazyRoute(match.route, isMutationMethod(request.method) ? "action" : "loader", manifest, mapRouteProperties, lazyRoutePropertiesToSkip);
	return {
		middleware: lazyMiddlewarePromise,
		route: lazyRoutePromises.lazyRoutePromise,
		handler: lazyRoutePromises.lazyHandlerPromise
	};
}
function getDataStrategyMatch(mapRouteProperties, manifest, request, path, pattern, match, lazyRoutePropertiesToSkip, scopedContext, shouldLoad, shouldRevalidateArgs = null, callSiteDefaultShouldRevalidate) {
	let isUsingNewApi = false;
	let _lazyPromises = getDataStrategyMatchLazyPromises(mapRouteProperties, manifest, request, match, lazyRoutePropertiesToSkip);
	return {
		...match,
		_lazyPromises,
		shouldLoad,
		shouldRevalidateArgs,
		shouldCallHandler(defaultShouldRevalidate) {
			isUsingNewApi = true;
			if (!shouldRevalidateArgs) return shouldLoad;
			if (typeof callSiteDefaultShouldRevalidate === "boolean") return shouldRevalidateLoader(match, {
				...shouldRevalidateArgs,
				defaultShouldRevalidate: callSiteDefaultShouldRevalidate
			});
			if (typeof defaultShouldRevalidate === "boolean") return shouldRevalidateLoader(match, {
				...shouldRevalidateArgs,
				defaultShouldRevalidate
			});
			return shouldRevalidateLoader(match, shouldRevalidateArgs);
		},
		resolve(handlerOverride) {
			let { lazy, loader, middleware } = match.route;
			let callHandler = isUsingNewApi || shouldLoad || handlerOverride && !isMutationMethod(request.method) && (lazy || loader);
			let isMiddlewareOnlyRoute = middleware && middleware.length > 0 && !loader && !lazy;
			if (callHandler && (isMutationMethod(request.method) || !isMiddlewareOnlyRoute)) return callLoaderOrAction({
				request,
				path,
				pattern,
				match,
				lazyHandlerPromise: _lazyPromises?.handler,
				lazyRoutePromise: _lazyPromises?.route,
				handlerOverride,
				scopedContext
			});
			return Promise.resolve({
				type: "data",
				result: void 0
			});
		}
	};
}
function getTargetedDataStrategyMatches(mapRouteProperties, manifest, request, path, matches, targetMatch, lazyRoutePropertiesToSkip, scopedContext, shouldRevalidateArgs = null) {
	return matches.map((match) => {
		if (match.route.id !== targetMatch.route.id) return {
			...match,
			shouldLoad: false,
			shouldRevalidateArgs,
			shouldCallHandler: () => false,
			_lazyPromises: getDataStrategyMatchLazyPromises(mapRouteProperties, manifest, request, match, lazyRoutePropertiesToSkip),
			resolve: () => Promise.resolve({
				type: "data",
				result: void 0
			})
		};
		return getDataStrategyMatch(mapRouteProperties, manifest, request, path, getRoutePattern(matches), match, lazyRoutePropertiesToSkip, scopedContext, true, shouldRevalidateArgs);
	});
}
async function callDataStrategyImpl(dataStrategyImpl, request, path, matches, fetcherKey, scopedContext, isStaticHandler) {
	if (matches.some((m) => m._lazyPromises?.middleware)) await Promise.all(matches.map((m) => m._lazyPromises?.middleware));
	let dataStrategyArgs = {
		request,
		url: createDataFunctionUrl(request, path),
		pattern: getRoutePattern(matches),
		params: matches[0].params,
		context: scopedContext,
		matches
	};
	let runClientMiddleware = isStaticHandler ? () => {
		throw new Error("You cannot call `runClientMiddleware()` from a static handler `dataStrategy`. Middleware is run outside of `dataStrategy` during SSR in order to bubble up the Response.  You can enable middleware via the `respond` API in `query`/`queryRoute`");
	} : (cb) => {
		let typedDataStrategyArgs = dataStrategyArgs;
		return runClientMiddlewarePipeline(typedDataStrategyArgs, () => {
			return cb({
				...typedDataStrategyArgs,
				fetcherKey,
				runClientMiddleware: () => {
					throw new Error("Cannot call `runClientMiddleware()` from within an `runClientMiddleware` handler");
				}
			});
		});
	};
	let results = await dataStrategyImpl({
		...dataStrategyArgs,
		fetcherKey,
		runClientMiddleware
	});
	try {
		await Promise.all(matches.flatMap((m) => [m._lazyPromises?.handler, m._lazyPromises?.route]));
	} catch (e) {}
	return results;
}
async function callLoaderOrAction({ request, path, pattern, match, lazyHandlerPromise, lazyRoutePromise, handlerOverride, scopedContext }) {
	let result;
	let onReject;
	let isAction = isMutationMethod(request.method);
	let type = isAction ? "action" : "loader";
	let runHandler = (handler) => {
		let reject;
		let abortPromise = new Promise((_, r) => reject = r);
		onReject = () => reject();
		request.signal.addEventListener("abort", onReject);
		let actualHandler = (ctx) => {
			if (typeof handler !== "function") return Promise.reject(/* @__PURE__ */ new Error(`You cannot call the handler for a route which defines a boolean "${type}" [routeId: ${match.route.id}]`));
			return handler({
				request,
				url: createDataFunctionUrl(request, path),
				pattern,
				params: match.params,
				context: scopedContext
			}, ...ctx !== void 0 ? [ctx] : []);
		};
		let handlerPromise = (async () => {
			try {
				return {
					type: "data",
					result: await (handlerOverride ? handlerOverride((ctx) => actualHandler(ctx)) : actualHandler())
				};
			} catch (e) {
				return {
					type: "error",
					result: e
				};
			}
		})();
		return Promise.race([handlerPromise, abortPromise]);
	};
	try {
		let handler = isAction ? match.route.action : match.route.loader;
		if (lazyHandlerPromise || lazyRoutePromise) if (handler) {
			let handlerError;
			let [value] = await Promise.all([
				runHandler(handler).catch((e) => {
					handlerError = e;
				}),
				lazyHandlerPromise,
				lazyRoutePromise
			]);
			if (handlerError !== void 0) throw handlerError;
			result = value;
		} else {
			await lazyHandlerPromise;
			let handler = isAction ? match.route.action : match.route.loader;
			if (handler) [result] = await Promise.all([runHandler(handler), lazyRoutePromise]);
			else if (type === "action") {
				let url = new URL(request.url);
				let pathname = url.pathname + url.search;
				throw getInternalRouterError(405, {
					method: request.method,
					pathname,
					routeId: match.route.id
				});
			} else return {
				type: "data",
				result: void 0
			};
		}
		else if (!handler) {
			let url = new URL(request.url);
			throw getInternalRouterError(404, { pathname: url.pathname + url.search });
		} else result = await runHandler(handler);
	} catch (e) {
		return {
			type: "error",
			result: e
		};
	} finally {
		if (onReject) request.signal.removeEventListener("abort", onReject);
	}
	return result;
}
async function parseResponseBody(response) {
	let contentType = response.headers.get("Content-Type");
	if (contentType && /\bapplication\/json\b/.test(contentType)) return response.body == null ? null : response.json();
	return response.text();
}
async function convertDataStrategyResultToDataResult(dataStrategyResult) {
	let { result, type } = dataStrategyResult;
	if (isResponse(result)) {
		let data;
		try {
			data = await parseResponseBody(result);
		} catch (e) {
			return {
				type: "error",
				error: e
			};
		}
		if (type === "error") return {
			type: "error",
			error: new ErrorResponseImpl(result.status, result.statusText, data),
			statusCode: result.status,
			headers: result.headers
		};
		return {
			type: "data",
			data,
			statusCode: result.status,
			headers: result.headers
		};
	}
	if (type === "error") {
		if (isDataWithResponseInit(result)) {
			if (result.data instanceof Error) return {
				type: "error",
				error: result.data,
				statusCode: result.init?.status,
				headers: result.init?.headers ? new Headers(result.init.headers) : void 0
			};
			return {
				type: "error",
				error: dataWithResponseInitToErrorResponse(result),
				statusCode: isRouteErrorResponse(result) ? result.status : void 0,
				headers: result.init?.headers ? new Headers(result.init.headers) : void 0
			};
		}
		return {
			type: "error",
			error: result,
			statusCode: isRouteErrorResponse(result) ? result.status : void 0
		};
	}
	if (isDataWithResponseInit(result)) return {
		type: "data",
		data: result.data,
		statusCode: result.init?.status,
		headers: result.init?.headers ? new Headers(result.init.headers) : void 0
	};
	return {
		type: "data",
		data: result
	};
}
function normalizeRelativeRoutingRedirectResponse(response, request, routeId, matches, basename) {
	let location = response.headers.get("Location");
	invariant(location, "Redirects returned/thrown from loaders/actions must have a Location header");
	if (!isAbsoluteUrl(location)) {
		let trimmedMatches = matches.slice(0, matches.findIndex((m) => m.route.id === routeId) + 1);
		location = normalizeTo(new URL(request.url), trimmedMatches, basename, location);
		response.headers.set("Location", location);
	}
	return response;
}
const invalidProtocols = [
	"about:",
	"blob:",
	"chrome:",
	"chrome-untrusted:",
	"content:",
	"data:",
	"devtools:",
	"file:",
	"filesystem:",
	"javascript:"
];
function hasInvalidProtocol(location) {
	try {
		return invalidProtocols.includes(new URL(location).protocol);
	} catch {
		return false;
	}
}
function normalizeRedirectLocation(location, currentUrl, basename, historyInstance) {
	if (isAbsoluteUrl(location)) {
		let normalizedLocation = location;
		let url = PROTOCOL_RELATIVE_URL_REGEX.test(normalizedLocation) ? new URL(normalizeProtocolRelativeUrl(normalizedLocation, currentUrl.protocol)) : new URL(normalizedLocation);
		if (hasInvalidProtocol(url.toString())) throw new Error("Invalid redirect location");
		let isSameBasename = stripBasename(url.pathname, basename) != null;
		if (url.origin === currentUrl.origin && isSameBasename) return removeDoubleSlashes(url.pathname) + url.search + url.hash;
	}
	try {
		if (hasInvalidProtocol(historyInstance.createURL(location).toString())) throw new Error("Invalid redirect location");
	} catch (e) {}
	return location;
}
function createClientSideRequest(history, location, signal, submission) {
	let url = history.createURL(stripHashFromPath(location)).toString();
	let init = { signal };
	if (submission && isMutationMethod(submission.formMethod)) {
		let { formMethod, formEncType } = submission;
		init.method = formMethod.toUpperCase();
		if (formEncType === "application/json") {
			init.headers = new Headers({ "Content-Type": formEncType });
			init.body = JSON.stringify(submission.json);
		} else if (formEncType === "text/plain") init.body = submission.text;
		else if (formEncType === "application/x-www-form-urlencoded" && submission.formData) init.body = convertFormDataToSearchParams(submission.formData);
		else init.body = submission.formData;
	}
	return new Request(url, init);
}
function createDataFunctionUrl(request, path) {
	let url = new URL(request.url);
	let parsed = typeof path === "string" ? parsePath(path) : path;
	url.pathname = parsed.pathname || "/";
	if (parsed.search) {
		let searchParams = new URLSearchParams(parsed.search);
		let indexValues = searchParams.getAll("index");
		searchParams.delete("index");
		for (let value of indexValues.filter(Boolean)) searchParams.append("index", value);
		let search = searchParams.toString();
		url.search = search ? `?${search}` : "";
	} else url.search = "";
	url.hash = parsed.hash || "";
	return url;
}
function convertFormDataToSearchParams(formData) {
	let searchParams = new URLSearchParams();
	for (let [key, value] of formData.entries()) searchParams.append(key, typeof value === "string" ? value : value.name);
	return searchParams;
}
function convertSearchParamsToFormData(searchParams) {
	let formData = new FormData();
	for (let [key, value] of searchParams.entries()) formData.append(key, value);
	return formData;
}
function processRouteLoaderData(matches, results, pendingActionResult, isStaticHandler = false, skipLoaderErrorBubbling = false) {
	let loaderData = {};
	let errors = null;
	let statusCode;
	let foundError = false;
	let loaderHeaders = {};
	let pendingError = pendingActionResult && isErrorResult(pendingActionResult[1]) ? pendingActionResult[1].error : void 0;
	matches.forEach((match) => {
		if (!(match.route.id in results)) return;
		let id = match.route.id;
		let result = results[id];
		invariant(!isRedirectResult(result), "Cannot handle redirect results in processLoaderData");
		if (isErrorResult(result)) {
			let error = result.error;
			if (pendingError !== void 0) {
				error = pendingError;
				pendingError = void 0;
			}
			errors = errors || {};
			if (skipLoaderErrorBubbling) errors[id] = error;
			else {
				let boundaryMatch = findNearestBoundary(matches, id);
				if (errors[boundaryMatch.route.id] == null) errors[boundaryMatch.route.id] = error;
			}
			if (!isStaticHandler) loaderData[id] = ResetLoaderDataSymbol;
			if (!foundError) {
				foundError = true;
				statusCode = isRouteErrorResponse(result.error) ? result.error.status : 500;
			}
			if (result.headers) loaderHeaders[id] = result.headers;
		} else {
			loaderData[id] = result.data;
			if (result.statusCode && result.statusCode !== 200 && !foundError) statusCode = result.statusCode;
			if (result.headers) loaderHeaders[id] = result.headers;
		}
	});
	if (pendingError !== void 0 && pendingActionResult) {
		errors = { [pendingActionResult[0]]: pendingError };
		if (pendingActionResult[2]) loaderData[pendingActionResult[2]] = void 0;
	}
	return {
		loaderData,
		errors,
		statusCode: statusCode || 200,
		loaderHeaders
	};
}
function processLoaderData(state, matches, results, pendingActionResult, revalidatingFetchers, fetcherResults, workingFetchers) {
	let { loaderData, errors } = processRouteLoaderData(matches, results, pendingActionResult);
	revalidatingFetchers.filter((f) => !f.matches || f.matches.some((m) => m.shouldLoad)).forEach((rf) => {
		let { key, match, controller } = rf;
		if (controller && controller.signal.aborted) return;
		let result = fetcherResults[key];
		invariant(result, "Did not find corresponding fetcher result");
		if (isErrorResult(result)) {
			let boundaryMatch = findNearestBoundary(state.matches, match?.route.id);
			if (!(errors && errors[boundaryMatch.route.id])) errors = {
				...errors,
				[boundaryMatch.route.id]: result.error
			};
			workingFetchers.delete(key);
		} else if (isRedirectResult(result)) invariant(false, "Unhandled fetcher revalidation redirect");
		else {
			let doneFetcher = getDoneFetcher(result.data);
			workingFetchers.set(key, doneFetcher);
		}
	});
	return {
		loaderData,
		errors
	};
}
function mergeLoaderData(loaderData, newLoaderData, matches, errors) {
	let mergedLoaderData = Object.entries(newLoaderData).filter(([, v]) => v !== ResetLoaderDataSymbol).reduce((merged, [k, v]) => {
		merged[k] = v;
		return merged;
	}, {});
	for (let match of matches) {
		let id = match.route.id;
		if (!newLoaderData.hasOwnProperty(id) && loaderData.hasOwnProperty(id) && match.route.loader) mergedLoaderData[id] = loaderData[id];
		if (errors && errors.hasOwnProperty(id)) break;
	}
	return mergedLoaderData;
}
function getActionDataForCommit(pendingActionResult) {
	if (!pendingActionResult) return {};
	return isErrorResult(pendingActionResult[1]) ? { actionData: {} } : { actionData: { [pendingActionResult[0]]: pendingActionResult[1].data } };
}
function findNearestBoundary(matches, routeId) {
	return (routeId ? matches.slice(0, matches.findIndex((m) => m.route.id === routeId) + 1) : [...matches]).reverse().find((m) => m.route.ErrorBoundary != null || m.route.errorElement != null) || matches[0];
}
function getShortCircuitMatches(routes) {
	let route = routes.length === 1 ? routes[0] : routes.find((r) => r.index || !r.path || r.path === "/") || { id: `__shim-error-route__` };
	return {
		matches: [{
			params: {},
			pathname: "",
			pathnameBase: "",
			route
		}],
		route
	};
}
function getInternalRouterError(status, { pathname, routeId, method, type, message } = {}) {
	let statusText = "Unknown Server Error";
	let errorMessage = "Unknown @remix-run/router error";
	if (status === 400) {
		statusText = "Bad Request";
		if (method && pathname && routeId) errorMessage = `You made a ${method} request to "${pathname}" but did not provide a \`loader\` for route "${routeId}", so there is no way to handle the request.`;
		else if (type === "invalid-body") errorMessage = "Unable to encode submission body";
	} else if (status === 403) {
		statusText = "Forbidden";
		errorMessage = `Route "${routeId}" does not match URL "${pathname}"`;
	} else if (status === 404) {
		statusText = "Not Found";
		errorMessage = `No route matches URL "${pathname}"`;
	} else if (status === 405) {
		statusText = "Method Not Allowed";
		if (method && pathname && routeId) errorMessage = `You made a ${method.toUpperCase()} request to "${pathname}" but did not provide an \`action\` for route "${routeId}", so there is no way to handle the request.`;
		else if (method) errorMessage = `Invalid request method "${method.toUpperCase()}"`;
	}
	return new ErrorResponseImpl(status || 500, statusText, new Error(errorMessage), true);
}
function findRedirect(results) {
	let entries = Object.entries(results);
	for (let i = entries.length - 1; i >= 0; i--) {
		let [key, result] = entries[i];
		if (isRedirectResult(result)) return {
			key,
			result
		};
	}
}
function stripHashFromPath(path) {
	return createPath({
		...typeof path === "string" ? parsePath(path) : path,
		hash: ""
	});
}
function isHashChangeOnly(a, b) {
	if (a.pathname !== b.pathname || a.search !== b.search) return false;
	if (a.hash === "") return b.hash !== "";
	else if (a.hash === b.hash) return true;
	else if (b.hash !== "") return true;
	return false;
}
function dataWithResponseInitToResponse(data) {
	return Response.json(data.data, data.init ?? void 0);
}
function dataWithResponseInitToErrorResponse(data) {
	return new ErrorResponseImpl(data.init?.status ?? 500, data.init?.statusText ?? "Internal Server Error", data.data);
}
function isDataStrategyResults(result) {
	return result != null && typeof result === "object" && Object.entries(result).every(([key, value]) => typeof key === "string" && isDataStrategyResult(value));
}
function isDataStrategyResult(result) {
	return result != null && typeof result === "object" && "type" in result && "result" in result && (result.type === "data" || result.type === "error");
}
function isRedirectDataStrategyResult(result) {
	return isResponse(result.result) && redirectStatusCodes.has(result.result.status);
}
function isErrorResult(result) {
	return result.type === "error";
}
function isRedirectResult(result) {
	return (result && result.type) === "redirect";
}
function isDataWithResponseInit(value) {
	return typeof value === "object" && value != null && "type" in value && "data" in value && "init" in value && value.type === "DataWithResponseInit";
}
function isResponse(value) {
	return value != null && typeof value.status === "number" && typeof value.statusText === "string" && typeof value.headers === "object" && typeof value.body !== "undefined";
}
function isRedirectStatusCode(statusCode) {
	return redirectStatusCodes.has(statusCode);
}
function isRedirectResponse(result) {
	return isResponse(result) && isRedirectStatusCode(result.status) && result.headers.has("Location");
}
function isValidMethod(method) {
	return validRequestMethods.has(method.toUpperCase());
}
function isMutationMethod(method) {
	return validMutationMethods.has(method.toUpperCase());
}
function hasNakedIndexQuery(search) {
	return new URLSearchParams(search).getAll("index").some((v) => v === "");
}
function getTargetMatch(matches, location) {
	let search = typeof location === "string" ? parsePath(location).search : location.search;
	if (matches[matches.length - 1].route.index && hasNakedIndexQuery(search || "")) return matches[matches.length - 1];
	let pathMatches = getPathContributingMatches(matches);
	return pathMatches[pathMatches.length - 1];
}
function getSubmissionFromNavigation(navigation) {
	let { formMethod, formAction, formEncType, text, formData, json } = navigation;
	if (!formMethod || !formAction || !formEncType) return;
	if (text != null) return {
		formMethod,
		formAction,
		formEncType,
		formData: void 0,
		json: void 0,
		text
	};
	else if (formData != null) return {
		formMethod,
		formAction,
		formEncType,
		formData,
		json: void 0,
		text: void 0
	};
	else if (json !== void 0) return {
		formMethod,
		formAction,
		formEncType,
		formData: void 0,
		json,
		text: void 0
	};
}
function getLoadingNavigation(location, matches, historyAction, submission) {
	if (submission) return {
		state: "loading",
		location,
		matches,
		historyAction,
		formMethod: submission.formMethod,
		formAction: submission.formAction,
		formEncType: submission.formEncType,
		formData: submission.formData,
		json: submission.json,
		text: submission.text
	};
	else return {
		state: "loading",
		location,
		matches,
		historyAction,
		formMethod: void 0,
		formAction: void 0,
		formEncType: void 0,
		formData: void 0,
		json: void 0,
		text: void 0
	};
}
function getSubmittingNavigation(location, matches, historyAction, submission) {
	return {
		state: "submitting",
		location,
		matches,
		historyAction,
		formMethod: submission.formMethod,
		formAction: submission.formAction,
		formEncType: submission.formEncType,
		formData: submission.formData,
		json: submission.json,
		text: submission.text
	};
}
function getLoadingFetcher(submission, data) {
	if (submission) return {
		state: "loading",
		formMethod: submission.formMethod,
		formAction: submission.formAction,
		formEncType: submission.formEncType,
		formData: submission.formData,
		json: submission.json,
		text: submission.text,
		data
	};
	else return {
		state: "loading",
		formMethod: void 0,
		formAction: void 0,
		formEncType: void 0,
		formData: void 0,
		json: void 0,
		text: void 0,
		data
	};
}
function getSubmittingFetcher(submission, existingFetcher) {
	return {
		state: "submitting",
		formMethod: submission.formMethod,
		formAction: submission.formAction,
		formEncType: submission.formEncType,
		formData: submission.formData,
		json: submission.json,
		text: submission.text,
		data: existingFetcher ? existingFetcher.data : void 0
	};
}
function getDoneFetcher(data) {
	return {
		state: "idle",
		formMethod: void 0,
		formAction: void 0,
		formEncType: void 0,
		formData: void 0,
		json: void 0,
		text: void 0,
		data
	};
}
function restoreAppliedTransitions(_window, transitions) {
	try {
		let sessionPositions = _window.sessionStorage.getItem(TRANSITIONS_STORAGE_KEY);
		if (sessionPositions) {
			let json = JSON.parse(sessionPositions);
			for (let [k, v] of Object.entries(json || {})) if (v && Array.isArray(v)) transitions.set(k, new Set(v || []));
		}
	} catch (e) {}
}
function persistAppliedTransitions(_window, transitions) {
	if (transitions.size > 0) {
		let json = {};
		for (let [k, v] of transitions) json[k] = [...v];
		try {
			_window.sessionStorage.setItem(TRANSITIONS_STORAGE_KEY, JSON.stringify(json));
		} catch (error) {
			warning(false, `Failed to save applied view transitions in sessionStorage (${error}).`);
		}
	}
}
function createDeferred() {
	let resolve;
	let reject;
	let promise = new Promise((res, rej) => {
		resolve = async (val) => {
			res(val);
			try {
				await promise;
			} catch (e) {}
		};
		reject = async (error) => {
			rej(error);
			try {
				await promise;
			} catch (e) {}
		};
	});
	return {
		promise,
		resolve,
		reject
	};
}
//#endregion
export { IDLE_BLOCKER, IDLE_FETCHER, IDLE_NAVIGATION, createRouter, createStaticHandler, getStaticContextFromError, hasInvalidProtocol, isDataWithResponseInit, isMutationMethod, isRedirectResponse, isRedirectStatusCode, isResponse };
