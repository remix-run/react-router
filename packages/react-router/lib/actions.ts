/**
 * Arguments passed to {@link ValidateActionOriginFunction}.
 */
export interface ValidateActionOriginArgs {
  /**
   * The incoming action [`Request`](https://developer.mozilla.org/en-US/docs/Web/API/Request).
   * Don't read its body, the action still needs it. For single fetch
   * submissions, its URL is the `.data` URL.
   */
  request: Request;
  /**
   * The raw `Origin` header of the request, or `null` when it is absent.
   */
  origin: string | null;
  /**
   * Whether React Router's built-in check accepts the request: the `Origin`
   * header is absent, matches the origin of `request.url`, or its host is
   * listed in `allowedActionOrigins`.
   */
  allowed: boolean;
}

/**
 * Decides whether an action submission may run. Return `true` to run the
 * action, anything else rejects it with a `400 Bad Request`.
 */
export interface ValidateActionOriginFunction {
  (args: ValidateActionOriginArgs): boolean | Promise<boolean>;
}

export function throwIfPotentialCSRFAttack(
  request: Request,
  allowedActionOrigins: string[] | undefined,
) {
  if (!isActionOriginAllowed(request, allowedActionOrigins)) {
    // This seems to be an CSRF attack. We should not proceed with the action.
    throw new Error(
      "The `request.url` origin does not match `origin` header from a forwarded " +
        "action request. Aborting the action.",
    );
  }
}

export async function validateActionOrigin(
  request: Request,
  allowedActionOrigins: string[] | false | undefined,
  validate: ValidateActionOriginFunction | undefined,
) {
  let origins = Array.isArray(allowedActionOrigins)
    ? allowedActionOrigins
    : undefined;
  if (!validate) {
    throwIfPotentialCSRFAttack(request, origins);
    return;
  }

  // A malformed `Origin` header throws here, before the app's function sees it
  let allowed = isActionOriginAllowed(request, origins);
  let origin = request.headers.get("origin");

  if ((await validate({ request, origin, allowed })) !== true) {
    throw new Error(
      "The action origin was rejected by `unstable_validateActionOrigin`. " +
        "Aborting the action.",
    );
  }
}

function isActionOriginAllowed(
  request: Request,
  allowedActionOrigins: string[] | undefined,
): boolean {
  let originHeader = request.headers.get("origin");
  let originDomain: string | null = null;
  let originUrl: URL | null = null;

  try {
    if (typeof originHeader === "string" && originHeader !== "null") {
      originUrl = new URL(originHeader);
      originDomain = originUrl.host;
    } else {
      originDomain = originHeader;
    }
  } catch {
    throw new Error(
      `\`origin\` header is not a valid URL. Aborting the action.`,
    );
  }
  let requestUrl = new URL(request.url);
  let originMatchesRequest = originUrl
    ? originUrl.origin === requestUrl.origin
    : originDomain === requestUrl.host;

  return (
    !originDomain ||
    originMatchesRequest ||
    isAllowedOrigin(originDomain, allowedActionOrigins)
  );
}

// Implementation of micromatch by Next.js https://github.com/vercel/next.js/blob/ea927b583d24f42e538001bf13370e38c91d17bf/packages/next/src/server/app-render/csrf-protection.ts#L6
function matchWildcardDomain(domain: string, pattern: string) {
  const domainParts = domain.split(".");
  const patternParts = pattern.split(".");

  if (patternParts.length < 1) {
    // pattern is empty and therefore invalid to match against
    return false;
  }

  if (domainParts.length < patternParts.length) {
    // domain has too few segments and thus cannot match
    return false;
  }

  while (patternParts.length) {
    const patternPart = patternParts.pop();
    const domainPart = domainParts.pop();

    switch (patternPart) {
      case "": {
        // invalid pattern. pattern segments must be non empty
        return false;
      }
      case "*": {
        // wildcard matches anything so we continue if the domain part is non-empty
        if (domainPart) {
          continue;
        } else {
          return false;
        }
      }
      case "**": {
        // if this is not the last item in the pattern the pattern is invalid
        if (patternParts.length > 0) {
          return false;
        }
        // recursive wildcard matches anything so we terminate here if the domain part is non empty
        return domainPart !== undefined;
      }
      case undefined:
      default: {
        if (domainPart !== patternPart) {
          return false;
        }
      }
    }
  }

  // We exhausted the pattern. If we also exhausted the domain we have a match
  return domainParts.length === 0;
}

function isAllowedOrigin(
  originDomain: string,
  allowedActionOrigins: string[] | undefined = [],
) {
  return allowedActionOrigins.some(
    (allowedOrigin) =>
      allowedOrigin &&
      (allowedOrigin === originDomain ||
        matchWildcardDomain(originDomain, allowedOrigin)),
  );
}
