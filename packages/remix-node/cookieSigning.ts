import cookieSignature from "cookie-signature";

export async function sign(value: string, secret: string): Promise<string> {
  return cookieSignature.sign(value, secret);
}

export async function unsign(
  signed: string,
  secret: string
): Promise<string | false> {
  return cookieSignature.unsign(signed, secret);
}
