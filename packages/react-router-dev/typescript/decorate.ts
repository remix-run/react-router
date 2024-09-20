import type ts from "typescript/lib/tsserverlibrary";

import type { Context } from "./context";
import * as Autotype from "./autotype";
import * as AST from "./ast";
import * as Route from "./routes";

export function decorateLanguageService(ctx: Context) {
  const ls = ctx.languageService;

  // completions
  // --------------------------------------------------------------------------

  const { getCompletionsAtPosition } = ls;
  ls.getCompletionsAtPosition = (fileName, position, ...rest) => {
    if (!Route.get(ctx, fileName)) {
      return getCompletionsAtPosition(fileName, position, ...rest);
    }

    const completions = Autotype.getCompletionsAtPosition(ctx)(
      fileName,
      position,
      ...rest
    );

    const sourceFile = ctx.languageService
      .getProgram()
      ?.getSourceFile(fileName);
    if (!sourceFile) return completions;

    const node = AST.findNodeAtPosition(sourceFile, position);
    if (!node) return completions;

    const isTopLevel =
      ctx.ts.isSourceFile(node.parent) ||
      (ctx.ts.isStatement(node.parent) &&
        ctx.ts.isSourceFile(node.parent.parent));
    if (!isTopLevel) return completions;

    const { line } = sourceFile.getLineAndCharacterOfPosition(position);
    const lineStart = sourceFile.getPositionOfLineAndCharacter(line, 0);
    const normalizedLine = sourceFile.text
      .slice(lineStart, position)
      .trim()
      .replace(/\s+g/, " ");
    const exports = AST.getExportNames(ctx.ts, sourceFile);

    const routeExportCompletions: ts.CompletionEntry[] = Object.keys(
      Route.exports
    )
      .map((key) => {
        if (exports.has(key)) return null;

        const insertText =
          key === "default"
            ? `export default function Component() {}`
            : `export function ${key}() {}`;
        if (!fzf(normalizedLine, insertText)) return null;

        const completion: ts.CompletionEntry = {
          name: key,
          insertText,
          kind: ctx.ts.ScriptElementKind.functionElement,
          kindModifiers: ctx.ts.ScriptElementKindModifier.exportedModifier,
          sortText: "0",
          labelDetails: {
            description: "React Router Export",
          },
          data: {
            exportName: key, // TS needs this
            __reactRouter: key,
          } as any,
        };

        return {
          ...completion,
          replacementSpan: { start: lineStart, length: position - lineStart },
        };
      })
      .filter((x) => x !== null);

    if (!completions) {
      return routeExportCompletions.length > 0
        ? {
            isGlobalCompletion: false,
            isMemberCompletion: false,
            isNewIdentifierLocation: false,
            isIncomplete: true,
            entries: routeExportCompletions,
          }
        : undefined;
    }

    return routeExportCompletions.length > 0
      ? {
          ...completions,
          entries: [...routeExportCompletions, ...completions.entries],
        }
      : completions;
  };

  const { getCompletionEntryDetails } = ls;
  ls.getCompletionEntryDetails = (...args) => {
    const data = args[6] as { __reactRouter?: string };
    if (data.__reactRouter) {
      const key = data.__reactRouter;
      return {
        name: key,
        kind: ctx.ts.ScriptElementKind.functionElement,
        kindModifiers: ctx.ts.ScriptElementKindModifier.exportedModifier,
        documentation: Route.exports[key]?.documentation ?? [],
        displayParts: [],
      };
    }
    return Route.get(ctx, args[0])
      ? Autotype.getCompletionEntryDetails(ctx)(...args)
      : getCompletionEntryDetails(...args);
  };

  const { getSignatureHelpItems } = ls;
  ls.getSignatureHelpItems = (...args) =>
    Route.get(ctx, args[0])
      ? Autotype.getSignatureHelpItems(ctx)(...args)
      : getSignatureHelpItems(...args);

  // definitions
  // --------------------------------------------------------------------------

  const { getDefinitionAndBoundSpan } = ls;
  ls.getDefinitionAndBoundSpan = (...args) =>
    Route.get(ctx, args[0])
      ? Autotype.getDefinitionAndBoundSpan(ctx)(...args)
      : getDefinitionAndBoundSpan(...args);

  const { getTypeDefinitionAtPosition } = ls;
  ls.getTypeDefinitionAtPosition = (...args) =>
    Route.get(ctx, args[0])
      ? Autotype.getTypeDefinitionAtPosition(ctx)(...args)
      : getTypeDefinitionAtPosition(...args);

  // diagnostics
  // --------------------------------------------------------------------------

  const { getSyntacticDiagnostics } = ls;
  ls.getSyntacticDiagnostics = (...args) =>
    Route.get(ctx, args[0])
      ? Autotype.getSyntacticDiagnostics(ctx)(...args)
      : getSyntacticDiagnostics(...args);

  const { getSemanticDiagnostics } = ls;
  ls.getSemanticDiagnostics = (fileName) => {
    if (!Route.get(ctx, fileName)) return getSemanticDiagnostics(fileName);

    const diagnostics = Autotype.getSemanticDiagnostics(ctx)(fileName);

    const sourceFile = ls.getProgram()?.getSourceFile(fileName);
    if (!sourceFile) return diagnostics;

    const exportStarDiagnostics: ts.Diagnostic[] = sourceFile.statements
      // eslint-disable-next-line array-callback-return
      .map((stmt) => {
        if (!ctx.ts.isExportDeclaration(stmt)) return undefined;
        if (
          stmt.exportClause === undefined || // export * as stuff from "..."
          ctx.ts.isNamespaceExportDeclaration(stmt) // export * as stuff from "..."
        ) {
          const diagnostic: ts.Diagnostic = {
            file: sourceFile,
            category: ctx.ts.DiagnosticCategory.Warning,
            start: stmt.getStart(),
            length: stmt.getWidth(),
            messageText:
              "React Router cannot typecheck route exports from `*` exports",
            code: 100,
          };
          return diagnostic;
        }
      })
      .filter((x) => x !== undefined);

    const hmrNamedFunctionsDiagnostics: ts.Diagnostic[] = sourceFile.statements
      // eslint-disable-next-line array-callback-return
      .map((stmt) => {
        if (ctx.ts.isFunctionDeclaration(stmt)) {
          // export default function ...
          if (!AST.exported(ctx.ts, stmt)) return undefined;
          if (!AST.defaulted(ctx.ts, stmt)) return undefined;

          if (!stmt.name) {
            return {
              file: sourceFile,
              category: ctx.ts.DiagnosticCategory.Warning,
              start: stmt.getStart(),
              length: stmt.getWidth(),
              messageText:
                "For HMR to work, React Router default export must be named\n\nhttps://remix.run/docs/en/main/discussion/hot-module-replacement#named-function-components",
              code: 101,
            };
          }
        }
        if (ctx.ts.isExportAssignment(stmt)) {
          if (stmt.isExportEquals) return undefined;
          // export default expr
          return {
            file: sourceFile,
            category: ctx.ts.DiagnosticCategory.Warning,
            start: stmt.getStart(),
            length: stmt.getWidth(),
            messageText:
              "For HMR to work, React Router default export must be named\n\nhttps://remix.run/docs/en/main/discussion/hot-module-replacement#named-function-components",
            code: 101,
          };
        }
      })
      .filter((x) => x !== undefined);

    return [
      ...hmrNamedFunctionsDiagnostics,
      ...exportStarDiagnostics,
      ...diagnostics,
    ];
  };

  const { getSuggestionDiagnostics } = ls;
  ls.getSuggestionDiagnostics = (...args) =>
    Route.get(ctx, args[0])
      ? Autotype.getSuggestionDiagnostics(ctx)(...args)
      : getSuggestionDiagnostics(...args);

  // diagnostics
  // --------------------------------------------------------------------------

  const { getQuickInfoAtPosition } = ls;
  ls.getQuickInfoAtPosition = (fileName, position) => {
    const route = Route.get(ctx, fileName);
    if (!route) return getQuickInfoAtPosition(fileName, position);

    const quickinfo = Route.get(ctx, fileName)
      ? Autotype.getQuickInfoAtPosition(ctx)(fileName, position)
      : getQuickInfoAtPosition(fileName, position);
    if (!quickinfo) return;

    const sourceFile = ctx.languageService
      .getProgram()
      ?.getSourceFile(fileName);
    const node = sourceFile && AST.findNodeAtPosition(sourceFile, position);
    const exportName = node && AST.getRouteExportName(ctx, node);
    const routeExportDocs = exportName
      ? Route.exports[exportName]?.documentation
      : undefined;

    const documentation: ts.SymbolDisplayPart[] = [
      ...(quickinfo.documentation ?? []),
      ...(routeExportDocs ?? []),
    ];

    return {
      ...quickinfo,
      documentation: documentation.length > 0 ? documentation : undefined,
    };
  };

  // inlay hints
  // --------------------------------------------------------------------------

  const { provideInlayHints } = ls;
  ls.provideInlayHints = (...args) =>
    Route.get(ctx, args[0])
      ? Autotype.provideInlayHints(ctx)(...args)
      : provideInlayHints(...args);
}

function fzf(pattern: string, target: string): boolean {
  let patternIndex = 0;
  let targetIndex = 0;

  while (patternIndex < pattern.length && targetIndex < target.length) {
    if (
      pattern[patternIndex]?.toLowerCase() ===
      target[targetIndex]?.toLowerCase()
    ) {
      patternIndex += 1;
    }
    targetIndex += 1;
  }
  return patternIndex === pattern.length;
}
