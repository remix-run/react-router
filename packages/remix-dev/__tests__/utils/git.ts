import execa from "execa";

export const initialCommit = async (projectDir: string) => {
  let run = (cmd: string, args: string[]) =>
    execa(cmd, args, { cwd: projectDir });
  let commands = [
    ["init"],

    ["config", "user.name", '"github-actions[bot]"'],
    ["config", "user.email", '"github-actions[bot]@users.noreply.github.com"'],

    ["add", "."],
    ["commit", "--message", '"initial commit"'],
  ];
  for (let command of commands) {
    await run("git", command);
  }
};
