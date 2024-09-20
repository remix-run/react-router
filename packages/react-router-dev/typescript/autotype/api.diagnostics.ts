import type ts from "typescript/lib/tsserverlibrary";

import {
  type AutotypedRoute,
  getAutotypeLanguageService,
} from "./language-service";
import { type Context } from "../context";

export const getSyntacticDiagnostics =
  (ctx: Context): ts.LanguageService["getSyntacticDiagnostics"] =>
  (fileName: string) => {
    const autotype = getAutotypeLanguageService(ctx);
    const route = autotype.getRoute(fileName);
    if (!route) return [];

    const sourceFile = ctx.languageService
      .getProgram()
      ?.getSourceFile(fileName);
    if (!sourceFile) return [];

    return autotype
      .getSyntacticDiagnostics(fileName)
      .map(remapSpans(sourceFile, route.autotyped));
  };

export const getSemanticDiagnostics =
  (ctx: Context): ts.LanguageService["getSemanticDiagnostics"] =>
  (fileName) => {
    const autotype = getAutotypeLanguageService(ctx);
    const route = autotype.getRoute(fileName);
    if (!route) return [];

    const sourceFile = ctx.languageService
      .getProgram()
      ?.getSourceFile(fileName);
    if (!sourceFile) return [];

    return autotype
      .getSemanticDiagnostics(fileName)
      .map(remapSpans(sourceFile, route.autotyped));
  };

export const getSuggestionDiagnostics =
  (ctx: Context): ts.LanguageService["getSuggestionDiagnostics"] =>
  (fileName) => {
    const autotype = getAutotypeLanguageService(ctx);
    const route = autotype.getRoute(fileName);
    if (!route) return [];

    const sourceFile = ctx.languageService
      .getProgram()
      ?.getSourceFile(fileName);
    if (!sourceFile) return [];

    return autotype
      .getSuggestionDiagnostics(fileName)
      .map(remapSpans(sourceFile, route.autotyped));
  };

const remapSpans =
  <T extends ts.Diagnostic | ts.DiagnosticWithLocation>(
    sourceFile: ts.SourceFile,
    route: AutotypedRoute
  ) =>
  (diagnostic: T): T => {
    if (!diagnostic.start) return diagnostic;

    const { index, remapDiagnostics } = route.toOriginalIndex(diagnostic.start);
    return {
      ...diagnostic,
      start: remapDiagnostics?.start ?? index,
      length: remapDiagnostics?.length ?? diagnostic.length,
      file: sourceFile,
    };
  };
