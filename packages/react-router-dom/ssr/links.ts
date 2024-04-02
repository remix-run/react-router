import type { AgnosticDataRouteMatch } from "@remix-run/router";
import type { Location } from "react-router-dom";
import { parsePath } from "react-router-dom";

import type { AssetsManifest } from "./entry";
import type { RouteModules, RouteModule } from "./routeModules";
import type { EntryRoute } from "./routes";
import { loadRouteModule } from "./routeModules";

type Primitive = null | undefined | string | number | boolean | symbol | bigint;

type LiteralUnion<LiteralType, BaseType extends Primitive> =
  | LiteralType
  | (BaseType & Record<never, never>);

interface HtmlLinkProps {
  /**
   * Address of the hyperlink
   */
  href?: string;

  /**
   * How the element handles crossorigin requests
   */
  crossOrigin?: "anonymous" | "use-credentials";

  /**
   * Relationship between the document containing the hyperlink and the destination resource
   */
  rel: LiteralUnion<
    | "alternate"
    | "dns-prefetch"
    | "icon"
    | "manifest"
    | "modulepreload"
    | "next"
    | "pingback"
    | "preconnect"
    | "prefetch"
    | "preload"
    | "prerender"
    | "search"
    | "stylesheet",
    string
  >;

  /**
   * Applicable media: "screen", "print", "(max-width: 764px)"
   */
  media?: string;

  /**
   * Integrity metadata used in Subresource Integrity checks
   */
  integrity?: string;

  /**
   * Language of the linked resource
   */
  hrefLang?: string;

  /**
   * Hint for the type of the referenced resource
   */
  type?: string;

  /**
   * Referrer policy for fetches initiated by the element
   */
  referrerPolicy?:
    | ""
    | "no-referrer"
    | "no-referrer-when-downgrade"
    | "same-origin"
    | "origin"
    | "strict-origin"
    | "origin-when-cross-origin"
    | "strict-origin-when-cross-origin"
    | "unsafe-url";

  /**
   * Sizes of the icons (for rel="icon")
   */
  sizes?: string;

  /**
   * Potential destination for a preload request (for rel="preload" and rel="modulepreload")
   */
  as?: LiteralUnion<
    | "audio"
    | "audioworklet"
    | "document"
    | "embed"
    | "fetch"
    | "font"
    | "frame"
    | "iframe"
    | "image"
    | "manifest"
    | "object"
    | "paintworklet"
    | "report"
    | "script"
    | "serviceworker"
    | "sharedworker"
    | "style"
    | "track"
    | "video"
    | "worker"
    | "xslt",
    string
  >;

  /**
   * Color to use when customizing a site's icon (for rel="mask-icon")
   */
  color?: string;

  /**
   * Whether the link is disabled
   */
  disabled?: boolean;

  /**
   * The title attribute has special semantics on this element: Title of the link; CSS style sheet set name.
   */
  title?: string;

  /**
   * Images to use in different situations, e.g., high-resolution displays,
   * small monitors, etc. (for rel="preload")
   */
  imageSrcSet?: string;

  /**
   * Image sizes for different page layouts (for rel="preload")
   */
  imageSizes?: string;
}

interface HtmlLinkPreloadImage extends HtmlLinkProps {
  /**
   * Relationship between the document containing the hyperlink and the destination resource
   */
  rel: "preload";

  /**
   * Potential destination for a preload request (for rel="preload" and rel="modulepreload")
   */
  as: "image";

  /**
   * Address of the hyperlink
   */
  href?: string;

  /**
   * Images to use in different situations, e.g., high-resolution displays,
   * small monitors, etc. (for rel="preload")
   */
  imageSrcSet: string;

  /**
   * Image sizes for different page layouts (for rel="preload")
   */
  imageSizes?: string;
}

/**
 * Represents a `<link>` element.
 *
 * WHATWG Specification: https://html.spec.whatwg.org/multipage/semantics.html#the-link-element
 */
export type HtmlLinkDescriptor =
  // Must have an href *unless* it's a `<link rel="preload" as="image">` with an
  // `imageSrcSet` and `imageSizes` props
  | (HtmlLinkProps & Pick<Required<HtmlLinkProps>, "href">)
  | (HtmlLinkPreloadImage & Pick<Required<HtmlLinkPreloadImage>, "imageSizes">)
  | (HtmlLinkPreloadImage &
      Pick<Required<HtmlLinkPreloadImage>, "href"> & { imageSizes?: never });

export interface PrefetchPageDescriptor
  extends Omit<
    HtmlLinkDescriptor,
    | "href"
    | "rel"
    | "type"
    | "sizes"
    | "imageSrcSet"
    | "imageSizes"
    | "as"
    | "color"
    | "title"
  > {
  /**
   * The absolute path of the page to prefetch.
   */
  page: string;
}

export type LinkDescriptor = HtmlLinkDescriptor | PrefetchPageDescriptor;

////////////////////////////////////////////////////////////////////////////////

/**
 * Gets all the links for a set of matches. The modules are assumed to have been
 * loaded already.
 */
export function getKeyedLinksForMatches(
  matches: AgnosticDataRouteMatch[],
  routeModules: RouteModules,
  manifest: AssetsManifest
): KeyedLinkDescriptor[] {
  let descriptors = matches
    .map((match): LinkDescriptor[][] => {
      let module = routeModules[match.route.id];
      let route = manifest.routes[match.route.id];
      return [
        route.css ? route.css.map((href) => ({ rel: "stylesheet", href })) : [],
        module?.links?.() || [],
      ];
    })
    .flat(2);

  let preloads = getCurrentPageModulePreloadHrefs(matches, manifest);
  return dedupeLinkDescriptors(descriptors, preloads);
}

export async function prefetchStyleLinks(
  route: EntryRoute,
  routeModule: RouteModule
): Promise<void> {
  if ((!route.css && !routeModule.links) || !isPreloadSupported()) return;

  let descriptors = [
    route.css?.map((href) => ({ rel: "stylesheet", href })) ?? [],
    routeModule.links?.() ?? [],
  ].flat(1);
  if (descriptors.length === 0) return;

  let styleLinks: HtmlLinkDescriptor[] = [];
  for (let descriptor of descriptors) {
    if (!isPageLinkDescriptor(descriptor) && descriptor.rel === "stylesheet") {
      styleLinks.push({
        ...descriptor,
        rel: "preload",
        as: "style",
      } as HtmlLinkDescriptor);
    }
  }

  // don't block for non-matching media queries, or for stylesheets that are
  // already in the DOM (active route revalidations)
  let matchingLinks = styleLinks.filter(
    (link) =>
      (!link.media || window.matchMedia(link.media).matches) &&
      !document.querySelector(`link[rel="stylesheet"][href="${link.href}"]`)
  );

  await Promise.all(matchingLinks.map(prefetchStyleLink));
}

async function prefetchStyleLink(
  descriptor: HtmlLinkDescriptor
): Promise<void> {
  return new Promise((resolve) => {
    let link = document.createElement("link");
    Object.assign(link, descriptor);

    function removeLink() {
      // if a navigation interrupts this prefetch React will update the <head>
      // and remove the link we put in there manually, so we check if it's still
      // there before trying to remove it
      if (document.head.contains(link)) {
        document.head.removeChild(link);
      }
    }

    link.onload = () => {
      removeLink();
      resolve();
    };

    link.onerror = () => {
      removeLink();
      resolve();
    };

    document.head.appendChild(link);
  });
}

////////////////////////////////////////////////////////////////////////////////
export function isPageLinkDescriptor(
  object: any
): object is PrefetchPageDescriptor {
  return object != null && typeof object.page === "string";
}

function isHtmlLinkDescriptor(object: any): object is HtmlLinkDescriptor {
  if (object == null) {
    return false;
  }

  // <link> may not have an href if <link rel="preload"> is used with imageSrcSet + imageSizes
  // https://github.com/remix-run/remix/issues/184
  // https://html.spec.whatwg.org/commit-snapshots/cb4f5ff75de5f4cbd7013c4abad02f21c77d4d1c/#attr-link-imagesrcset
  if (object.href == null) {
    return (
      object.rel === "preload" &&
      typeof object.imageSrcSet === "string" &&
      typeof object.imageSizes === "string"
    );
  }

  return typeof object.rel === "string" && typeof object.href === "string";
}

export type KeyedHtmlLinkDescriptor = { key: string; link: HtmlLinkDescriptor };

export async function getKeyedPrefetchLinks(
  matches: AgnosticDataRouteMatch[],
  manifest: AssetsManifest,
  routeModules: RouteModules
): Promise<KeyedHtmlLinkDescriptor[]> {
  let links = await Promise.all(
    matches.map(async (match) => {
      let mod = await loadRouteModule(
        manifest.routes[match.route.id],
        routeModules
      );
      return mod.links ? mod.links() : [];
    })
  );

  return dedupeLinkDescriptors(
    links
      .flat(1)
      .filter(isHtmlLinkDescriptor)
      .filter((link) => link.rel === "stylesheet" || link.rel === "preload")
      .map((link) =>
        link.rel === "stylesheet"
          ? ({ ...link, rel: "prefetch", as: "style" } as HtmlLinkDescriptor)
          : ({ ...link, rel: "prefetch" } as HtmlLinkDescriptor)
      )
  );
}

// This is ridiculously identical to transition.ts `filterMatchesToLoad`
export function getNewMatchesForLinks(
  page: string,
  nextMatches: AgnosticDataRouteMatch[],
  currentMatches: AgnosticDataRouteMatch[],
  manifest: AssetsManifest,
  location: Location,
  mode: "data" | "assets"
): AgnosticDataRouteMatch[] {
  let path = parsePathPatch(page);

  let isNew = (match: AgnosticDataRouteMatch, index: number) => {
    if (!currentMatches[index]) return true;
    return match.route.id !== currentMatches[index].route.id;
  };

  let matchPathChanged = (match: AgnosticDataRouteMatch, index: number) => {
    return (
      // param change, /users/123 -> /users/456
      currentMatches[index].pathname !== match.pathname ||
      // splat param changed, which is not present in match.path
      // e.g. /files/images/avatar.jpg -> files/finances.xls
      (currentMatches[index].route.path?.endsWith("*") &&
        currentMatches[index].params["*"] !== match.params["*"])
    );
  };

  // NOTE: keep this mostly up-to-date w/ the transition data diff, but this
  // version doesn't care about submissions
  let newMatches =
    mode === "data" && location.search !== path.search
      ? // this is really similar to stuff in transition.ts, maybe somebody smarter
        // than me (or in less of a hurry) can share some of it. You're the best.
        nextMatches.filter((match, index) => {
          let manifestRoute = manifest.routes[match.route.id];
          if (!manifestRoute.hasLoader) {
            return false;
          }

          if (isNew(match, index) || matchPathChanged(match, index)) {
            return true;
          }

          if (match.route.shouldRevalidate) {
            let routeChoice = match.route.shouldRevalidate({
              currentUrl: new URL(
                location.pathname + location.search + location.hash,
                window.origin
              ),
              currentParams: currentMatches[0]?.params || {},
              nextUrl: new URL(page, window.origin),
              nextParams: match.params,
              defaultShouldRevalidate: true,
            });
            if (typeof routeChoice === "boolean") {
              return routeChoice;
            }
          }
          return true;
        })
      : nextMatches.filter((match, index) => {
          let manifestRoute = manifest.routes[match.route.id];
          return (
            (mode === "assets" || manifestRoute.hasLoader) &&
            (isNew(match, index) || matchPathChanged(match, index))
          );
        });

  return newMatches;
}

export function getDataLinkHrefs(
  page: string,
  matches: AgnosticDataRouteMatch[],
  manifest: AssetsManifest
): string[] {
  let path = parsePathPatch(page);
  return dedupeHrefs(
    matches
      .filter((match) => manifest.routes[match.route.id].hasLoader)
      .map((match) => {
        let { pathname, search } = path;
        let searchParams = new URLSearchParams(search);
        searchParams.set("_data", match.route.id);
        return `${pathname}?${searchParams}`;
      })
  );
}

export function getModuleLinkHrefs(
  matches: AgnosticDataRouteMatch[],
  manifestPatch: AssetsManifest
): string[] {
  return dedupeHrefs(
    matches
      .map((match) => {
        let route = manifestPatch.routes[match.route.id];
        let hrefs = [route.module];
        if (route.imports) {
          hrefs = hrefs.concat(route.imports);
        }
        return hrefs;
      })
      .flat(1)
  );
}

// The `<Script>` will render rel=modulepreload for the current page, we don't
// need to include them in a page prefetch, this gives us the list to remove
// while deduping.
function getCurrentPageModulePreloadHrefs(
  matches: AgnosticDataRouteMatch[],
  manifest: AssetsManifest
): string[] {
  return dedupeHrefs(
    matches
      .map((match) => {
        let route = manifest.routes[match.route.id];
        let hrefs = [route.module];

        if (route.imports) {
          hrefs = hrefs.concat(route.imports);
        }

        return hrefs;
      })
      .flat(1)
  );
}

function dedupeHrefs(hrefs: string[]): string[] {
  return [...new Set(hrefs)];
}

function sortKeys<Obj extends { [Key in keyof Obj]: Obj[Key] }>(obj: Obj): Obj {
  let sorted = {} as Obj;
  let keys = Object.keys(obj).sort();

  for (let key of keys) {
    sorted[key as keyof Obj] = obj[key as keyof Obj];
  }

  return sorted;
}

type KeyedLinkDescriptor<Descriptor extends LinkDescriptor = LinkDescriptor> = {
  key: string;
  link: Descriptor;
};

function dedupeLinkDescriptors<Descriptor extends LinkDescriptor>(
  descriptors: Descriptor[],
  preloads?: string[]
): KeyedLinkDescriptor<Descriptor>[] {
  let set = new Set();
  let preloadsSet = new Set(preloads);

  return descriptors.reduce((deduped, descriptor) => {
    let alreadyModulePreload =
      preloads &&
      !isPageLinkDescriptor(descriptor) &&
      descriptor.as === "script" &&
      descriptor.href &&
      preloadsSet.has(descriptor.href);

    if (alreadyModulePreload) {
      return deduped;
    }

    let key = JSON.stringify(sortKeys(descriptor));
    if (!set.has(key)) {
      set.add(key);
      deduped.push({ key, link: descriptor });
    }

    return deduped;
  }, [] as KeyedLinkDescriptor<Descriptor>[]);
}

// https://github.com/remix-run/history/issues/897
function parsePathPatch(href: string) {
  let path = parsePath(href);
  if (path.search === undefined) path.search = "";
  return path;
}

// Detect if this browser supports <link rel="preload"> (or has it enabled).
// Originally added to handle the firefox `network.preload` config:
//   https://bugzilla.mozilla.org/show_bug.cgi?id=1847811
let _isPreloadSupported: boolean | undefined;
function isPreloadSupported(): boolean {
  if (_isPreloadSupported !== undefined) {
    return _isPreloadSupported;
  }
  let el: HTMLLinkElement | null = document.createElement("link");
  _isPreloadSupported = el.relList.supports("preload");
  el = null;
  return _isPreloadSupported;
}
