import { execSync } from "node:child_process";
import { parseArgs } from "node:util";

const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

const ignoredIssues = new Set([9991, 12570, 13607, 13659, 11940]);

const { values: args } = parseArgs({
  options: {
    dryRun: {
      type: "boolean",
      default: false,
    },
  },
  strict: true,
});

run();

async function run() {
  let issuesCmd = `gh issue list --search "is:issue state:open label:bug sort:created-asc" --limit 250 --json number,body`;
  console.log(`Executing command: ${issuesCmd}`);
  let result = execSync(issuesCmd).toString();
  let allIssues = JSON.parse(result) as { number: number; body: string }[];
  let noReproIssues = allIssues.filter(({ number, body }) => {
    return (
      !ignoredIssues.has(number) &&
      !/https?:\/\/stackblitz\.com\//.test(body) &&
      !/https?:\/\/codesandbox\.io\//.test(body) &&
      !/https?:\/\/github\.com\//.test(
        body
          // Remove uploaded image URLs and links to react router source code
          // and new issue links before looking for git repo reproductions
          .replace("https://github.com/user-attachments/", "")
          .replace("https://github.com/remix-run/react-router/", "")
      )
    );
  });

  console.log(
    `Found ${noReproIssues.length} issues without a reproduction:\n` +
      noReproIssues.map((i) => i.number).join(",")
  );

  for (let issue of noReproIssues) {
    console.log(`--- Processing issue #${issue.number} ---`);
    let commentCmd = `gh issue comment ${issue.number} -F ./scripts/close-no-repro-issues.md`;
    let commentResult = runCmdIfTokenExists(commentCmd);
    console.log(`Commented on issue #${issue.number}: ${commentResult}`);
    await sleep(250);

    let closeCmd = `gh issue close ${issue.number} -r "not planned"`;
    runCmdIfTokenExists(closeCmd);
    // No log here since the GH CLI already logs for issue close
    await sleep(250);
  }

  console.log("Done!");
}

function runCmdIfTokenExists(cmd: string) {
  if (args.dryRun) {
    console.log(`⚠️ Dry run, skipping command: ${cmd}`);
    return "<skipped>";
  }

  if (process.env.CI !== "true") {
    console.log(`⚠️ Local run without CI env var, skipping command: ${cmd}`);
    return "<skipped>";
  }

  return execSync(cmd).toString();
}
