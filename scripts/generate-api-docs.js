import { execSync } from "child_process";

const packages = ["react-router", "react-router-dom", "react-router-native"];

execSync(
  `typedoc ${packages
    .map(pkg => `packages/${pkg}/index.tsx`)
    .join(" ")} --out docs/api --name "React Router"`,
  {
    env: process.env,
    stdio: "inherit"
  }
);
