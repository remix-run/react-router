const execSync = require("child_process").execSync;

const exec = (command, extraEnv) =>
  execSync(command, {
    stdio: "inherit",
    env: Object.assign({}, process.env, extraEnv)
  });

console.log("Testing source files");

exec("jest", {
  TEST_ENV: "source"
});

console.log("Testing commonjs build");

exec("jest", {
  TEST_ENV: "cjs"
});

console.log("Testing UMD build");

exec("jest", {
  TEST_ENV: "umd"
});
