import router from "./router";

// This function is used to navigate without React Context
export function navigateWithoutReactContext(path: string) {
  router.navigate(path);
}
