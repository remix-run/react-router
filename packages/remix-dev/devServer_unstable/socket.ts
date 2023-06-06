import WebSocket from "ws";
import type { Server as HTTPServer } from "http";

import { type Manifest } from "../manifest";
import type * as HMR from "./hmr";

type Message =
  | { type: "RELOAD" }
  | { type: "LOG"; message: string }
  | {
      type: "HMR";
      assetsManifest: Manifest;
      updates: HMR.Update[];
    };

type Broadcast = (message: Message) => void;

export let serve = (server: HTTPServer) => {
  let wss = new WebSocket.Server({ server });

  let broadcast: Broadcast = (message) => {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  };

  let log = (messageText: string) => {
    let _message = `💿 ${messageText}`;
    console.log(_message);
    broadcast({ type: "LOG", message: _message });
  };

  let reload = () => broadcast({ type: "RELOAD" });

  let hmr = (assetsManifest: Manifest, updates: HMR.Update[]) => {
    broadcast({ type: "HMR", assetsManifest, updates });
  };

  return { log, reload, hmr, close: wss.close };
};
