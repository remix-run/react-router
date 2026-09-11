export type Span = [begin: number, end: number]

export type SplitResult = {
  protocol: Span | null
  hostname: Span | null
  port: Span | null
  pathname: Span | null
  search: Span | null
}

/**
 * Split a route pattern into protocol, hostname, port, pathname, and search
 * spans delimited as `protocol://hostname:port/pathname?search`.
 *
 * Delimiters are not included in the spans with the exception of the leading `/` for pathname.
 * Spans are [begin (inclusive), end (exclusive)].
 *
 * @param source the route pattern string to split
 * @returns an object containing spans for each URL component
 */
export function split(source: string): SplitResult {
  let result: SplitResult = {
    protocol: null,
    hostname: null,
    port: null,
    pathname: null,
    search: null,
  }

  let questionMarkIndex = source.indexOf('?')
  if (questionMarkIndex !== -1) {
    result.search = span(questionMarkIndex + 1, source.length)
    source = source.slice(0, questionMarkIndex)
  }

  let solidusIndex = source.indexOf('://')

  if (solidusIndex === -1) {
    result.pathname = pathnameSpan(source, 0, source.length)
    return result
  }

  let slashIndex = source.indexOf('/')
  if (slashIndex === solidusIndex + 1) {
    slashIndex = source.indexOf('/', solidusIndex + 3)
  }

  if (slashIndex === -1) {
    result.protocol = span(0, solidusIndex)
    let host = span(solidusIndex + 3, source.length)
    if (host) {
      let { hostname, port } = hostSpans(source, host)
      result.hostname = hostname
      result.port = port
    }
    return result
  }

  if (slashIndex < solidusIndex) {
    result.pathname = pathnameSpan(source, 0, source.length)
    return result
  }

  result.protocol = span(0, solidusIndex)
  let host = span(solidusIndex + 3, slashIndex)
  if (host) {
    let { hostname, port } = hostSpans(source, host)
    result.hostname = hostname
    result.port = port
  }
  result.pathname = pathnameSpan(source, slashIndex, source.length)
  return result
}

function span(start: number, end: number): Span | null {
  if (start === end) return null
  return [start, end]
}

function hostSpans(source: string, host: Span): { hostname: Span | null; port: Span | null } {
  let lastColonIndex = source.slice(0, host[1]).lastIndexOf(':')
  if (lastColonIndex === -1 || lastColonIndex < host[0]) return { hostname: host, port: null }

  if (source.slice(lastColonIndex + 1, host[1]).match(/^\d+$/)) {
    return { hostname: span(host[0], lastColonIndex), port: span(lastColonIndex + 1, host[1]) }
  }
  return { hostname: host, port: null }
}

function pathnameSpan(source: string, begin: number, end: number): Span | null {
  if (source[begin] === '/') begin += 1
  return span(begin, end)
}
