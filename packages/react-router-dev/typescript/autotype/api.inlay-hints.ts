import type ts from "typescript/lib/tsserverlibrary";

import { getAutotypeLanguageService } from "./language-service";
import { type Context } from "../context";

export const provideInlayHints =
  (ctx: Context): ts.LanguageService["provideInlayHints"] =>
  (fileName, span, preferences) => {
    const autotype = getAutotypeLanguageService(ctx);
    const route = autotype.getRoute(fileName);
    if (!route) return [];

    const start = route.autotyped.toSplicedIndex(span.start);
    return autotype
      .provideInlayHints(
        fileName,
        {
          start,
          length:
            route.autotyped.toSplicedIndex(span.start + span.length) - start,
        },
        preferences
      )
      .map((hint) => ({
        ...hint,
        position: route.autotyped.toOriginalIndex(hint.position).index,
      }));
  };
