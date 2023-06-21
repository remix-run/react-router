import execa from "execa";
import pidtree from "pidtree";

let isWindows = process.platform === "win32";

export let kill = async (pid: number) => {
  try {
    let cmd = isWindows
      ? ["taskkill", "/F", "/PID", pid.toString()]
      : ["kill", "-9", pid.toString()];
    await execa(cmd[0], cmd.slice(1));
  } catch (error) {
    throw new Error(`Failed to kill process ${pid}: ${error}`);
  }
};

let isAlive = (pid: number) => {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return false;
  }
};

export let killtree = async (pid: number) => {
  let descendants = await pidtree(pid);
  let pids = [pid, ...descendants];

  await Promise.all(pids.map(kill));

  return new Promise<void>((resolve, reject) => {
    let check = setInterval(() => {
      let alive = pids.filter(isAlive);
      if (alive.length === 0) {
        clearInterval(check);
        resolve();
      }
    }, 50);

    setTimeout(() => {
      clearInterval(check);
      reject(
        new Error("Timeout: Processes did not exit within the specified time.")
      );
    }, 2000);
  });
};
