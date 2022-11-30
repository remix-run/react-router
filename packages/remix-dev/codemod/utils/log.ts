import { gray, red } from "../../colors";

export const info = (message: string) => console.info(gray(message));
export const error = (message: string) => console.error(red(message));
