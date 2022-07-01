import { cli, CliError } from "./index";

cli.run().then(
  () => {
    process.exit(0);
  },
  (error: unknown) => {
    // for expected errors we only show the message (if any), no stack trace
    if (error instanceof CliError) error = error.message;
    if (error) console.error(error);
    process.exit(1);
  }
);
