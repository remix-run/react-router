import cookieSignature from "cookie-signature";
import type {
  SignFunction,
  UnsignFunction,
} from "@remix-run/server-runtime";

export const sign: SignFunction = async (value, secret) => {
  return cookieSignature.sign(value, secret);
};

export const unsign: UnsignFunction = async (
  signed: string,
  secret: string
) => {
  return cookieSignature.unsign(signed, secret);
};