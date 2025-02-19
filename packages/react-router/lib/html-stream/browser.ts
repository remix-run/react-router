declare global {
  interface Window {
    __FLIGHT_DATA: any[];
  }
}

let encoder = new TextEncoder();
let streamController: ReadableStreamDefaultController<Uint8Array> | null = null;
export let rscStream = new ReadableStream({
  start(controller) {
    if (typeof window === "undefined") {
      return;
    }
    let handleChunk = (chunk: string) => {
      if (typeof chunk === "string") {
        controller.enqueue(encoder.encode(chunk));
      } else {
        controller.enqueue(chunk);
      }
    };
    window.__FLIGHT_DATA ||= [];
    window.__FLIGHT_DATA.forEach(handleChunk);
    window.__FLIGHT_DATA.push = (chunk) => {
      handleChunk(chunk);
      return 0;
    };
    streamController = controller;
  },
});

if (typeof document !== "undefined" && document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    streamController?.close();
  });
} else {
  (streamController as any)?.close();
}
