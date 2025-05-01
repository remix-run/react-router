const encoder = new TextEncoder();

export const sign = async (value: string, secret: string): Promise<string> => {
  const data = encoder.encode(value);
  const key = await createKey(secret, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, data);
  const hash = base64urlEncode(new Uint8Array(signature));
  return `${value}.${hash}`;
};

export const unsign = async (
  cookie: string,
  secret: string
): Promise<string | false> => {
  const index = cookie.lastIndexOf(".");
  if (index === -1) return false;

  const value = cookie.slice(0, index);
  const hash = cookie.slice(index + 1);
  const data = encoder.encode(value);

  const key = await createKey(secret, ["verify"]);
  const signature = base64urlDecode(hash);
  const valid = await crypto.subtle.verify("HMAC", key, signature, data);

  return valid ? value : false;
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

function base64urlEncode(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function base64urlDecode(str: string): Uint8Array {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  return byteStringToUint8Array(atob(str));
}

function byteStringToUint8Array(byteString: string): Uint8Array {
  const array = new Uint8Array(byteString.length);
  for (let i = 0; i < byteString.length; i++) {
    array[i] = byteString.charCodeAt(i);
  }
  return array;
}