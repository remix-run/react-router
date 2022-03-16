import chalk from "chalk";

// https://no-color.org/
export const useColor = !process.env.NO_COLOR;

const K = (x: any) => x;

export const heading = useColor ? chalk.underline : K;
export const arg = useColor ? chalk.yellowBright : K;
export const error = useColor ? chalk.red : K;
export const warning = useColor ? chalk.yellow : K;

export const logoBlue = useColor ? chalk.blueBright : K;
export const logoGreen = useColor ? chalk.greenBright : K;
export const logoYellow = useColor ? chalk.yellowBright : K;
export const logoPink = useColor ? chalk.magentaBright : K;
export const logoRed = useColor ? chalk.redBright : K;
