import WebSocket from "ws";

import type { AssetsManifest } from "./compiler/assets";
import type * as HMR from "./hmr";

type Message =
  | { type: "RELOAD" }
  | { type: "LOG"; message: string }
  | {
      type: "HMR";
      assetsManifest: AssetsManifest;
      updates: HMR.Update[];
    };

type Broadcast = (message: Message) => void;

export let serve = (options: { port: number }) => {
  let wss = new WebSocket.Server({ port: options.port });

  let broadcast: Broadcast = (message) => {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  };

  let reload = () => broadcast({ type: "RELOAD" });

  let log = (messageText: string) => {
    let _message = `💿 ${messageText}`;
    console.log(_message);
    broadcast({ type: "LOG", message: _message });
  };

  let hmr = (assetsManifest: AssetsManifest, updates: HMR.Update[]) => {
    broadcast({ type: "HMR", assetsManifest, updates });
  };

  return { reload, hmr, log, close: wss.close };
};
