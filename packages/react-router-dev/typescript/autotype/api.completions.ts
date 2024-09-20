import type ts from "typescript/lib/tsserverlibrary";

import { getAutotypeLanguageService } from "./language-service";
import { type Context } from "../context";

export const getCompletionsAtPosition =
  (ctx: Context): ts.LanguageService["getCompletionsAtPosition"] =>
  (fileName, position, options, settings) => {
    const autotype = getAutotypeLanguageService(ctx);
    const route = autotype.getRoute(fileName);
    if (!route) return;

    const splicedIndex = route.autotyped.toSplicedIndex(position);
    const completions = autotype.getCompletionsAtPosition(
      fileName,
      splicedIndex,
      options,
      settings
    );
    if (!completions) return;

    completions.entries = completions.entries.map((completion) => {
      if (!completion.replacementSpan) return completion;
      return {
        ...completion,
        replacementSpan: {
          ...completion.replacementSpan,
          start: route.autotyped.toOriginalIndex(
            completion.replacementSpan.start
          ).index,
        },
      };
    });
    if (completions.optionalReplacementSpan) {
      completions.optionalReplacementSpan = {
        ...completions.optionalReplacementSpan,
        start: route.autotyped.toOriginalIndex(
          completions.optionalReplacementSpan.start
        ).index,
      };
    }
    return completions;
  };

export const getCompletionEntryDetails =
  (ctx: Context): ts.LanguageService["getCompletionEntryDetails"] =>
  (fileName, position, entryName, formatOptions, source, preferences, data) => {
    const autotype = getAutotypeLanguageService(ctx);
    const route = autotype.getRoute(fileName);
    if (!route) return;

    const details = autotype.getCompletionEntryDetails(
      fileName,
      route.autotyped.toSplicedIndex(position),
      entryName,
      formatOptions,
      source,
      preferences,
      data
    );
    if (!details) return;

    details.codeActions = details.codeActions?.map((codeAction) => {
      codeAction.changes = codeAction.changes.map((change) => {
        change.textChanges = change.textChanges.map((textChange) => {
          return {
            ...textChange,
            span: {
              ...textChange.span,
              start: route.autotyped.toOriginalIndex(textChange.span.start)
                .index,
            },
          };
        });
        return change;
      });
      return codeAction;
    });
    return details;
  };

export const getSignatureHelpItems =
  (ctx: Context): ts.LanguageService["getSignatureHelpItems"] =>
  (fileName, position, options) => {
    const autotype = getAutotypeLanguageService(ctx);
    const route = autotype.getRoute(fileName);
    if (!route) return;

    return autotype.getSignatureHelpItems(
      fileName,
      route.autotyped.toSplicedIndex(position),
      options
    );
  };
