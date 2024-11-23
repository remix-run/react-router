type Primitive = null | undefined | string | number | boolean | symbol | bigint;

type LiteralUnion<LiteralType, BaseType extends Primitive> =
  | LiteralType
  | (BaseType & Record<never, never>);

interface HtmlLinkProps {
  /**
   * Address of the hyperlink
   */
  href?: string | undefined;

  /**
   * How the element handles crossorigin requests
   */
  crossOrigin?: "anonymous" | "use-credentials" | undefined;

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
  media?: string | undefined;

  /**
   * Integrity metadata used in Subresource Integrity checks
   */
  integrity?: string | undefined;

  /**
   * Language of the linked resource
   */
  hrefLang?: string | undefined;

  /**
   * Hint for the type of the referenced resource
   */
  type?: string | undefined;

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
    | "unsafe-url"
    | undefined;

  /**
   * Sizes of the icons (for rel="icon")
   */
  sizes?: string | undefined;

  /**
   * Potential destination for a preload request (for rel="preload" and rel="modulepreload")
   */
  as?:
    | LiteralUnion<
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
      >
    | undefined;

  /**
   * Color to use when customizing a site's icon (for rel="mask-icon")
   */
  color?: string | undefined;

  /**
   * Whether the link is disabled
   */
  disabled?: boolean | undefined;

  /**
   * The title attribute has special semantics on this element: Title of the link; CSS style sheet set name.
   */
  title?: string | undefined;

  /**
   * Images to use in different situations, e.g., high-resolution displays,
   * small monitors, etc. (for rel="preload")
   */
  imageSrcSet?: string | undefined;

  /**
   * Image sizes for different page layouts (for rel="preload")
   */
  imageSizes?: string | undefined;
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
  href?: string | undefined;

  /**
   * Images to use in different situations, e.g., high-resolution displays,
   * small monitors, etc. (for rel="preload")
   */
  imageSrcSet: string;

  /**
   * Image sizes for different page layouts (for rel="preload")
   */
  imageSizes?: string | undefined;
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
      Pick<Required<HtmlLinkPreloadImage>, "href"> & {
        imageSizes?: never | undefined;
      });

export interface PageLinkDescriptor
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

export type LinkDescriptor = HtmlLinkDescriptor | PageLinkDescriptor;
