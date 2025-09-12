import { createContext } from "react-router";

export const expressContext = createContext<string>("default");
export const rootContext = createContext<string>();
export const aContext = createContext<string>();
export const bContext = createContext<string>("empty");
