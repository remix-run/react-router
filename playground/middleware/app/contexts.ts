import { unstable_createContext } from "react-router";

export const expressContext = unstable_createContext<string>("default");
export const rootContext = unstable_createContext<string>();
export const aContext = unstable_createContext<string>();
export const bContext = unstable_createContext<string>("empty");
