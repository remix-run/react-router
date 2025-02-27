import {
  createServerReference as createServerReferenceImp,
  // @ts-expect-error - no types yet
} from "@jacob-ebey/react-server-dom-vite/client";

export async function callServer(id: string, args: unknown) {
  throw new Error("callServer not implemented");
}

export function createServerReference(imp: unknown, id: string, name: string) {
  return createServerReferenceImp(`${id}#${name}`, callServer);
}
