// Adapted from https://github.com/withastro/cli-kit
// MIT License Copyright (c) 2022 Nate Moore
import process from "node:process";
import readline from "node:readline";
import { erase, cursor } from "sisteransi";

import { reverse, sleep, color } from "./utils";

const GRADIENT_COLORS: Array<`#${string}`> = [
  "#ffffff",
  "#dadada",
  "#dadada",
  "#a8deaa",
  "#a8deaa",
  "#a8deaa",
  "#d0f0bd",
  "#d0f0bd",
  "#ffffed",
  "#ffffed",
  "#ffffed",
  "#ffffed",
  "#ffffed",
  "#ffffed",
  "#ffffed",
  "#ffffed",
  "#ffffed",
  "#f7f8ca",
  "#f7f8ca",
  "#eae6ba",
  "#eae6ba",
  "#eae6ba",
  "#dadada",
  "#dadada",
  "#ffffff",
];

const MAX_FRAMES = 8;

const LEADING_FRAMES = Array.from(
  { length: MAX_FRAMES * 2 },
  () => GRADIENT_COLORS[0]
);
const TRAILING_FRAMES = Array.from(
  { length: MAX_FRAMES * 2 },
  () => GRADIENT_COLORS[GRADIENT_COLORS.length - 1]
);
const INDICATOR_FULL_FRAMES = [
  ...LEADING_FRAMES,
  ...GRADIENT_COLORS,
  ...TRAILING_FRAMES,
  ...reverse(GRADIENT_COLORS),
];
const INDICATOR_GRADIENT = reverse(
  INDICATOR_FULL_FRAMES.map((_, i) => loadingIndicatorFrame(i))
);

export async function renderLoadingIndicator({
  start,
  end,
  while: update = () => sleep(100),
  noMotion = false,
  stdin = process.stdin,
  stdout = process.stdout,
}: {
  start: string;
  end: string;
  while: (...args: any) => Promise<any>;
  noMotion?: boolean;
  stdin?: NodeJS.ReadStream & { fd: 0 };
  stdout?: NodeJS.WriteStream & { fd: 1 };
}) {
  let act = update();
  let tooSlow = Object.create(null);
  let result = await Promise.race([sleep(500).then(() => tooSlow), act]);
  if (result === tooSlow) {
    let loading = await gradient(color.green(start), {
      stdin,
      stdout,
      noMotion,
    });
    await act;
    loading.stop();
  }
  stdout.write(`${" ".repeat(5)} ${color.green("✔")}  ${color.green(end)}\n`);
}

function loadingIndicatorFrame(offset = 0) {
  let frames = INDICATOR_FULL_FRAMES.slice(offset, offset + (MAX_FRAMES - 2));
  if (frames.length < MAX_FRAMES - 2) {
    let filled = new Array(MAX_FRAMES - frames.length - 2).fill(
      GRADIENT_COLORS[0]
    );
    frames.push(...filled);
  }
  return frames;
}

function getGradientAnimationFrames() {
  return INDICATOR_GRADIENT.map(
    (colors) => " " + colors.map((g, i) => color.hex(g)("█")).join("")
  );
}

async function gradient(
  text: string,
  { stdin = process.stdin, stdout = process.stdout, noMotion = false } = {}
) {
  let { createLogUpdate } = await import("log-update");
  let logUpdate = createLogUpdate(stdout);
  let frameIndex = 0;
  let frames = getGradientAnimationFrames();
  let interval: NodeJS.Timeout;
  let rl = readline.createInterface({ input: stdin, escapeCodeTimeout: 50 });
  readline.emitKeypressEvents(stdin, rl);

  if (stdin.isTTY) stdin.setRawMode(true);
  function keypress(char: string) {
    if (char === "\x03") {
      loadingIndicator.stop();
      process.exit(0);
    }
    if (stdin.isTTY) stdin.setRawMode(true);
    stdout.write(cursor.hide + erase.lines(1));
  }

  let done = false;
  let loadingIndicator = {
    start() {
      stdout.write(cursor.hide);
      stdin.on("keypress", keypress);
      logUpdate(`${frames[0]}  ${text}`);

      async function loop() {
        if (done) return;
        if (frameIndex < frames.length - 1) {
          frameIndex++;
        } else {
          frameIndex = 0;
        }
        let frame = frames[frameIndex];
        logUpdate(
          `${(noMotion
            ? getMotionlessFrame(frameIndex)
            : color.supportsColor
            ? frame
            : getColorlessFrame(frameIndex)
          ).padEnd(MAX_FRAMES - 1, " ")}  ${text}`
        );
        if (!done) await sleep(20);
        loop();
      }

      loop();
    },
    stop() {
      done = true;
      stdin.removeListener("keypress", keypress);
      clearInterval(interval);
      logUpdate.clear();
      rl.close();
    },
  };
  loadingIndicator.start();
  return loadingIndicator;
}

function getColorlessFrame(frameIndex: number) {
  return (
    frameIndex % 3 === 0 ? ".. .. " : frameIndex % 3 === 1 ? " .. .." : ". .. ."
  ).padEnd(MAX_FRAMES - 1 + 20, " ");
}

function getMotionlessFrame(frameIndex: number) {
  return " ".repeat(MAX_FRAMES - 1);
}
