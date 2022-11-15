import chalk from "chalk";

// https://no-color.org/
const useColor = chalk.supportsColor && !process.env.NO_COLOR;

const identity = <T>(x: T) => x;
const safe = (style: chalk.Chalk) => (useColor ? style : identity);

export const heading = safe(chalk.underline);
export const arg = safe(chalk.yellowBright);
export const error = safe(chalk.red);
export const warning = safe(chalk.yellow);
export const hint = safe(chalk.blue);

export const logoBlue = safe(chalk.blueBright);
export const logoGreen = safe(chalk.greenBright);
export const logoYellow = safe(chalk.yellowBright);
export const logoPink = safe(chalk.magentaBright);
export const logoRed = safe(chalk.redBright);

// raw styles
export const bold = safe(chalk.bold);

// raw colors
export const blue = safe(chalk.blue);
export const cyan = safe(chalk.cyan);
export const gray = safe(chalk.gray);
export const red = safe(chalk.red);
export const yellow = safe(chalk.yellow);
