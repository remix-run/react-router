export function throwIfPotentialCSRFAttack(
  headers: Headers,
  allowedActionOrigins: string[] | undefined,
) {
  let originHeader = headers.get("origin");
  let originDomain =
    typeof originHeader === "string" && originHeader !== "null"
      ? new URL(originHeader).host
      : originHeader;
  let host = parseHostHeader(headers);

  if (originDomain && (!host || originDomain !== host.value)) {
    if (!isAllowedOrigin(originDomain, allowedActionOrigins)) {
      if (host) {
        // This seems to be an CSRF attack. We should not proceed with the action.
        throw new Error(
          `${host.type} header does not match \`origin\` header from a forwarded Server Actions request. Aborting the action.`,
        );
      } else {
        // This is an attack. We should not proceed with the action.
        throw new Error(
          "`x-forwarded-host` or `host` headers are not provided. One of these is needed to compare the `origin` header from a forwarded Server Actions request. Aborting the action.",
        );
      }
    }
  }
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

  // Prevent wildcards from matching entire domains (e.g. '**' or '*.com')
  // This ensures wildcards can only match subdomains, not the main domain
  if (
    patternParts.length === 1 &&
    (patternParts[0] === "*" || patternParts[0] === "**")
  ) {
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

function parseHostHeader(headers: Headers) {
  let forwardedHostHeader = headers.get("x-forwarded-host");
  let forwardedHostValue = forwardedHostHeader?.split(",")[0]?.trim();
  let hostHeader = headers.get("host");

  return forwardedHostValue
    ? {
        type: "x-forwarded-host",
        value: forwardedHostValue,
      }
    : hostHeader
      ? {
          type: "host",
          value: hostHeader,
        }
      : undefined;
}
