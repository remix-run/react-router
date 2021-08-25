// TODO: Once node v16 is available on AWS we should use the globally provided
// webcrypto "crypto" variable and re-enable this code-path in "./cookies.ts"
// instead of referencing the sign and unsign globals.

// const encoder = new TextEncoder();

// export async function sign(value: string, secret: string): Promise<string> {
//   let key = await crypto.subtle.importKey(
//     "raw",
//     encoder.encode(secret),
//     { name: "HMAC", hash: "SHA-256" },
//     false,
//     ["sign"]
//   );

//   let data = encoder.encode(value);
//   let signature = await crypto.subtle.sign("HMAC", key, data);
//   let hash = btoa(String.fromCharCode(...new Uint8Array(signature))).replace(
//     /=+$/,
//     ""
//   );

//   return value + "." + hash;
// }

// export async function unsign(
//   cookie: string,
//   secret: string
// ): Promise<string | false> {
//   let key = await crypto.subtle.importKey(
//     "raw",
//     encoder.encode(secret),
//     { name: "HMAC", hash: "SHA-256" },
//     false,
//     ["verify"]
//   );

//   let value = cookie.slice(0, cookie.lastIndexOf("."));
//   let hash = cookie.slice(cookie.lastIndexOf(".") + 1);

//   let data = encoder.encode(value);
//   let signature = byteStringToUint8Array(atob(hash));
//   let valid = await crypto.subtle.verify("HMAC", key, signature, data);

//   return valid ? value : false;
// }

// function byteStringToUint8Array(byteString: string): Uint8Array {
//   let array = new Uint8Array(byteString.length);

//   for (let i = 0; i < byteString.length; i++) {
//     array[i] = byteString.charCodeAt(i);
//   }

//   return array;
// }
