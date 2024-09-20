import type ts from "typescript/lib/tsserverlibrary";

import { getAutotypeLanguageService } from "./language-service";
import { type Context } from "../context";

export const getQuickInfoAtPosition =
  (ctx: Context): ts.LanguageService["getQuickInfoAtPosition"] =>
  (fileName, position) => {
    const autotype = getAutotypeLanguageService(ctx);
    const route = autotype.getRoute(fileName);
    if (!route) return;

    const splicedIndex = route.autotyped.toSplicedIndex(position);
    const quickinfo = autotype.getQuickInfoAtPosition(fileName, splicedIndex);
    if (!quickinfo) return;

    return {
      ...quickinfo,
      textSpan: {
        ...quickinfo.textSpan,
        start: route.autotyped.toOriginalIndex(quickinfo.textSpan.start).index,
      },
    };
  };
