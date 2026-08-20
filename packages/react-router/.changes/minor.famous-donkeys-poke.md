Add an `unstable_v9_createCookie` utility that exposes the `@remix-run/cookie` string cookie implementation

- Migrate an existing cookie by reading it with `createCookie` and writing it back with `unstable_v9_createCookie`:

  ```ts
  import { createCookie, unstable_v9_createCookie } from "react-router";

  let cookieHeader = request.headers.get("Cookie");
  let oldPrefs = createCookie("prefs", oldOptions);
  let newPrefs = unstable_v9_createCookie("prefs", {
    ...newOptions,
    encode: encodeURIComponent,
    decode: decodeURIComponent,
  });
  let prefsMigrated = unstable_v9_createCookie("prefs_v9", {
    encode: encodeURIComponent,
    decode: decodeURIComponent,
  });

  let alreadyMigrated = await prefsMigrated.parse(cookieHeader);

  if (alreadyMigrated !== "true") {
    let value = await oldPrefs.parse(cookieHeader);

    if (value !== null) {
      headers.append(
        "Set-Cookie",
        await newPrefs.serialize(JSON.stringify(value)),
      );
      headers.append("Set-Cookie", await prefsMigrated.serialize("true"));
    }
  }
  ```

- Use a marker to identify migrated cookies because a v9 cookie value may still parse with the v8 `createCookie` parser. If the `prefs` value is an object and can change shape, the marker can live in the migrated value instead, such as `{ ...prefs, prefs_v9: true }`

- Use `unstable_v9_createCookie` directly with a v8-compatible wire format by providing a custom codec that matches the v8 JSON + UTF-8 base64 encoding. This works for unsigned cookies and signed cookies when the same `secrets` are used:

  ```ts
  function encodeUtf8Base64(value: string): string {
    return btoa(
      Array.from(new TextEncoder().encode(value), (byte) =>
        String.fromCharCode(byte),
      ).join(""),
    );
  }

  function decodeUtf8Base64(value: string): string {
    let binary = atob(decodeURIComponent(value));
    return new TextDecoder().decode(
      Uint8Array.from(binary, (char) => char.charCodeAt(0)),
    );
  }

  function decodeCookieHeaderValues(cookieHeader: string | null): string | null {
    if (cookieHeader == null) return null;

    return cookieHeader
      .split(/;\s*/)
      .map((cookie) => {
        let separator = cookie.indexOf("=");
        if (separator === -1) return cookie;
        return [
          cookie.slice(0, separator),
          decodeURIComponent(cookie.slice(separator + 1)),
        ].join("=");
      })
      .join("; ");
  }
  ```

  String values need the codec to include v8's `JSON.stringify` step:

  ```ts
  let prefs = unstable_v9_createCookie("prefs", {
    secrets,
    encode(value) {
      return encodeUtf8Base64(JSON.stringify(value));
    },
    decode(value) {
      return JSON.parse(decodeUtf8Base64(value));
    },
  });

  let value = await prefs.parse(
    decodeCookieHeaderValues(request.headers.get("Cookie")),
  );

  headers.append("Set-Cookie", await prefs.serialize("dark"));
  ```

  Object values can stringify at the API boundary and use the raw JSON-string codec:

  ```ts
  let prefs = unstable_v9_createCookie("prefs", {
    secrets,
    encode: encodeUtf8Base64,
    decode: decodeUtf8Base64,
  });

  let value = await prefs.parse(
    decodeCookieHeaderValues(request.headers.get("Cookie")),
  );
  let parsed = value == null ? null : JSON.parse(value);

  headers.append(
    "Set-Cookie",
    await prefs.serialize(JSON.stringify({ theme: "dark" })),
  );
  ```
