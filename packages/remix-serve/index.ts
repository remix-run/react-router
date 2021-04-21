import path from "path";
import getServer from "./app";

let port = process.env.PORT || 3000;

let buildPath = process.argv[2];
if (!buildPath) {
  console.log(
    `Please pass in the directory of your Remix server build directory:

    remix-serve ./build`
  );
} else {
  let resolovedBuildPath = path.resolve(process.cwd(), buildPath);
  getServer(resolovedBuildPath).listen(port, () => {
    console.log(`Remix App Server started on port ${port}`);
  });
}
