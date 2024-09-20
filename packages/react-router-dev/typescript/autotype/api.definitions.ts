import type ts from "typescript/lib/tsserverlibrary";

import { getAutotypeLanguageService } from "./language-service";
import { type Context } from "../context";

export const getDefinitionAndBoundSpan =
  (ctx: Context): ts.LanguageService["getDefinitionAndBoundSpan"] =>
  (fileName, position) => {
    const autotype = getAutotypeLanguageService(ctx);
    const route = autotype.getRoute(fileName);
    if (!route) return;

    const splicedIndex = route.autotyped.toSplicedIndex(position);
    const result = autotype.getDefinitionAndBoundSpan(fileName, splicedIndex);
    if (!result) return;

    return {
      definitions: result.definitions?.map(remapSpans(autotype)),
      textSpan: {
        ...result.textSpan,
        start: route.autotyped.toOriginalIndex(result.textSpan.start).index,
      },
    };
  };

export const getTypeDefinitionAtPosition =
  (ctx: Context): ts.LanguageService["getTypeDefinitionAtPosition"] =>
  (fileName, position) => {
    const autotype = getAutotypeLanguageService(ctx);
    const route = autotype.getRoute(fileName);
    if (!route) return;

    const splicedIndex = route.autotyped.toSplicedIndex(position);
    const definitions = autotype.getTypeDefinitionAtPosition(
      fileName,
      splicedIndex
    );
    if (!definitions) return;

    return definitions.map(remapSpans(autotype));
  };

const remapSpans =
  (autotype: ReturnType<typeof getAutotypeLanguageService>) =>
  (definition: ts.DefinitionInfo): ts.DefinitionInfo => {
    const definitionRoute = autotype.getRoute(definition.fileName);
    if (!definitionRoute) return definition;
    return {
      ...definition,
      textSpan: {
        ...definition.textSpan,
        start: definitionRoute.autotyped.toOriginalIndex(
          definition.textSpan.start
        ).index,
      },
    };
  };
