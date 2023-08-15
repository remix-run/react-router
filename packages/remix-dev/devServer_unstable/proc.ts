import execa from "execa";
import pidtree from "pidtree";

let isWindows = process.platform === "win32";

export let kill = async (pid: number) => {
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
  let descendants = await pidtree(pid).catch(() => undefined);
  if (descendants === undefined) return;
  let pids = [pid, ...descendants];

  await Promise.all(pids.map(kill));

  return new Promise<void>((resolve, reject) => {
    let check = setInterval(() => {
      pids = pids.filter(isAlive);
      if (pids.length === 0) {
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
