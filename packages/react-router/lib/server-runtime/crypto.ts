export type SignFunction = (value: string, secret: string) => Promise<string>;

export type UnsignFunction = (
  cookie: string,
  secret: string
) => Promise<string | false>;

// TODO: Once Node v19 is supported we should use the globally provided
// Web Crypto API's and re-enable this code-path in "./cookies.ts"
// instead of referencing the `sign` and `unsign` globals.

// const encoder = new TextEncoder();

// export const sign: SignFunction = async (
//   value: string,
//   secret: string
// ): Promise<string> => {
//   let data = encoder.encode(value);
//   let key = await createKey(secret, ["sign"]);
//   let signature = await crypto.subtle.sign("HMAC", key, data);
//   let hash = btoa(String.fromCharCode(...new Uint8Array(signature))).replace(
//     /=+$/,
//     ""
//   );

//   return value + "." + hash;
// };

// export const unsign: UnsignFunction = async (
//   cookie: string,
//   secret: string
// ): Promise<string | false> => {
//   let value = cookie.slice(0, cookie.lastIndexOf("."));
//   let hash = cookie.slice(cookie.lastIndexOf(".") + 1);

//   let data = encoder.encode(value);
//   let key = await createKey(secret, ["verify"]);
//   let signature = byteStringToUint8Array(atob(hash));
//   let valid = await crypto.subtle.verify("HMAC", key, signature, data);

//   return valid ? value : false;
// };

// const createKey = async (
//   secret: string,
//   usages: CryptoKey["usages"]
// ): Promise<CryptoKey> =>
//   crypto.subtle.importKey(
//     "raw",
//     encoder.encode(secret),
//     { name: "HMAC", hash: "SHA-256" },
//     false,
//     usages
//   );

// const byteStringToUint8Array = (byteString: string): Uint8Array => {
//   let array = new Uint8Array(byteString.length);

//   for (let i = 0; i < byteString.length; i++) {
//     array[i] = byteString.charCodeAt(i);
//   }

//   return array;
// };
