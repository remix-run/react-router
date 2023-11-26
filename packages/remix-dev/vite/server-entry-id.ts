// This file allows us to export the module ID without forcing non-Vite
// consumers to inadvertently import the Vite plugin and all of its dependencies
import * as VirtualModule from "./vmod";

export const serverEntryId = VirtualModule.id("server-entry");
