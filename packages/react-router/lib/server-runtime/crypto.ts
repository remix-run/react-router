const encoder = /* @__PURE__ */ new TextEncoder();

export const sign = async (value: string, secret: string): Promise<string> => {
  let data = encoder.encode(value);
  let key = await createKey(secret, ["sign"]);
  let signature = await crypto.subtle.sign("HMAC", key, data);
  let hash = btoa(String.fromCharCode(...new Uint8Array(signature))).replace(
    /=+$/,
    ""
  );

  return value + "." + hash;
};

export const unsign = async (
  cookie: string,
  secret: string
): Promise<string | false> => {
  let index = cookie.lastIndexOf(".");
  let value = cookie.slice(0, index);
  let hash = cookie.slice(index + 1);

  let data = encoder.encode(value);

  let key = await createKey(secret, ["verify"]);
  try {
    let signature = byteStringToUint8Array(atob(hash));
    let valid = await crypto.subtle.verify("HMAC", key, signature, data);

    return valid ? value : false;
  } catch (error: unknown) {
    // atob will throw a DOMException with name === 'InvalidCharacterValue'
    // if the signature contains a non-base64 character, which should just
    // be treated as an invalid signature.
    return false;
  }
};

const createKey = async (
  secret: string,
  usages: CryptoKey["usages"]
): Promise<CryptoKey> =>
  crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    usages
  );

function byteStringToUint8Array(byteString: string): Uint8Array {
  let array = new Uint8Array(byteString.length);

  for (let i = 0; i < byteString.length; i++) {
    array[i] = byteString.charCodeAt(i);
  }

  return array;
}
