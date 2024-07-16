import { cli } from "./index";

cli.run().then(
  () => {
    process.exit(0);
  },
  (error: unknown) => {
    if (error) console.error(error);
    process.exit(1);
  }
);
