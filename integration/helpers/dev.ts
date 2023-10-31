import { spawn } from "node:child_process";
import type { Readable } from "node:stream";
import execa from "execa";
import getPort from "get-port";
import resolveBin from "resolve-bin";
import waitOn from "wait-on";

const isWindows = process.platform === "win32";

export async function viteDev(
  projectDir: string,
  options: { port?: number } = {}
) {
  let viteBin = resolveBin.sync("vite");
  return node(projectDir, [viteBin, "dev"], options);
}

export async function node(
  projectDir: string,
  command: string[],
  options: { port?: number } = {}
) {
  let nodeBin = process.argv[0];
  let proc = spawn(nodeBin, command, {
    cwd: projectDir,
    env: process.env,
    stdio: "pipe",
  });
  let devStdout = bufferize(proc.stdout);
  let devStderr = bufferize(proc.stderr);

  let port = options.port ?? (await getPort());
  await waitOn({
    resources: [`http://localhost:${port}/`],
    timeout: 10000,
  }).catch((err) => {
    let stdout = devStdout();
    let stderr = devStderr();
    throw new Error(
      [
        err.message,
        "",
        "exit code: " + proc.exitCode,
        "stdout: " + stdout ? `\n${stdout}\n` : "<empty>",
        "stderr: " + stderr ? `\n${stderr}\n` : "<empty>",
      ].join("\n")
    );
  });

  return { pid: proc.pid!, port: port };
}

export async function kill(pid: number) {
  if (!isAlive(pid)) return;
  if (isWindows) {
    await execa("taskkill", ["/F", "/PID", pid.toString()]).catch((error) => {
      // taskkill 128 -> the process is already dead
      if (error.exitCode === 128) return;
      if (/There is no running instance of the task./.test(error.message))
        return;
      console.warn(error.message);
    });
    return;
  }
  await execa("kill", ["-9", pid.toString()]).catch((error) => {
    // process is already dead
    if (/No such process/.test(error.message)) return;
    console.warn(error.message);
  });
}

// utils ------------------------------------------------------------

function bufferize(stream: Readable): () => string {
  let buffer = "";
  stream.on("data", (data) => (buffer += data.toString()));
  return () => buffer;
}

function isAlive(pid: number) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return false;
  }
}
