/**
 * @react-router/dev v8.2.0
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */
import { _ as getVite, a as t, c as createConfigLoader, d as resolveEntryFiles, f as resolveRSCEntryFiles, g as getUserBuildRollupOptions, h as defineOptimizeDepsCompilerOptions, i as parse$1, l as hasNodeDependency, m as defineCompilerOptions, n as watch, o as traverse, p as ssrExternals, r as generate, s as configRouteToBranchRoute, v as preloadVite } from "./typegen-CNpfI4aI.js";
import { u as invariant } from "./routes-CdiIrVIn.js";
import { createRequire } from "node:module";
import colors from "picocolors";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { cp, mkdir, readFile, readdir, rename, rm, writeFile } from "node:fs/promises";
import * as path$2 from "node:path";
import path from "node:path";
import { readPackageJSON } from "pkg-types";
import { createRequestHandler, matchRoutes, unstable_setDevServerHooks } from "react-router";
import * as Path from "pathe";
import path$1, { join } from "pathe";
import pick from "lodash/pick.js";
import * as babel from "@babel/core";
import { createHash } from "node:crypto";
import * as url from "node:url";
import { createRequest, sendResponse } from "@remix-run/node-fetch-server";
import { init, parse } from "es-module-lexer";
import jsesc from "jsesc";
import kebabCase from "lodash/kebabCase.js";
import { deadCodeElimination, findReferencedIdentifiers } from "babel-dead-code-elimination";
import { escapePath } from "tinyglobby";
import http from "node:http";
import { existsSync as existsSync$1 } from "fs";
import { readFile as readFile$1 } from "fs/promises";
//#region vite/node-adapter.ts
async function fromNodeRequest(nodeReq, nodeRes) {
	invariant(nodeReq.originalUrl, "Expected `nodeReq.originalUrl` to be defined");
	nodeReq.url = nodeReq.originalUrl;
	return createRequest(nodeReq, nodeRes);
}
//#endregion
//#region vite/resolve-file-url.ts
const resolveFileUrl = ({ rootDirectory }, filePath, { publicPath } = {}) => {
	let vite = getVite();
	let relativePath = path$2.relative(rootDirectory, filePath);
	if (!(!relativePath.startsWith("..") && !path$2.isAbsolute(relativePath))) return path$2.posix.join("/@fs", vite.normalizePath(filePath));
	let url = "/" + vite.normalizePath(relativePath);
	if (publicPath && publicPath !== "/" && url.startsWith(publicPath)) return path$2.posix.join("/@fs", vite.normalizePath(filePath));
	return url;
};
//#endregion
//#region vite/styles.ts
const cssFileRegExp = /\.(css|less|sass|scss|styl|stylus|pcss|postcss|sss)(?:$|\?)/;
const cssModulesRegExp = new RegExp(`\\.module${cssFileRegExp.source}`);
const isCssFile = (file) => cssFileRegExp.test(file);
const isCssModulesFile = (file) => cssModulesRegExp.test(file);
const cssUrlParamsWithoutSideEffects = [
	"url",
	"inline",
	"raw",
	"inline-css"
];
const isCssUrlWithoutSideEffects = (url) => {
	let queryString = url.split("?")[1];
	if (!queryString) return false;
	let params = new URLSearchParams(queryString);
	for (let paramWithoutSideEffects of cssUrlParamsWithoutSideEffects) if (params.get(paramWithoutSideEffects) === "" && !url.includes(`?${paramWithoutSideEffects}=`) && !url.includes(`&${paramWithoutSideEffects}=`)) return true;
	return false;
};
const getStylesForFiles = async ({ viteDevServer, rootDirectory, loadCssContents, files }) => {
	let styles = {};
	let deps = /* @__PURE__ */ new Set();
	try {
		for (let file of files) {
			let normalizedPath = path$2.resolve(rootDirectory, file).replace(/\\/g, "/");
			let node = await viteDevServer.moduleGraph.getModuleById(normalizedPath);
			if (!node) {
				try {
					await viteDevServer.transformRequest(resolveFileUrl({ rootDirectory }, normalizedPath));
				} catch (err) {
					console.error(err);
				}
				node = await viteDevServer.moduleGraph.getModuleById(normalizedPath);
			}
			if (!node) {
				console.log(`Could not resolve module for file: ${file}`);
				continue;
			}
			await findDeps(viteDevServer, node, deps);
		}
	} catch (err) {
		console.error(err);
	}
	for (let dep of deps) if (dep.file && isCssFile(dep.file) && !isCssUrlWithoutSideEffects(dep.url)) try {
		styles[dep.url] = await loadCssContents(viteDevServer, dep);
	} catch {
		console.warn(`Failed to load CSS for ${dep.file}`);
	}
	return Object.entries(styles).map(([fileName, css], i) => [`\n/* ${fileName.replace(/\/\*/g, "/\\*").replace(/\*\//g, "*\\/")} */`, css]).flat().join("\n") || void 0;
};
const findDeps = async (vite, node, deps) => {
	let branches = [];
	async function addFromNode(node) {
		if (!deps.has(node)) {
			deps.add(node);
			await findDeps(vite, node, deps);
		}
	}
	async function addFromUrl(url) {
		let node = await vite.moduleGraph.getModuleByUrl(url);
		if (node) await addFromNode(node);
	}
	if (node.ssrTransformResult) {
		if (node.ssrTransformResult.deps) node.ssrTransformResult.deps.forEach((url) => branches.push(addFromUrl(url)));
	} else node.importedModules.forEach((node) => branches.push(addFromNode(node)));
	await Promise.all(branches);
};
const groupRoutesByParentId$1 = (manifest) => {
	let routes = {};
	Object.values(manifest).forEach((route) => {
		if (route) {
			let parentId = route.parentId || "";
			if (!routes[parentId]) routes[parentId] = [];
			routes[parentId].push(route);
		}
	});
	return routes;
};
const createRoutesWithChildren = (manifest, parentId = "", routesByParentId = groupRoutesByParentId$1(manifest)) => {
	return (routesByParentId[parentId] || []).map((route) => ({
		...route,
		...route.index ? { index: true } : {
			index: false,
			children: createRoutesWithChildren(manifest, route.id, routesByParentId)
		}
	}));
};
const getStylesForPathname = async ({ viteDevServer, rootDirectory, reactRouterConfig, entryClientFilePath, loadCssContents, pathname }) => {
	if (pathname === void 0 || pathname.includes("?_data=")) return;
	let routesWithChildren = createRoutesWithChildren(reactRouterConfig.routes);
	let appPath = path$2.relative(process.cwd(), reactRouterConfig.appDirectory);
	let documentRouteFiles = matchRoutes(routesWithChildren, pathname, reactRouterConfig.basename)?.map((match) => path$2.resolve(appPath, reactRouterConfig.routes[match.route.id].file)) ?? [];
	return await getStylesForFiles({
		viteDevServer,
		rootDirectory,
		loadCssContents,
		files: [path$2.relative(rootDirectory, entryClientFilePath), ...documentRouteFiles]
	});
};
const getCssStringFromViteDevModuleCode = (code) => {
	let cssContent = void 0;
	traverse(parse$1(code, { sourceType: "module" }), { VariableDeclaration(path) {
		const declaration = path.node.declarations[0];
		if (declaration?.id?.type === "Identifier" && declaration.id.name === "__vite__css" && declaration.init?.type === "StringLiteral") {
			cssContent = declaration.init.value;
			path.stop();
		}
	} });
	return cssContent;
};
//#endregion
//#region vite/virtual-module.ts
function create(name) {
	let id = `virtual:react-router/${name}`;
	return {
		id,
		resolvedId: `\0${id}`,
		url: `/@id/__x00__${id}`
	};
}
//#endregion
//#region vite/resolve-relative-route-file-path.ts
function resolveRelativeRouteFilePath(route, reactRouterConfig) {
	let vite = getVite();
	let file = route.file;
	let fullPath = path$1.resolve(reactRouterConfig.appDirectory, file);
	return vite.normalizePath(fullPath);
}
//#endregion
//#region vite/combine-urls.ts
function combineURLs(baseURL, relativeURL) {
	return relativeURL ? baseURL.replace(/\/+$/, "") + "/" + relativeURL.replace(/^\/+/, "") : baseURL;
}
//#endregion
//#region vite/remove-exports.ts
const removeExports = (ast, exportsToRemove) => {
	let previouslyReferencedIdentifiers = findReferencedIdentifiers(ast);
	let exportsFiltered = false;
	let markedForRemoval = /* @__PURE__ */ new Set();
	let removedExportLocalNames = /* @__PURE__ */ new Set();
	traverse(ast, { ExportDeclaration(path) {
		if (path.node.type === "ExportNamedDeclaration") {
			if (path.node.specifiers.length) {
				path.node.specifiers = path.node.specifiers.filter((specifier) => {
					if (specifier.type === "ExportSpecifier" && specifier.exported.type === "Identifier") {
						if (exportsToRemove.includes(specifier.exported.name)) {
							exportsFiltered = true;
							if (specifier.local && specifier.local.name !== specifier.exported.name) removedExportLocalNames.add(specifier.local.name);
							return false;
						}
					}
					return true;
				});
				if (path.node.specifiers.length === 0) markedForRemoval.add(path);
			}
			if (path.node.declaration?.type === "VariableDeclaration") {
				let declaration = path.node.declaration;
				declaration.declarations = declaration.declarations.filter((declaration) => {
					if (declaration.id.type === "Identifier" && exportsToRemove.includes(declaration.id.name)) {
						exportsFiltered = true;
						return false;
					}
					if (declaration.id.type === "ArrayPattern" || declaration.id.type === "ObjectPattern") validateDestructuredExports(declaration.id, exportsToRemove);
					return true;
				});
				if (declaration.declarations.length === 0) markedForRemoval.add(path);
			}
			if (path.node.declaration?.type === "FunctionDeclaration") {
				let id = path.node.declaration.id;
				if (id && exportsToRemove.includes(id.name)) markedForRemoval.add(path);
			}
			if (path.node.declaration?.type === "ClassDeclaration") {
				let id = path.node.declaration.id;
				if (id && exportsToRemove.includes(id.name)) markedForRemoval.add(path);
			}
		}
		if (path.node.type === "ExportDefaultDeclaration") {
			if (exportsToRemove.includes("default")) {
				markedForRemoval.add(path);
				if (path.node.declaration) {
					if (path.node.declaration.type === "Identifier") removedExportLocalNames.add(path.node.declaration.name);
					else if ((path.node.declaration.type === "FunctionDeclaration" || path.node.declaration.type === "ClassDeclaration") && path.node.declaration.id) removedExportLocalNames.add(path.node.declaration.id.name);
				}
			}
		}
	} });
	traverse(ast, { ExpressionStatement(path) {
		if (!path.parentPath.isProgram()) return;
		if (path.node.expression.type === "AssignmentExpression") {
			const left = path.node.expression.left;
			if (left.type === "MemberExpression" && left.object.type === "Identifier" && (exportsToRemove.includes(left.object.name) || removedExportLocalNames.has(left.object.name))) markedForRemoval.add(path);
		}
	} });
	if (markedForRemoval.size > 0 || exportsFiltered) {
		for (let path of markedForRemoval) path.remove();
		deadCodeElimination(ast, previouslyReferencedIdentifiers);
	}
};
function validateDestructuredExports(id, exportsToRemove) {
	if (id.type === "ArrayPattern") for (let element of id.elements) {
		if (!element) continue;
		if (element.type === "Identifier" && exportsToRemove.includes(element.name)) throw invalidDestructureError(element.name);
		if (element.type === "RestElement" && element.argument.type === "Identifier" && exportsToRemove.includes(element.argument.name)) throw invalidDestructureError(element.argument.name);
		if (element.type === "ArrayPattern" || element.type === "ObjectPattern") validateDestructuredExports(element, exportsToRemove);
	}
	if (id.type === "ObjectPattern") for (let property of id.properties) {
		if (!property) continue;
		if (property.type === "ObjectProperty" && property.key.type === "Identifier") {
			if (property.value.type === "Identifier" && exportsToRemove.includes(property.value.name)) throw invalidDestructureError(property.value.name);
			if (property.value.type === "ArrayPattern" || property.value.type === "ObjectPattern") validateDestructuredExports(property.value, exportsToRemove);
		}
		if (property.type === "RestElement" && property.argument.type === "Identifier" && exportsToRemove.includes(property.argument.name)) throw invalidDestructureError(property.argument.name);
	}
}
function invalidDestructureError(name) {
	return /* @__PURE__ */ new Error(`Cannot remove destructured export "${name}"`);
}
//#endregion
//#region vite/cache.ts
function getOrSetFromCache(cache, key, version, getValue) {
	if (!cache) return getValue();
	let entry = cache.get(key);
	if (entry?.version === version) return entry.value;
	let value = getValue();
	let newEntry = {
		value,
		version
	};
	cache.set(key, newEntry);
	return value;
}
//#endregion
//#region vite/route-chunks.ts
function codeToAst(code, cache, cacheKey) {
	return structuredClone(getOrSetFromCache(cache, `${cacheKey}::codeToAst`, code, () => parse$1(code, { sourceType: "module" })));
}
function assertNodePath(path) {
	invariant(path && !Array.isArray(path), `Expected a Path, but got ${Array.isArray(path) ? "an array" : path}`);
}
function assertNodePathIsStatement(path) {
	invariant(path && !Array.isArray(path) && t.isStatement(path.node), `Expected a Statement path, but got ${Array.isArray(path) ? "an array" : path?.node?.type}`);
}
function assertNodePathIsVariableDeclarator(path) {
	invariant(path && !Array.isArray(path) && t.isVariableDeclarator(path.node), `Expected an Identifier path, but got ${Array.isArray(path) ? "an array" : path?.node?.type}`);
}
function assertNodePathIsPattern(path) {
	invariant(path && !Array.isArray(path) && t.isPattern(path.node), `Expected a Pattern path, but got ${Array.isArray(path) ? "an array" : path?.node?.type}`);
}
function getExportDependencies(code, cache, cacheKey) {
	return getOrSetFromCache(cache, `${cacheKey}::getExportDependencies`, code, () => {
		let exportDependencies = /* @__PURE__ */ new Map();
		let ast = codeToAst(code, cache, cacheKey);
		function handleExport(exportName, exportPath, identifiersPath = exportPath) {
			let identifiers = getDependentIdentifiersForPath(identifiersPath);
			let topLevelStatements = new Set([exportPath.node, ...getTopLevelStatementsForPaths(identifiers)]);
			let topLevelNonModuleStatements = new Set(Array.from(topLevelStatements).filter((statement) => !t.isImportDeclaration(statement) && !t.isExportDeclaration(statement)));
			let importedIdentifierNames = /* @__PURE__ */ new Set();
			for (let identifier of identifiers) if (identifier.parentPath.parentPath?.isImportDeclaration()) importedIdentifierNames.add(identifier.node.name);
			let exportedVariableDeclarators = /* @__PURE__ */ new Set();
			for (let identifier of identifiers) {
				if (identifier.parentPath.isVariableDeclarator() && identifier.parentPath.parentPath.parentPath?.isExportNamedDeclaration()) {
					exportedVariableDeclarators.add(identifier.parentPath.node);
					continue;
				}
				if (Boolean(identifier.findParent((path) => Boolean(path.isPattern() && path.parentPath?.isVariableDeclarator() && path.parentPath.parentPath?.parentPath?.isExportNamedDeclaration())))) {
					let currentPath = identifier;
					while (currentPath) {
						if (currentPath.parentPath?.isVariableDeclarator() && currentPath.parentKey === "id") {
							exportedVariableDeclarators.add(currentPath.parentPath.node);
							break;
						}
						currentPath = currentPath.parentPath;
					}
				}
			}
			let dependencies = {
				topLevelStatements,
				topLevelNonModuleStatements,
				importedIdentifierNames,
				exportedVariableDeclarators
			};
			exportDependencies.set(exportName, dependencies);
		}
		traverse(ast, { ExportDeclaration(exportPath) {
			let { node } = exportPath;
			if (t.isExportAllDeclaration(node)) return;
			if (t.isExportDefaultDeclaration(node)) {
				handleExport("default", exportPath);
				return;
			}
			let { declaration } = node;
			if (t.isVariableDeclaration(declaration)) {
				let { declarations } = declaration;
				for (let i = 0; i < declarations.length; i++) {
					let declarator = declarations[i];
					if (t.isIdentifier(declarator.id)) {
						let declaratorPath = exportPath.get(`declaration.declarations.${i}`);
						assertNodePathIsVariableDeclarator(declaratorPath);
						handleExport(declarator.id.name, exportPath, declaratorPath);
						continue;
					}
					if (t.isPattern(declarator.id)) {
						let exportedPatternPath = exportPath.get(`declaration.declarations.${i}.id`);
						assertNodePathIsPattern(exportedPatternPath);
						let identifiers = getIdentifiersForPatternPath(exportedPatternPath);
						for (let identifier of identifiers) handleExport(identifier.node.name, exportPath, identifier);
					}
				}
				return;
			}
			if (t.isFunctionDeclaration(declaration) || t.isClassDeclaration(declaration)) {
				invariant(declaration.id, "Expected exported function or class declaration to have a name when not the default export");
				handleExport(declaration.id.name, exportPath);
				return;
			}
			if (t.isExportNamedDeclaration(node)) {
				for (let specifier of node.specifiers) if (t.isIdentifier(specifier.exported)) {
					let name = specifier.exported.name;
					let specifierPath = exportPath.get("specifiers").find((path) => path.node === specifier);
					invariant(specifierPath, `Expected to find specifier path for ${name}`);
					handleExport(name, exportPath, specifierPath);
				}
				return;
			}
			throw new Error(`Unknown export node type: ${node.type}`);
		} });
		return exportDependencies;
	});
}
function getDependentIdentifiersForPath(path, state) {
	let { visited, identifiers } = state ?? {
		visited: /* @__PURE__ */ new Set(),
		identifiers: /* @__PURE__ */ new Set()
	};
	if (visited.has(path)) return identifiers;
	visited.add(path);
	path.traverse({ Identifier(path) {
		if (identifiers.has(path)) return;
		identifiers.add(path);
		let binding = path.scope.getBinding(path.node.name);
		if (!binding) return;
		getDependentIdentifiersForPath(binding.path, {
			visited,
			identifiers
		});
		for (let reference of binding.referencePaths) {
			if (reference.isExportNamedDeclaration()) continue;
			getDependentIdentifiersForPath(reference, {
				visited,
				identifiers
			});
		}
		for (let constantViolation of binding.constantViolations) getDependentIdentifiersForPath(constantViolation, {
			visited,
			identifiers
		});
	} });
	let topLevelStatement = getTopLevelStatementPathForPath(path);
	let withinImportStatement = topLevelStatement.isImportDeclaration();
	let withinExportStatement = topLevelStatement.isExportDeclaration();
	if (!withinImportStatement && !withinExportStatement) getDependentIdentifiersForPath(topLevelStatement, {
		visited,
		identifiers
	});
	if (withinExportStatement && path.isIdentifier() && (t.isPattern(path.parentPath.node) || t.isPattern(path.parentPath.parentPath?.node))) {
		let variableDeclarator = path.findParent((p) => p.isVariableDeclarator());
		assertNodePath(variableDeclarator);
		getDependentIdentifiersForPath(variableDeclarator, {
			visited,
			identifiers
		});
	}
	return identifiers;
}
function getTopLevelStatementPathForPath(path) {
	let ancestry = path.getAncestry();
	let topLevelStatement = ancestry[ancestry.length - 2];
	assertNodePathIsStatement(topLevelStatement);
	return topLevelStatement;
}
function getTopLevelStatementsForPaths(paths) {
	let topLevelStatements = /* @__PURE__ */ new Set();
	for (let path of paths) {
		let topLevelStatement = getTopLevelStatementPathForPath(path);
		topLevelStatements.add(topLevelStatement.node);
	}
	return topLevelStatements;
}
function getIdentifiersForPatternPath(patternPath, identifiers = /* @__PURE__ */ new Set()) {
	function walk(currentPath) {
		if (currentPath.isIdentifier()) {
			identifiers.add(currentPath);
			return;
		}
		if (currentPath.isObjectPattern()) {
			let { properties } = currentPath.node;
			for (let i = 0; i < properties.length; i++) {
				const property = properties[i];
				if (t.isObjectProperty(property)) {
					let valuePath = currentPath.get(`properties.${i}.value`);
					assertNodePath(valuePath);
					walk(valuePath);
				} else if (t.isRestElement(property)) {
					let argumentPath = currentPath.get(`properties.${i}.argument`);
					assertNodePath(argumentPath);
					walk(argumentPath);
				}
			}
		} else if (currentPath.isArrayPattern()) {
			let { elements } = currentPath.node;
			for (let i = 0; i < elements.length; i++) if (elements[i]) {
				let elementPath = currentPath.get(`elements.${i}`);
				assertNodePath(elementPath);
				walk(elementPath);
			}
		} else if (currentPath.isRestElement()) {
			let argumentPath = currentPath.get("argument");
			assertNodePath(argumentPath);
			walk(argumentPath);
		}
	}
	walk(patternPath);
	return identifiers;
}
const getExportedName = (exported) => {
	return t.isIdentifier(exported) ? exported.name : exported.value;
};
function setsIntersect(set1, set2) {
	let smallerSet = set1;
	let largerSet = set2;
	if (set1.size > set2.size) {
		smallerSet = set2;
		largerSet = set1;
	}
	for (let element of smallerSet) if (largerSet.has(element)) return true;
	return false;
}
function hasChunkableExport(code, exportName, cache, cacheKey) {
	return getOrSetFromCache(cache, `${cacheKey}::hasChunkableExport::${exportName}`, code, () => {
		let exportDependencies = getExportDependencies(code, cache, cacheKey);
		let dependencies = exportDependencies.get(exportName);
		if (!dependencies) return false;
		for (let [currentExportName, currentDependencies] of exportDependencies) {
			if (currentExportName === exportName) continue;
			if (setsIntersect(currentDependencies.topLevelNonModuleStatements, dependencies.topLevelNonModuleStatements)) return false;
		}
		if (dependencies.exportedVariableDeclarators.size > 1) return false;
		if (dependencies.exportedVariableDeclarators.size > 0) for (let [currentExportName, currentDependencies] of exportDependencies) {
			if (currentExportName === exportName) continue;
			if (setsIntersect(currentDependencies.exportedVariableDeclarators, dependencies.exportedVariableDeclarators)) return false;
		}
		return true;
	});
}
function getChunkedExport(code, exportName, generateOptions = {}, cache, cacheKey) {
	return getOrSetFromCache(cache, `${cacheKey}::getChunkedExport::${exportName}::${JSON.stringify(generateOptions)}`, code, () => {
		if (!hasChunkableExport(code, exportName, cache, cacheKey)) return;
		let dependencies = getExportDependencies(code, cache, cacheKey).get(exportName);
		invariant(dependencies, "Expected export to have dependencies");
		let topLevelStatementsArray = Array.from(dependencies.topLevelStatements);
		let exportedVariableDeclaratorsArray = Array.from(dependencies.exportedVariableDeclarators);
		let ast = codeToAst(code, cache, cacheKey);
		ast.program.body = ast.program.body.filter((node) => topLevelStatementsArray.some((statement) => t.isNodesEquivalent(node, statement))).map((node) => {
			if (!t.isImportDeclaration(node)) return node;
			if (dependencies.importedIdentifierNames.size === 0) return null;
			node.specifiers = node.specifiers.filter((specifier) => dependencies.importedIdentifierNames.has(specifier.local.name));
			invariant(node.specifiers.length > 0, "Expected import statement to have used specifiers");
			return node;
		}).map((node) => {
			if (!t.isExportDeclaration(node)) return node;
			if (t.isExportAllDeclaration(node)) return null;
			if (t.isExportDefaultDeclaration(node)) return exportName === "default" ? node : null;
			let { declaration } = node;
			if (t.isVariableDeclaration(declaration)) {
				declaration.declarations = declaration.declarations.filter((node) => exportedVariableDeclaratorsArray.some((declarator) => t.isNodesEquivalent(node, declarator)));
				if (declaration.declarations.length === 0) return null;
				return node;
			}
			if (t.isFunctionDeclaration(node.declaration) || t.isClassDeclaration(node.declaration)) return node.declaration.id?.name === exportName ? node : null;
			if (t.isExportNamedDeclaration(node)) {
				if (node.specifiers.length === 0) return null;
				node.specifiers = node.specifiers.filter((specifier) => getExportedName(specifier.exported) === exportName);
				if (node.specifiers.length === 0) return null;
				return node;
			}
			throw new Error(`Unknown export node type: ${node.type}`);
		}).filter((node) => node !== null);
		return generate(ast, generateOptions);
	});
}
function omitChunkedExports(code, exportNames, generateOptions = {}, cache, cacheKey) {
	return getOrSetFromCache(cache, `${cacheKey}::omitChunkedExports::${exportNames.join(",")}::${JSON.stringify(generateOptions)}`, code, () => {
		const isChunkable = (exportName) => hasChunkableExport(code, exportName, cache, cacheKey);
		const isOmitted = (exportName) => exportNames.includes(exportName) && isChunkable(exportName);
		const isRetained = (exportName) => !isOmitted(exportName);
		let exportDependencies = getExportDependencies(code, cache, cacheKey);
		let allExportNames = Array.from(exportDependencies.keys());
		let omittedExportNames = allExportNames.filter(isOmitted);
		let retainedExportNames = allExportNames.filter(isRetained);
		let omittedStatements = /* @__PURE__ */ new Set();
		let omittedExportedVariableDeclarators = /* @__PURE__ */ new Set();
		for (let omittedExportName of omittedExportNames) {
			let dependencies = exportDependencies.get(omittedExportName);
			invariant(dependencies, `Expected dependencies for ${omittedExportName}`);
			for (let statement of dependencies.topLevelNonModuleStatements) omittedStatements.add(statement);
			for (let declarator of dependencies.exportedVariableDeclarators) omittedExportedVariableDeclarators.add(declarator);
		}
		let ast = codeToAst(code, cache, cacheKey);
		let omittedStatementsArray = Array.from(omittedStatements);
		let omittedExportedVariableDeclaratorsArray = Array.from(omittedExportedVariableDeclarators);
		ast.program.body = ast.program.body.filter((node) => omittedStatementsArray.every((statement) => !t.isNodesEquivalent(node, statement))).map((node) => {
			if (!t.isImportDeclaration(node)) return node;
			if (node.specifiers.length === 0) return node;
			node.specifiers = node.specifiers.filter((specifier) => {
				let importedName = specifier.local.name;
				for (let retainedExportName of retainedExportNames) if (exportDependencies.get(retainedExportName)?.importedIdentifierNames?.has(importedName)) return true;
				for (let omittedExportName of omittedExportNames) if (exportDependencies.get(omittedExportName)?.importedIdentifierNames?.has(importedName)) return false;
				return true;
			});
			if (node.specifiers.length === 0) return null;
			return node;
		}).map((node) => {
			if (!t.isExportDeclaration(node)) return node;
			if (t.isExportAllDeclaration(node)) return node;
			if (t.isExportDefaultDeclaration(node)) return isOmitted("default") ? null : node;
			if (t.isVariableDeclaration(node.declaration)) {
				node.declaration.declarations = node.declaration.declarations.filter((node) => omittedExportedVariableDeclaratorsArray.every((declarator) => !t.isNodesEquivalent(node, declarator)));
				if (node.declaration.declarations.length === 0) return null;
				return node;
			}
			if (t.isFunctionDeclaration(node.declaration) || t.isClassDeclaration(node.declaration)) {
				invariant(node.declaration.id, "Expected exported function or class declaration to have a name when not the default export");
				return isOmitted(node.declaration.id.name) ? null : node;
			}
			if (t.isExportNamedDeclaration(node)) {
				if (node.specifiers.length === 0) return node;
				node.specifiers = node.specifiers.filter((specifier) => {
					return !isOmitted(getExportedName(specifier.exported));
				});
				if (node.specifiers.length === 0) return null;
				return node;
			}
			throw new Error(`Unknown node type: ${node.type}`);
		}).filter((node) => node !== null);
		if (ast.program.body.length === 0) return;
		return generate(ast, generateOptions);
	});
}
function detectRouteChunks$1(code, cache, cacheKey) {
	const hasRouteChunkByExportName = Object.fromEntries(routeChunkExportNames.map((exportName) => [exportName, hasChunkableExport(code, exportName, cache, cacheKey)]));
	const chunkedExports = Object.entries(hasRouteChunkByExportName).filter(([, isChunked]) => isChunked).map(([exportName]) => exportName);
	return {
		hasRouteChunks: chunkedExports.length > 0,
		hasRouteChunkByExportName,
		chunkedExports
	};
}
const routeChunkExportNames = [
	"clientAction",
	"clientLoader",
	"clientMiddleware",
	"HydrateFallback"
];
const mainChunkName = "main";
const routeChunkNames = ["main", ...routeChunkExportNames];
function getRouteChunkCode(code, chunkName, cache, cacheKey) {
	if (chunkName === mainChunkName) return omitChunkedExports(code, routeChunkExportNames, {}, cache, cacheKey);
	return getChunkedExport(code, chunkName, {}, cache, cacheKey);
}
const routeChunkQueryStringPrefix = "?route-chunk=";
const routeChunkQueryStrings = {
	main: `${routeChunkQueryStringPrefix}main`,
	clientAction: `${routeChunkQueryStringPrefix}clientAction`,
	clientLoader: `${routeChunkQueryStringPrefix}clientLoader`,
	clientMiddleware: `${routeChunkQueryStringPrefix}clientMiddleware`,
	HydrateFallback: `${routeChunkQueryStringPrefix}HydrateFallback`
};
function getRouteChunkModuleId(filePath, chunkName) {
	return `${filePath}${routeChunkQueryStrings[chunkName]}`;
}
function isRouteChunkModuleId(id) {
	return Object.values(routeChunkQueryStrings).some((queryString) => id.endsWith(queryString));
}
function isRouteChunkName(name) {
	return name === mainChunkName || routeChunkExportNames.includes(name);
}
function getRouteChunkNameFromModuleId(id) {
	if (!isRouteChunkModuleId(id)) return null;
	let chunkName = id.split(routeChunkQueryStringPrefix)[1].split("&")[0];
	if (!isRouteChunkName(chunkName)) return null;
	return chunkName;
}
//#endregion
//#region vite/optimize-deps-entries.ts
function getOptimizeDepsEntries({ entryClientFilePath, reactRouterConfig }) {
	if (!reactRouterConfig.future.unstable_optimizeDeps) return [];
	return [getVite().normalizePath(entryClientFilePath), ...Object.values(reactRouterConfig.routes).map((route) => resolveRelativeRouteFilePath(route, reactRouterConfig))].map((entry) => escapePath(entry));
}
//#endregion
//#region vite/with-props.ts
const namedComponentExports = ["HydrateFallback", "ErrorBoundary"];
function isNamedComponentExport(name) {
	return namedComponentExports.includes(name);
}
const decorateComponentExportsWithProps = (ast) => {
	const hocs = [];
	function getHocUid(path, hocName) {
		const uid = path.scope.generateUidIdentifier(hocName);
		hocs.push([hocName, uid]);
		return uid;
	}
	traverse(ast, { ExportDeclaration(path) {
		if (path.isExportDefaultDeclaration()) {
			const declaration = path.get("declaration");
			const expr = declaration.isExpression() ? declaration.node : declaration.isFunctionDeclaration() ? toFunctionExpression(declaration.node) : void 0;
			if (expr) {
				const uid = getHocUid(path, "UNSAFE_withComponentProps");
				declaration.replaceWith(t.callExpression(uid, [expr]));
			}
			return;
		}
		if (path.isExportNamedDeclaration()) {
			const decl = path.get("declaration");
			if (decl.isVariableDeclaration()) {
				decl.get("declarations").forEach((varDeclarator) => {
					const id = varDeclarator.get("id");
					const init = varDeclarator.get("init");
					const expr = init.node;
					if (!expr) return;
					if (!id.isIdentifier()) return;
					const { name } = id.node;
					if (!isNamedComponentExport(name)) return;
					const uid = getHocUid(path, `UNSAFE_with${name}Props`);
					init.replaceWith(t.callExpression(uid, [expr]));
				});
				return;
			}
			if (decl.isFunctionDeclaration()) {
				const { id } = decl.node;
				if (!id) return;
				const { name } = id;
				if (!isNamedComponentExport(name)) return;
				const uid = getHocUid(path, `UNSAFE_with${name}Props`);
				decl.replaceWith(t.variableDeclaration("const", [t.variableDeclarator(t.identifier(name), t.callExpression(uid, [toFunctionExpression(decl.node)]))]));
			}
		}
	} });
	if (hocs.length > 0) ast.program.body.unshift(t.importDeclaration(hocs.map(([name, identifier]) => t.importSpecifier(identifier, t.identifier(name))), t.stringLiteral("react-router")));
};
function toFunctionExpression(decl) {
	return t.functionExpression(decl.id, decl.params, decl.body, decl.generator, decl.async);
}
//#endregion
//#region vite/load-dotenv.ts
async function loadDotenv({ rootDirectory, viteUserConfig, mode }) {
	const vite = await import("vite");
	Object.assign(process.env, vite.loadEnv(mode, viteUserConfig.envDir ?? rootDirectory, ""));
}
//#endregion
//#region vite/plugins/validate-plugin-order.ts
function validatePluginOrder() {
	return {
		name: "react-router:validate-plugin-order",
		configResolved(viteConfig) {
			let pluginIndex = (pluginName) => {
				pluginName = Array.isArray(pluginName) ? pluginName : [pluginName];
				return viteConfig.plugins.findIndex((plugin) => pluginName.includes(plugin.name));
			};
			let reactRouterRscPluginIndex = pluginIndex("react-router/rsc");
			let viteRscPluginIndex = pluginIndex("rsc");
			if (reactRouterRscPluginIndex >= 0 && viteRscPluginIndex >= 0 && reactRouterRscPluginIndex > viteRscPluginIndex) throw new Error(`The "@vitejs/plugin-rsc" plugin should be placed after the React Router RSC plugin in your Vite config`);
			let reactRouterPluginIndex = pluginIndex(["react-router", "react-router/rsc"]);
			let mdxPluginIndex = pluginIndex("@mdx-js/rollup");
			if (mdxPluginIndex >= 0 && mdxPluginIndex > reactRouterPluginIndex) throw new Error(`The "@mdx-js/rollup" plugin should be placed before the React Router plugin in your Vite config`);
		}
	};
}
//#endregion
//#region vite/plugins/warn-on-client-source-maps.ts
function warnOnClientSourceMaps() {
	let viteConfig;
	let viteCommand;
	let logged = false;
	return {
		name: "react-router:warn-on-client-source-maps",
		config(_, configEnv) {
			viteCommand = configEnv.command;
		},
		configResolved(config) {
			viteConfig = config;
		},
		buildStart() {
			invariant(viteConfig);
			if (!logged && viteCommand === "build" && viteConfig.mode === "production" && !viteConfig.build.ssr && (viteConfig.build.sourcemap || viteConfig.environments?.client?.build.sourcemap)) {
				viteConfig.logger.warn(colors.yellow("\n" + colors.bold("  ⚠️  Source maps are enabled in production\n") + [
					"This makes your server code publicly",
					"visible in the browser. This is highly",
					"discouraged! If you insist, ensure that",
					"you are using environment variables for",
					"secrets and not hard-coding them in",
					"your source code."
				].map((line) => "     " + line).join("\n") + "\n"));
				logged = true;
			}
		}
	};
}
//#endregion
//#region vite/plugins/prerender.ts
function normalizePrerenderRequest(input) {
	if (typeof input === "string" || input instanceof Request) return {
		request: input,
		metadata: void 0
	};
	return {
		request: input.request,
		metadata: input.metadata
	};
}
function normalizePostProcessResult(result) {
	if (Array.isArray(result)) return {
		files: result,
		requests: []
	};
	return {
		files: result.files,
		requests: result.requests ?? []
	};
}
/**
* Vite plugin for prerendering using the preview server
*/
function prerender(options) {
	const { config, requests, postProcess = defaultPostProcess, handleError = defaultHandleError, logFile, finalize } = options;
	let viteConfig;
	return {
		name: "prerender",
		sharedDuringBuild: true,
		config: {
			order: "post",
			handler({ builder: { buildApp } = {} }) {
				return { builder: { async buildApp(builder) {
					await buildApp?.(builder);
					const prerenderRequests = (typeof requests === "function" ? await requests() : requests).map(normalizePrerenderRequest);
					if (prerenderRequests.length === 0) return;
					const { buildDirectory = viteConfig.environments.client.build.outDir, concurrency = 1, retryCount = 0, retryDelay = 500, maxRedirects = 0, timeout = 1e4 } = (typeof config === "function" ? await config() : config) ?? {};
					let ogIsBuildRequest = process.env.IS_RR_BUILD_REQUEST;
					process.env.IS_RR_BUILD_REQUEST = "yes";
					try {
						const previewServer = await startPreviewServer(viteConfig);
						try {
							const baseUrl = getResolvedUrl(previewServer);
							async function prerenderRequest(input, metadata) {
								let attemptCount = 0;
								let redirectCount = 0;
								const request = new Request(input);
								const url = new URL(request.url);
								if (url.origin !== baseUrl.origin) {
									url.hostname = baseUrl.hostname;
									url.protocol = baseUrl.protocol;
									url.port = baseUrl.port;
								}
								async function attempt(url) {
									try {
										const signal = AbortSignal.timeout(timeout);
										const response = await nodeHttpFetch(new Request(url, request), { signal });
										if (response.status >= 300 && response.status < 400 && response.headers.has("location") && ++redirectCount <= maxRedirects) {
											const location = response.headers.get("location");
											const responseURL = new URL(response.url);
											const locationUrl = new URL(location, response.url);
											if (responseURL.origin !== locationUrl.origin) return await postProcess(request, response, metadata);
											return await attempt(new URL(location, url));
										}
										if (response.status >= 500 && ++attemptCount <= retryCount) {
											await new Promise((resolve) => setTimeout(resolve, retryDelay));
											return attempt(url);
										}
										return await postProcess(request, response, metadata);
									} catch (error) {
										if (++attemptCount <= retryCount) {
											await new Promise((resolve) => setTimeout(resolve, retryDelay));
											return attempt(url);
										}
										handleError(request, error instanceof Error ? error : new Error(error?.toString() ?? "Unknown error"), metadata);
										return [];
									}
								}
								return attempt(url);
							}
							async function prerender(input, metadata) {
								const { files, requests } = normalizePostProcessResult(await prerenderRequest(input, metadata));
								for (const file of files) await writePrerenderFile(file, metadata);
								for (const followUp of requests) {
									const normalized = normalizePrerenderRequest(followUp);
									await prerender(normalized.request, normalized.metadata);
								}
							}
							async function writePrerenderFile(file, metadata) {
								const normalizedPath = file.path.startsWith("/") ? file.path.slice(1) : file.path;
								const outputPath = path.join(buildDirectory, ...normalizedPath.split("/"));
								await mkdir(path.dirname(outputPath), { recursive: true });
								await writeFile(outputPath, file.contents);
								const relativePath = path.relative(viteConfig.root, outputPath);
								if (logFile) logFile(relativePath, metadata);
								return relativePath;
							}
							await (await import("p-map")).default(prerenderRequests, async ({ request, metadata }) => {
								await prerender(request, metadata);
							}, { concurrency });
							if (finalize) await finalize(buildDirectory);
						} finally {
							await previewServer.close();
						}
					} finally {
						process.env.IS_RR_BUILD_REQUEST = ogIsBuildRequest;
					}
				} } };
			}
		},
		configResolved(resolvedConfig) {
			viteConfig = resolvedConfig;
		}
	};
}
async function defaultPostProcess(request, response) {
	const prerenderPath = new URL(request.url).pathname;
	if (!response.ok) throw new Error(`Prerender: Request failed for ${prerenderPath}: ${response.status} ${response.statusText}`);
	return [{
		path: `${prerenderPath}/index.html`,
		contents: await response.text()
	}];
}
function defaultHandleError(request, error) {
	const prerenderPath = new URL(request.url).pathname;
	if (request.signal?.aborted) throw new Error(`Prerender: Request timed out for ${prerenderPath}: ${error.message}`);
	throw new Error(`Prerender: Request failed for ${prerenderPath}: ${error.message}`);
}
/**
* Issue prerender requests via `node:http` rather than the global `fetch`.
*
* Node's built-in `fetch` (undici) keeps a global dispatcher that pools
* keep-alive sockets. On Windows, exiting the build process with multiple
* pooled sockets to the Vite preview server still open triggers a libuv
* assertion (`!(handle->flags & UV_HANDLE_CLOSING)` in `src/win/async.c`)
* during teardown of the dispatcher's internal async handle. Closing or
* destroying the dispatcher does not clear the bad state.
*
* `node:http` without an explicit Agent closes each connection cleanly, so we
* use it here to avoid the assertion. Manual redirect handling is preserved.
*/
async function nodeHttpFetch(request, { signal }) {
	const url = new URL(request.url);
	const body = request.method === "GET" || request.method === "HEAD" ? void 0 : Buffer.from(await request.arrayBuffer());
	const headers = {};
	request.headers.forEach((value, key) => {
		headers[key] = value;
	});
	headers["connection"] = "close";
	return new Promise((resolve, reject) => {
		const req = http.request({
			protocol: url.protocol,
			hostname: url.hostname,
			port: url.port || void 0,
			path: url.pathname + url.search,
			method: request.method,
			headers,
			agent: false
		}, (res) => {
			const chunks = [];
			res.on("data", (chunk) => chunks.push(chunk));
			res.on("end", () => {
				const responseBody = Buffer.concat(chunks);
				const responseHeaders = new Headers();
				for (const [key, value] of Object.entries(res.headers)) if (Array.isArray(value)) for (const v of value) responseHeaders.append(key, v);
				else if (typeof value === "string") responseHeaders.set(key, value);
				const status = res.statusCode ?? 200;
				const init = {
					status,
					statusText: res.statusMessage ?? "",
					headers: responseHeaders
				};
				resolve(new Response(!(status === 204 || status === 205 || status === 304 || status >= 100 && status < 200) ? responseBody : null, init));
			});
			res.on("error", reject);
		});
		req.on("error", reject);
		const onAbort = () => {
			req.destroy(signal.reason instanceof Error ? signal.reason : /* @__PURE__ */ new Error("The operation was aborted"));
		};
		if (signal.aborted) onAbort();
		else signal.addEventListener("abort", onAbort, { once: true });
		if (body) req.write(body);
		req.end();
	});
}
async function startPreviewServer(viteConfig) {
	const vite = await import("vite");
	try {
		return await vite.preview({
			configFile: viteConfig.configFile,
			logLevel: "silent",
			preview: {
				port: 0,
				open: false
			}
		});
	} catch (error) {
		throw new Error("Prerender: Failed to start Vite preview server", { cause: error });
	}
}
function getResolvedUrl(previewServer) {
	const baseUrl = previewServer.resolvedUrls?.local[0];
	if (!baseUrl) throw new Error("Prerender: No resolved URL is available from the Vite preview server");
	return new URL(baseUrl);
}
//#endregion
//#region vite/plugin.ts
const nodeRequire$1 = createRequire(import.meta.url);
const SERVER_ONLY_ROUTE_EXPORTS = [
	"loader",
	"action",
	"middleware",
	"headers"
];
const CLIENT_NON_COMPONENT_EXPORTS$1 = [
	"clientAction",
	"clientLoader",
	"clientMiddleware",
	"handle",
	"meta",
	"links",
	"shouldRevalidate"
];
const CLIENT_ROUTE_EXPORTS$1 = [
	...CLIENT_NON_COMPONENT_EXPORTS$1,
	"default",
	"ErrorBoundary",
	"HydrateFallback",
	"Layout"
];
/** This is used to manage a build optimization to remove unused route exports
from the client build output. This is important in cases where custom route
exports are only ever used on the server. Without this optimization, we can't
tree-shake any unused custom exports because routes are entry points. */
const BUILD_CLIENT_ROUTE_QUERY_STRING = "?__react-router-build-client-route";
const SSR_BUNDLE_PREFIX = "ssrBundle_";
function isSsrBundleEnvironmentName(name) {
	return name.startsWith(SSR_BUNDLE_PREFIX);
}
function isReactRouterServerEnvironment(ctx, environmentName) {
	return ctx.buildManifest?.serverBundles ? isSsrBundleEnvironmentName(environmentName) : environmentName === "ssr";
}
function getServerEnvironmentEntries(ctx, record) {
	return Object.entries(record).filter(([name]) => isReactRouterServerEnvironment(ctx, name));
}
function getServerEnvironmentValues(ctx, record) {
	return getServerEnvironmentEntries(ctx, record).map(([, value]) => value);
}
const isRouteEntryModuleId = (id) => {
	return id.endsWith(BUILD_CLIENT_ROUTE_QUERY_STRING);
};
const isRouteVirtualModule = (id) => {
	return isRouteEntryModuleId(id) || isRouteChunkModuleId(id);
};
let virtualHmrRuntime = create("hmr-runtime");
let virtualInjectHmrRuntime = create("inject-hmr-runtime");
const normalizeRelativeFilePath = (file, reactRouterConfig) => {
	let vite = getVite();
	let fullPath = path$2.resolve(reactRouterConfig.appDirectory, file);
	let relativePath = path$2.relative(reactRouterConfig.appDirectory, fullPath);
	return vite.normalizePath(relativePath).split("?")[0];
};
let virtual$1 = {
	serverBuild: create("server-build"),
	serverManifest: create("server-manifest"),
	browserManifest: create("browser-manifest")
};
let invalidateVirtualModules$1 = (viteDevServer) => {
	Object.values(virtual$1).forEach((vmod) => {
		let mod = viteDevServer.moduleGraph.getModuleById(vmod.resolvedId);
		if (mod) viteDevServer.moduleGraph.invalidateModule(mod);
	});
};
const getHash = (source, maxLength) => {
	let hash = createHash("sha256").update(source).digest("hex");
	return typeof maxLength === "number" ? hash.slice(0, maxLength) : hash;
};
const resolveChunk = (ctx, viteManifest, absoluteFilePath) => {
	let entryChunk = viteManifest[getVite().normalizePath(path$2.relative(ctx.rootDirectory, absoluteFilePath))];
	if (!entryChunk) return;
	return entryChunk;
};
const getPublicModulePathForEntry = (ctx, viteManifest, entryFilePath) => {
	let entryChunk = resolveChunk(ctx, viteManifest, entryFilePath);
	return entryChunk ? `${ctx.publicPath}${entryChunk.file}` : void 0;
};
const getCssCodeSplitDisabledFile = (ctx, viteConfig, viteManifest) => {
	if (viteConfig.build.cssCodeSplit) return null;
	let cssFile = viteManifest["style.css"]?.file;
	invariant(cssFile, "Expected `style.css` to be present in Vite manifest when `build.cssCodeSplit` is disabled");
	return `${ctx.publicPath}${cssFile}`;
};
const getClientEntryChunk = (ctx, viteManifest) => {
	let filePath = ctx.entryClientFilePath;
	let chunk = resolveChunk(ctx, viteManifest, filePath);
	invariant(chunk, `Chunk not found: ${filePath}`);
	return chunk;
};
const getReactRouterManifestBuildAssets = (ctx, viteConfig, viteManifest, allDynamicCssFiles, entryFilePath, route) => {
	let entryChunk = resolveChunk(ctx, viteManifest, entryFilePath);
	invariant(entryChunk, `Chunk not found: ${entryFilePath}`);
	let isRootRoute = Boolean(route && route.parentId === void 0);
	let routeModuleChunks = routeChunkNames.map((routeChunkName) => resolveChunk(ctx, viteManifest, getRouteChunkModuleId(entryFilePath.split("?")[0], routeChunkName))).filter(isNonNullable);
	let chunks = resolveDependantChunks(viteManifest, [
		isRootRoute ? getClientEntryChunk(ctx, viteManifest) : null,
		entryChunk,
		routeModuleChunks
	].flat(1).filter(isNonNullable));
	return {
		module: `${ctx.publicPath}${entryChunk.file}`,
		imports: dedupe(chunks.flatMap((e) => e.imports ?? [])).map((imported) => {
			return `${ctx.publicPath}${viteManifest[imported].file}`;
		}) ?? [],
		css: dedupe([isRootRoute ? getCssCodeSplitDisabledFile(ctx, viteConfig, viteManifest) : null, chunks.flatMap((e) => e.css ?? []).map((href) => {
			let publicHref = `${ctx.publicPath}${href}`;
			return allDynamicCssFiles.has(href) ? `${publicHref}#` : publicHref;
		})].flat(1).filter(isNonNullable))
	};
};
function resolveDependantChunks(viteManifest, entryChunks) {
	let chunks = /* @__PURE__ */ new Set();
	function walk(chunk) {
		if (chunks.has(chunk)) return;
		chunks.add(chunk);
		if (chunk.imports) for (let importKey of chunk.imports) walk(viteManifest[importKey]);
	}
	for (let entryChunk of entryChunks) walk(entryChunk);
	return Array.from(chunks);
}
function getAllDynamicCssFiles(ctx, viteManifest) {
	let allDynamicCssFiles = /* @__PURE__ */ new Set();
	for (let route of Object.values(ctx.reactRouterConfig.routes)) {
		let entryChunk = resolveChunk(ctx, viteManifest, `${path$2.join(ctx.reactRouterConfig.appDirectory, route.file)}${BUILD_CLIENT_ROUTE_QUERY_STRING}`);
		if (entryChunk) {
			let visitedChunks = /* @__PURE__ */ new Set();
			function walk(chunk, isDynamicImportContext) {
				if (visitedChunks.has(chunk)) return;
				visitedChunks.add(chunk);
				if (isDynamicImportContext && chunk.css) for (let cssFile of chunk.css) allDynamicCssFiles.add(cssFile);
				if (chunk.dynamicImports) for (let dynamicImportKey of chunk.dynamicImports) walk(viteManifest[dynamicImportKey], true);
				if (chunk.imports) for (let importKey of chunk.imports) walk(viteManifest[importKey], isDynamicImportContext);
			}
			walk(entryChunk, false);
		}
	}
	return allDynamicCssFiles;
}
function dedupe(array) {
	return [...new Set(array)];
}
const writeFileSafe = async (file, contents) => {
	await mkdir(path$2.dirname(file), { recursive: true });
	await writeFile(file, contents);
};
const getExportNames = (code) => {
	let [, exportSpecifiers] = parse(code);
	return exportSpecifiers.map(({ n: name }) => name);
};
const getRouteManifestModuleExports = async (viteChildCompiler, ctx) => {
	let entries = await Promise.all(Object.entries(ctx.reactRouterConfig.routes).map(async ([key, route]) => {
		return [key, await getRouteModuleExports(viteChildCompiler, ctx, route.file)];
	}));
	return Object.fromEntries(entries);
};
const compileRouteFile = async (viteChildCompiler, ctx, routeFile, readRouteFile) => {
	if (!viteChildCompiler) throw new Error("Vite child compiler not found");
	let ssr = true;
	let { pluginContainer, moduleGraph } = viteChildCompiler;
	let routePath = path$2.resolve(ctx.reactRouterConfig.appDirectory, routeFile);
	let url = resolveFileUrl(ctx, routePath);
	let resolveId = async () => {
		let result = await pluginContainer.resolveId(url, void 0, { ssr });
		if (!result) throw new Error(`Could not resolve module ID for ${url}`);
		return result.id;
	};
	let [id, code] = await Promise.all([
		resolveId(),
		readRouteFile?.() ?? readFile(routePath, "utf-8"),
		moduleGraph.ensureEntryFromUrl(url, ssr)
	]);
	return (await pluginContainer.transform(code, id, { ssr })).code;
};
const getRouteModuleExports = async (viteChildCompiler, ctx, routeFile, readRouteFile) => {
	if (!viteChildCompiler) throw new Error("Vite child compiler not found");
	return getExportNames(await compileRouteFile(viteChildCompiler, ctx, routeFile, readRouteFile));
};
let getServerBuildDirectory = (reactRouterConfig, { serverBundleId } = {}) => path$2.join(reactRouterConfig.buildDirectory, "server", ...serverBundleId ? [serverBundleId] : []);
let getClientBuildDirectory$1 = (reactRouterConfig) => path$2.join(reactRouterConfig.buildDirectory, "client");
let getServerBundleRouteIds = (vitePluginContext, ctx) => {
	if (!ctx.buildManifest) return;
	let environmentName = vitePluginContext.environment.name;
	if (!environmentName || !isSsrBundleEnvironmentName(environmentName)) return;
	let serverBundleId = environmentName.replace(SSR_BUNDLE_PREFIX, "");
	let serverBundleRoutes = getRoutesByServerBundleId(ctx.buildManifest)[serverBundleId];
	invariant(serverBundleRoutes, `Routes not found for server bundle "${serverBundleId}"`);
	return Object.keys(serverBundleRoutes);
};
let defaultEntriesDir = path$2.resolve(path$2.dirname(nodeRequire$1.resolve("@react-router/dev/package.json")), "dist", "config", "defaults");
let defaultEntries = readdirSync(defaultEntriesDir).map((filename) => path$2.join(defaultEntriesDir, filename));
invariant(defaultEntries.length > 0, "No default entries found");
let reactRouterDevLoadContext = () => void 0;
/**
* React Router [Vite plugin.](https://vitejs.dev/guide/using-plugins.html)
*/
const reactRouterVitePlugin = () => {
	let rootDirectory;
	let viteCommand;
	let viteUserConfig;
	let viteConfig;
	let cssModulesManifest = {};
	let viteChildCompiler = null;
	let cache = /* @__PURE__ */ new Map();
	let reactRouterConfigLoader;
	let typegenWatcherPromise;
	let logger;
	let firstLoad = true;
	let ctx;
	let closePluginResources = async () => {
		await viteChildCompiler?.close();
		viteChildCompiler = null;
		await reactRouterConfigLoader.close();
		await (await typegenWatcherPromise)?.close();
		typegenWatcherPromise = void 0;
	};
	/** Mutates `ctx` as a side effect */
	let updatePluginContext = async () => {
		let reactRouterConfig;
		let reactRouterConfigResult = await reactRouterConfigLoader.getConfig();
		if (reactRouterConfigResult.ok) reactRouterConfig = reactRouterConfigResult.value;
		else {
			logger.error(reactRouterConfigResult.error);
			if (firstLoad) process.exit(1);
			return;
		}
		let { entryClientFilePath, entryServerFilePath } = await resolveEntryFiles({
			rootDirectory,
			reactRouterConfig
		});
		let publicPath = viteUserConfig.base ?? "/";
		if (reactRouterConfig.basename !== "/" && viteCommand === "serve" && !viteUserConfig.server?.middlewareMode && !reactRouterConfig.basename.startsWith(publicPath)) {
			logger.error(colors.red("When using the React Router `basename` and the Vite `base` config, the `basename` config must begin with `base` for the default Vite dev server."));
			process.exit(1);
		}
		let viteManifestEnabled = viteUserConfig.build?.manifest === true;
		let buildManifest = viteCommand === "build" ? await getBuildManifest({
			reactRouterConfig,
			rootDirectory
		}) : null;
		firstLoad = false;
		ctx = {
			reactRouterManifest: null,
			prerenderPaths: null,
			reactRouterConfig,
			rootDirectory,
			entryClientFilePath,
			entryServerFilePath,
			publicPath,
			viteManifestEnabled,
			buildManifest
		};
	};
	let getServerEntry = async ({ routeIds }) => {
		invariant(viteConfig, "viteconfig required to generate the server entry");
		let routes = routeIds ? pick(ctx.reactRouterConfig.routes, routeIds) : ctx.reactRouterConfig.routes;
		let prerenderPaths = await getPrerenderPaths(ctx.reactRouterConfig.prerender, ctx.reactRouterConfig.ssr, routes);
		if (!ctx.prerenderPaths) ctx.prerenderPaths = /* @__PURE__ */ new Set();
		for (let path of prerenderPaths) ctx.prerenderPaths.add(path);
		let isSpaMode = isSpaModeEnabled(ctx.reactRouterConfig);
		return `
    import * as entryServer from ${JSON.stringify(resolveFileUrl(ctx, ctx.entryServerFilePath, { publicPath: ctx.publicPath }))};
    ${Object.keys(routes).map((key, index) => {
			let route = routes[key];
			if (isSpaMode && key !== "root") return `const route${index} = { default: () => null };`;
			else return `import * as route${index} from ${JSON.stringify(resolveFileUrl(ctx, resolveRelativeRouteFilePath(route, ctx.reactRouterConfig), { publicPath: ctx.publicPath }))};`;
		}).join("\n")}
      export { default as assets } from ${JSON.stringify(virtual$1.serverManifest.id)};
      export const assetsBuildDirectory = ${JSON.stringify(path$2.relative(ctx.rootDirectory, getClientBuildDirectory$1(ctx.reactRouterConfig)))};
      export const basename = ${JSON.stringify(ctx.reactRouterConfig.basename)};
      export const future = ${JSON.stringify(ctx.reactRouterConfig.future)};
      export const ssr = ${ctx.reactRouterConfig.ssr};
      export const isSpaMode = ${isSpaMode};
      export const prerender = ${JSON.stringify(prerenderPaths)};
      export const routeDiscovery = ${JSON.stringify(ctx.reactRouterConfig.routeDiscovery)};
      export const publicPath = ${JSON.stringify(ctx.publicPath)};
      export const entry = { module: entryServer };
      export const routes = {
        ${Object.keys(routes).map((key, index) => {
			let route = routes[key];
			return `${JSON.stringify(key)}: {
          id: ${JSON.stringify(route.id)},
          parentId: ${JSON.stringify(route.parentId)},
          path: ${JSON.stringify(route.path)},
          index: ${JSON.stringify(route.index)},
          caseSensitive: ${JSON.stringify(route.caseSensitive)},
          module: route${index}
        }`;
		}).join(",\n  ")}
      };
      ${viteCommand === "serve" ? `
              export const unstable_getCriticalCss = ({ pathname }) => {
                return {
                  rel: "stylesheet",
                  href: "${ctx.publicPath}@react-router/critical.css?pathname=" + pathname,
                };
              }
            ` : ""}
      export const allowedActionOrigins = ${JSON.stringify(ctx.reactRouterConfig.allowedActionOrigins)};
    `;
	};
	let loadViteManifest = async (directory) => {
		let manifestContents = await readFile(path$2.resolve(directory, ".vite", "manifest.json"), "utf-8");
		return JSON.parse(manifestContents);
	};
	let getViteManifestAssetPaths = (viteManifest) => {
		let cssUrlPaths = Object.values(viteManifest).filter((chunk) => chunk.file.endsWith(".css")).map((chunk) => chunk.file);
		let chunkAssetPaths = Object.values(viteManifest).flatMap((chunk) => chunk.assets ?? []);
		return new Set([...cssUrlPaths, ...chunkAssetPaths]);
	};
	let generateSriManifest = async (ctx) => {
		let clientBuildDirectory = getClientBuildDirectory$1(ctx.reactRouterConfig);
		let entries = readdirSync(clientBuildDirectory, {
			withFileTypes: true,
			recursive: true
		});
		let sriManifest = {};
		for (const entry of entries) if (entry.isFile() && entry.name.endsWith(".js")) {
			const entryNormalizedPath = "parentPath" in entry && typeof entry.parentPath === "string" ? entry.parentPath : entry.path;
			let contents;
			try {
				contents = await readFile(path$2.join(entryNormalizedPath, entry.name), "utf-8");
			} catch (e) {
				logger.error(`Failed to read file for SRI generation: ${entry.name}`);
				throw e;
			}
			let hash = createHash("sha384").update(contents).digest().toString("base64");
			let filepath = getVite().normalizePath(path$2.relative(clientBuildDirectory, path$2.join(entryNormalizedPath, entry.name)));
			sriManifest[`${ctx.publicPath}${filepath}`] = `sha384-${hash}`;
		}
		return sriManifest;
	};
	let generateReactRouterManifestsForBuild = async ({ viteConfig, routeIds }) => {
		invariant(viteConfig);
		let viteManifest = await loadViteManifest(getClientBuildDirectory$1(ctx.reactRouterConfig));
		let allDynamicCssFiles = getAllDynamicCssFiles(ctx, viteManifest);
		let entry = getReactRouterManifestBuildAssets(ctx, viteConfig, viteManifest, allDynamicCssFiles, ctx.entryClientFilePath, null);
		let browserRoutes = {};
		let serverRoutes = {};
		let routeManifestExports = await getRouteManifestModuleExports(viteChildCompiler, ctx);
		let enforceSplitRouteModules = ctx.reactRouterConfig.splitRouteModules === "enforce";
		for (let route of Object.values(ctx.reactRouterConfig.routes)) {
			let routeFile = path$2.join(ctx.reactRouterConfig.appDirectory, route.file);
			let sourceExports = routeManifestExports[route.id];
			let hasClientAction = sourceExports.includes("clientAction");
			let hasClientLoader = sourceExports.includes("clientLoader");
			let hasClientMiddleware = sourceExports.includes("clientMiddleware");
			let hasHydrateFallback = sourceExports.includes("HydrateFallback");
			let { hasRouteChunkByExportName } = await detectRouteChunksIfEnabled(cache, ctx, routeFile, {
				routeFile,
				viteChildCompiler
			});
			if (enforceSplitRouteModules) validateRouteChunks$1({
				ctx,
				id: route.file,
				valid: {
					clientAction: !hasClientAction || hasRouteChunkByExportName.clientAction,
					clientLoader: !hasClientLoader || hasRouteChunkByExportName.clientLoader,
					clientMiddleware: !hasClientMiddleware || hasRouteChunkByExportName.clientMiddleware,
					HydrateFallback: !hasHydrateFallback || hasRouteChunkByExportName.HydrateFallback
				}
			});
			let routeManifestEntry = {
				id: route.id,
				parentId: route.parentId,
				path: route.path,
				index: route.index,
				caseSensitive: route.caseSensitive,
				hasAction: sourceExports.includes("action"),
				hasLoader: sourceExports.includes("loader"),
				hasClientAction,
				hasClientLoader,
				hasClientMiddleware,
				hasDefaultExport: sourceExports.includes("default"),
				hasErrorBoundary: sourceExports.includes("ErrorBoundary"),
				...getReactRouterManifestBuildAssets(ctx, viteConfig, viteManifest, allDynamicCssFiles, `${routeFile}${BUILD_CLIENT_ROUTE_QUERY_STRING}`, route),
				clientActionModule: hasRouteChunkByExportName.clientAction ? getPublicModulePathForEntry(ctx, viteManifest, getRouteChunkModuleId(routeFile, "clientAction")) : void 0,
				clientLoaderModule: hasRouteChunkByExportName.clientLoader ? getPublicModulePathForEntry(ctx, viteManifest, getRouteChunkModuleId(routeFile, "clientLoader")) : void 0,
				clientMiddlewareModule: hasRouteChunkByExportName.clientMiddleware ? getPublicModulePathForEntry(ctx, viteManifest, getRouteChunkModuleId(routeFile, "clientMiddleware")) : void 0,
				hydrateFallbackModule: hasRouteChunkByExportName.HydrateFallback ? getPublicModulePathForEntry(ctx, viteManifest, getRouteChunkModuleId(routeFile, "HydrateFallback")) : void 0
			};
			browserRoutes[route.id] = routeManifestEntry;
			if (!routeIds || routeIds.includes(route.id)) serverRoutes[route.id] = routeManifestEntry;
		}
		let fingerprintedValues = {
			entry,
			routes: browserRoutes
		};
		let version = getHash(JSON.stringify(fingerprintedValues), 8);
		let manifestPath = path$2.posix.join(viteConfig.build.assetsDir, `manifest-${version}.js`);
		let nonFingerprintedValues = {
			url: `${ctx.publicPath}${manifestPath}`,
			version
		};
		let reactRouterBrowserManifest = {
			...fingerprintedValues,
			...nonFingerprintedValues,
			sri: void 0
		};
		await writeFileSafe(path$2.join(getClientBuildDirectory$1(ctx.reactRouterConfig), manifestPath), `window.__reactRouterManifest=${JSON.stringify(reactRouterBrowserManifest)};`);
		let sri = void 0;
		if (ctx.reactRouterConfig.subResourceIntegrity) sri = await generateSriManifest(ctx);
		return {
			reactRouterBrowserManifest,
			reactRouterServerManifest: {
				...reactRouterBrowserManifest,
				routes: serverRoutes,
				sri
			}
		};
	};
	let currentReactRouterManifestForDev = null;
	let getReactRouterManifestForDev = async () => {
		let routes = {};
		let routeManifestExports = await getRouteManifestModuleExports(viteChildCompiler, ctx);
		let enforceSplitRouteModules = ctx.reactRouterConfig.splitRouteModules === "enforce";
		for (let [key, route] of Object.entries(ctx.reactRouterConfig.routes)) {
			let routeFile = route.file;
			let sourceExports = routeManifestExports[key];
			let hasClientAction = sourceExports.includes("clientAction");
			let hasClientLoader = sourceExports.includes("clientLoader");
			let hasClientMiddleware = sourceExports.includes("clientMiddleware");
			let hasHydrateFallback = sourceExports.includes("HydrateFallback");
			let routeModulePath = combineURLs(ctx.publicPath, `${resolveFileUrl(ctx, resolveRelativeRouteFilePath(route, ctx.reactRouterConfig))}`);
			if (enforceSplitRouteModules) {
				let { hasRouteChunkByExportName } = await detectRouteChunksIfEnabled(cache, ctx, routeFile, {
					routeFile,
					viteChildCompiler
				});
				validateRouteChunks$1({
					ctx,
					id: route.file,
					valid: {
						clientAction: !hasClientAction || hasRouteChunkByExportName.clientAction,
						clientLoader: !hasClientLoader || hasRouteChunkByExportName.clientLoader,
						clientMiddleware: !hasClientMiddleware || hasRouteChunkByExportName.clientMiddleware,
						HydrateFallback: !hasHydrateFallback || hasRouteChunkByExportName.HydrateFallback
					}
				});
			}
			routes[key] = {
				id: route.id,
				parentId: route.parentId,
				path: route.path,
				index: route.index,
				caseSensitive: route.caseSensitive,
				module: routeModulePath,
				clientActionModule: void 0,
				clientLoaderModule: void 0,
				clientMiddlewareModule: void 0,
				hydrateFallbackModule: void 0,
				hasAction: sourceExports.includes("action"),
				hasLoader: sourceExports.includes("loader"),
				hasClientAction,
				hasClientLoader,
				hasClientMiddleware,
				hasDefaultExport: sourceExports.includes("default"),
				hasErrorBoundary: sourceExports.includes("ErrorBoundary"),
				imports: []
			};
		}
		let reactRouterManifestForDev = {
			version: String(Math.random()),
			url: combineURLs(ctx.publicPath, virtual$1.browserManifest.url),
			hmr: { runtime: combineURLs(ctx.publicPath, virtualInjectHmrRuntime.url) },
			entry: {
				module: combineURLs(ctx.publicPath, resolveFileUrl(ctx, ctx.entryClientFilePath)),
				imports: []
			},
			sri: void 0,
			routes
		};
		currentReactRouterManifestForDev = reactRouterManifestForDev;
		return reactRouterManifestForDev;
	};
	const loadCssContents = async (viteDevServer, dep) => {
		invariant(viteCommand === "serve", "loadCssContents is only available in dev mode");
		if (dep.file && isCssModulesFile(dep.file)) return cssModulesManifest[dep.file];
		let transformedCssCode = (await viteDevServer.transformRequest(dep.url))?.code;
		invariant(transformedCssCode, `Failed to load CSS for ${dep.file ?? dep.url}`);
		let cssString = getCssStringFromViteDevModuleCode(transformedCssCode);
		invariant(typeof cssString === "string", `Failed to extract CSS for ${dep.file ?? dep.url}`);
		return cssString;
	};
	return [
		{
			name: "react-router",
			config: async (_viteUserConfig, _viteConfigEnv) => {
				await preloadVite();
				let vite = getVite();
				viteUserConfig = _viteUserConfig;
				viteCommand = _viteConfigEnv.command;
				let viteClientConditions = [...vite.defaultClientConditions ?? []];
				logger = vite.createLogger(viteUserConfig.logLevel, { prefix: "[react-router]" });
				rootDirectory = viteUserConfig.root ?? process.env.REACT_ROUTER_ROOT ?? process.cwd();
				let mode = _viteConfigEnv.mode;
				if (viteCommand === "serve") typegenWatcherPromise = watch(rootDirectory, {
					mode,
					rsc: false,
					logger: vite.createLogger("warn", { prefix: "[react-router]" })
				});
				await loadDotenv({
					rootDirectory,
					viteUserConfig,
					mode
				});
				reactRouterConfigLoader = await createConfigLoader({
					rootDirectory,
					mode,
					watch: viteCommand === "serve"
				});
				await updatePluginContext();
				let environments = await getEnvironmentsOptions(ctx, viteCommand, { viteUserConfig });
				let serverEnvironment = getServerEnvironmentValues(ctx, environments)[0];
				invariant(serverEnvironment);
				return {
					__reactRouterPluginContext: ctx,
					appType: viteCommand === "serve" && _viteConfigEnv.mode === "production" && ctx.reactRouterConfig.ssr === false ? "spa" : "custom",
					ssr: {
						external: serverEnvironment.resolve?.external,
						resolve: serverEnvironment.resolve
					},
					optimizeDeps: {
						entries: getOptimizeDepsEntries({
							entryClientFilePath: ctx.entryClientFilePath,
							reactRouterConfig: ctx.reactRouterConfig
						}),
						include: [
							"react",
							"react/jsx-runtime",
							"react/jsx-dev-runtime",
							"react-dom",
							"react-dom/client",
							"react-router",
							"react-router/dom"
						]
					},
					...defineCompilerOptions({
						oxc: { jsx: {
							runtime: "automatic",
							development: viteCommand !== "build"
						} },
						esbuild: {
							jsx: "automatic",
							jsxDev: viteCommand !== "build"
						}
					}),
					resolve: {
						dedupe: [
							"react",
							"react-dom",
							"react-router",
							"react-router/dom"
						],
						conditions: viteCommand === "build" ? viteClientConditions : ["development", ...viteClientConditions]
					},
					base: viteUserConfig.base,
					server: viteUserConfig.server?.fs?.allow ? { fs: { allow: defaultEntries } } : void 0,
					environments,
					build: { ssrEmitAssets: true },
					builder: {
						sharedConfigBuild: true,
						sharedPlugins: true,
						async buildApp(builder) {
							invariant(viteConfig);
							viteConfig.logger.info("Using Vite Environment API");
							await cleanBuildDirectory(viteConfig, ctx);
							await builder.build(builder.environments.client);
							let serverEnvironments = getServerEnvironmentValues(ctx, builder.environments);
							await Promise.all(serverEnvironments.map(builder.build));
							await cleanViteManifests(environments, ctx);
						}
					}
				};
			},
			configEnvironment(name, options) {
				if (isReactRouterServerEnvironment(ctx, name)) {
					const vite = getVite();
					return {
						resolve: { external: options.resolve?.noExternal === true ? void 0 : ssrExternals },
						optimizeDeps: options.optimizeDeps?.noDiscovery === false ? {
							entries: [vite.normalizePath(ctx.entryServerFilePath), ...Object.values(ctx.reactRouterConfig.routes).map((route) => resolveRelativeRouteFilePath(route, ctx.reactRouterConfig))],
							include: [
								"react",
								"react/jsx-dev-runtime",
								"react-dom/server",
								"react-router"
							]
						} : void 0
					};
				}
			},
			async configResolved(resolvedViteConfig) {
				await init;
				viteConfig = resolvedViteConfig;
				invariant(viteConfig);
				if (!viteConfig.configFile) throw new Error("The React Router Vite plugin requires the use of a Vite config file");
				let vite = getVite();
				let childCompilerConfigFile = await vite.loadConfigFromFile({
					command: viteConfig.command,
					mode: viteConfig.mode
				}, viteConfig.configFile);
				invariant(childCompilerConfigFile, "Vite config file was unable to be resolved for React Router child compiler");
				const childCompilerPlugins = await asyncFlatten(childCompilerConfigFile.config.plugins ?? []);
				viteChildCompiler = await vite.createServer({
					...viteUserConfig,
					cacheDir: "node_modules/.vite-child-compiler",
					mode: viteConfig.mode,
					server: {
						watch: viteConfig.command === "build" ? null : viteConfig.server.watch,
						preTransformRequests: false,
						hmr: false
					},
					configFile: false,
					envDir: false,
					plugins: [childCompilerPlugins.filter((plugin) => typeof plugin === "object" && plugin !== null && "name" in plugin && plugin.name !== "react-router" && plugin.name !== "react-router:route-exports" && plugin.name !== "react-router:hmr-updates" && plugin.name !== "react-router:validate-plugin-order").map((plugin) => ({
						...plugin,
						configureServer: void 0,
						configurePreviewServer: void 0
					}))]
				});
				await viteChildCompiler.pluginContainer.buildStart({});
			},
			async transform(code, id) {
				if (isCssModulesFile(id)) cssModulesManifest[id] = code;
			},
			async configureServer(viteDevServer) {
				unstable_setDevServerHooks({
					getCriticalCss: async (pathname) => {
						return getStylesForPathname({
							rootDirectory: ctx.rootDirectory,
							entryClientFilePath: ctx.entryClientFilePath,
							reactRouterConfig: ctx.reactRouterConfig,
							viteDevServer,
							loadCssContents,
							pathname
						});
					},
					processRequestError: (error) => {
						if (error instanceof Error) {
							if (!getVite().isRunnableDevEnvironment(viteDevServer.environments.ssr)) viteDevServer.ssrFixStacktrace(error);
						}
					}
				});
				reactRouterConfigLoader.onChange(async ({ result, configCodeChanged, routeConfigCodeChanged, configChanged, routeConfigChanged }) => {
					if (!result.ok) {
						invalidateVirtualModules$1(viteDevServer);
						logger.error(result.error, {
							clear: true,
							timestamp: true
						});
						return;
					}
					let message = configChanged ? "Config changed." : routeConfigChanged ? "Route config changed." : configCodeChanged ? "Config saved." : routeConfigCodeChanged ? " Route config saved." : "Config saved";
					logger.info(colors.green(message), {
						clear: true,
						timestamp: true
					});
					await updatePluginContext();
					if (configChanged || routeConfigChanged) invalidateVirtualModules$1(viteDevServer);
				});
				viteDevServer.middlewares.use(async (req, res, next) => {
					let [reqPathname, reqSearch] = (req.url ?? "").split("?");
					if (reqPathname.endsWith("/@react-router/critical.css")) {
						let pathname = new URLSearchParams(reqSearch).get("pathname");
						if (!pathname) return next("No pathname provided");
						let css = await getStylesForPathname({
							rootDirectory: ctx.rootDirectory,
							entryClientFilePath: ctx.entryClientFilePath,
							reactRouterConfig: ctx.reactRouterConfig,
							viteDevServer,
							loadCssContents,
							pathname
						});
						res.setHeader("Content-Type", "text/css");
						res.end(css);
					} else next();
				});
				return () => {
					if (!viteDevServer.config.server.middlewareMode) viteDevServer.middlewares.use(async (req, res, next) => {
						try {
							let vite = getVite();
							let ssrEnvironment = viteDevServer.environments.ssr;
							if (!vite.isRunnableDevEnvironment(ssrEnvironment)) {
								next();
								return;
							}
							let handler = createRequestHandler(await ssrEnvironment.runner.import(virtual$1.serverBuild.id), "development");
							let nodeHandler = async (nodeReq, nodeRes) => {
								let req = await fromNodeRequest(nodeReq, nodeRes);
								await sendResponse(nodeRes, await handler(req, await reactRouterDevLoadContext(req)));
							};
							await nodeHandler(req, res);
						} catch (error) {
							next(error);
						}
					});
				};
			},
			configurePreviewServer(previewServer) {
				let cachedHandler = null;
				async function getHandler() {
					if (cachedHandler) return cachedHandler;
					let bundledHandlers = [];
					let buildManifest = ctx.buildManifest ?? (ctx.reactRouterConfig.serverBundles ? await getBuildManifest({
						reactRouterConfig: ctx.reactRouterConfig,
						rootDirectory: ctx.rootDirectory
					}) : null);
					if (buildManifest?.serverBundles) {
						let routesByServerBundleId = getRoutesByServerBundleId(buildManifest);
						for (let bundle of Object.values(buildManifest.serverBundles)) {
							let build = await import(url.pathToFileURL(path$2.resolve(ctx.rootDirectory, bundle.file)).href);
							bundledHandlers.push({
								handler: createRequestHandler(build, "production"),
								routes: createPrerenderRoutes(routesByServerBundleId[bundle.id] ?? {})
							});
						}
					} else {
						let serverEntryPath = path$2.resolve(getServerBuildDirectory(ctx.reactRouterConfig), "index.js");
						let build = await import(url.pathToFileURL(serverEntryPath).href);
						bundledHandlers.push({
							handler: createRequestHandler(build, "production"),
							routes: null
						});
					}
					cachedHandler = async (request, loadContext) => {
						let response;
						let handlersToTry = bundledHandlers;
						if (buildManifest?.serverBundles) {
							let pathname = new URL(request.url).pathname;
							handlersToTry = bundledHandlers.map((entry, index) => ({
								entry,
								index,
								matchDepth: matchRoutes(entry.routes ?? [], pathname, ctx.reactRouterConfig.basename)?.length ?? -1
							})).sort((a, b) => b.matchDepth - a.matchDepth || a.index - b.index).map(({ entry }) => entry);
						}
						for (let { handler } of handlersToTry) {
							response = await handler(request, loadContext);
							if (response.status !== 404) return response;
						}
						if (response) return response;
						let url = new URL(request.url);
						throw new Error("No handlers were found for the request: " + url.pathname + url.search);
					};
					return cachedHandler;
				}
				return () => {
					previewServer.middlewares.use(async (req, res, next) => {
						if (!ctx.reactRouterConfig.ssr && (!process.env.hasOwnProperty("IS_RR_BUILD_REQUEST") ? true : process.env.IS_RR_BUILD_REQUEST !== "yes")) return next();
						try {
							let handler = await getHandler();
							let request = await fromNodeRequest(req, res);
							await sendResponse(res, await handler(request, await reactRouterDevLoadContext(request)));
						} catch (error) {
							next(error);
						}
					});
				};
			},
			writeBundle: { async handler() {
				if (!isReactRouterServerEnvironment(ctx, this.environment.name)) return;
				invariant(viteConfig);
				let clientBuildDirectory = getClientBuildDirectory$1(ctx.reactRouterConfig);
				let serverBuildDirectory = this.environment.config?.build?.outDir;
				invariant(serverBuildDirectory);
				let ssrViteManifest = await loadViteManifest(serverBuildDirectory);
				let ssrAssetPaths = getViteManifestAssetPaths(ssrViteManifest);
				let userSsrEmitAssets = viteUserConfig.environments?.ssr?.build?.ssrEmitAssets ?? viteUserConfig.environments?.ssr?.build?.emitAssets ?? viteUserConfig.build?.ssrEmitAssets ?? false;
				let movedAssetPaths = [];
				let removedAssetPaths = [];
				let copiedAssetPaths = [];
				for (let ssrAssetPath of ssrAssetPaths) {
					let src = path$2.join(serverBuildDirectory, ssrAssetPath);
					let dest = path$2.join(clientBuildDirectory, ssrAssetPath);
					if (!userSsrEmitAssets) if (!existsSync(dest)) {
						await mkdir(path$2.dirname(dest), { recursive: true });
						await rename(src, dest);
						movedAssetPaths.push(dest);
					} else {
						await rm(src, {
							force: true,
							recursive: true
						});
						removedAssetPaths.push(dest);
					}
					else if (!existsSync(dest)) {
						await cp(src, dest, { recursive: true });
						copiedAssetPaths.push(dest);
					}
				}
				if (!userSsrEmitAssets) {
					let ssrCssPaths = Object.values(ssrViteManifest).flatMap((chunk) => chunk.css ?? []);
					await Promise.all(ssrCssPaths.map(async (cssPath) => {
						let src = path$2.join(serverBuildDirectory, cssPath);
						await rm(src, {
							force: true,
							recursive: true
						});
						removedAssetPaths.push(src);
					}));
				}
				let cleanedAssetPaths = [...removedAssetPaths, ...movedAssetPaths];
				let handledAssetPaths = [...cleanedAssetPaths, ...copiedAssetPaths];
				let cleanedAssetDirs = new Set(cleanedAssetPaths.map(path$2.dirname));
				await Promise.all(Array.from(cleanedAssetDirs).map(async (dir) => {
					try {
						if ((await readdir(dir, { recursive: true })).length === 0) await rm(dir, {
							force: true,
							recursive: true
						});
					} catch {}
				}));
				if (handledAssetPaths.length) viteConfig.logger.info("");
				function logHandledAssets(paths, message) {
					invariant(viteConfig);
					if (paths.length) viteConfig.logger.info([`${colors.green("✓")} ${message}`, ...paths.map((assetPath) => colors.dim(path$2.relative(ctx.rootDirectory, assetPath)))].join("\n"));
				}
				logHandledAssets(removedAssetPaths, `${removedAssetPaths.length} asset${removedAssetPaths.length > 1 ? "s" : ""} cleaned from React Router server build.`);
				logHandledAssets(movedAssetPaths, `${movedAssetPaths.length} asset${movedAssetPaths.length > 1 ? "s" : ""} moved from React Router server build to client assets.`);
				logHandledAssets(copiedAssetPaths, `${copiedAssetPaths.length} asset${copiedAssetPaths.length > 1 ? "s" : ""} copied from React Router server build to client assets.`);
				if (handledAssetPaths.length) viteConfig.logger.info("");
			} },
			async buildEnd() {
				if (viteConfig?.command !== "build") await closePluginResources();
			}
		},
		{
			name: "react-router:route-chunks-index",
			async transform(code, id, options) {
				if (viteCommand !== "build") return;
				if (options?.ssr) return;
				if (!isRoute(ctx.reactRouterConfig, id)) return;
				if (isRouteVirtualModule(id)) return;
				let { hasRouteChunks, chunkedExports } = await detectRouteChunksIfEnabled(cache, ctx, id, code);
				if (!hasRouteChunks) return;
				let sourceExports = await getRouteModuleExports(viteChildCompiler, ctx, id);
				let isMainChunkExport = (name) => !chunkedExports.includes(name);
				let mainChunkReexports = sourceExports.filter(isMainChunkExport).join(", ");
				let chunkBasePath = `./${path$2.basename(id)}`;
				return [`export { ${mainChunkReexports} } from "${getRouteChunkModuleId(chunkBasePath, "main")}";`, ...chunkedExports.map((exportName) => `export { ${exportName} } from "${getRouteChunkModuleId(chunkBasePath, exportName)}";`)].filter(Boolean).join("\n");
			}
		},
		{
			name: "react-router:build-client-route",
			async transform(code, id, options) {
				if (!id.endsWith(BUILD_CLIENT_ROUTE_QUERY_STRING)) return;
				let routeModuleId = id.replace(BUILD_CLIENT_ROUTE_QUERY_STRING, "");
				let routeFileName = path$2.basename(routeModuleId);
				let sourceExports = await getRouteModuleExports(viteChildCompiler, ctx, routeModuleId);
				let { chunkedExports = [] } = options?.ssr ? {} : await detectRouteChunksIfEnabled(cache, ctx, id, code);
				return `export { ${sourceExports.filter((exportName) => {
					let isRouteEntryExport = options?.ssr && SERVER_ONLY_ROUTE_EXPORTS.includes(exportName) || CLIENT_ROUTE_EXPORTS$1.includes(exportName);
					let isChunkedExport = chunkedExports.includes(exportName);
					return isRouteEntryExport && !isChunkedExport;
				}).join(", ")} } from "./${routeFileName}";`;
			}
		},
		{
			name: "react-router:split-route-modules",
			async transform(code, id, options) {
				if (options?.ssr) return;
				if (!isRouteChunkModuleId(id)) return;
				invariant(viteCommand === "build", "Route modules are only split in build mode");
				let chunkName = getRouteChunkNameFromModuleId(id);
				if (!chunkName) throw new Error(`Invalid route chunk name "${chunkName}" in "${id}"`);
				let chunk = await getRouteChunkIfEnabled(cache, ctx, id, chunkName, code);
				let preventEmptyChunkSnippet = ({ reason }) => `Math.random()<0&&console.log(${JSON.stringify(reason)});`;
				if (chunk === null) return preventEmptyChunkSnippet({ reason: "Split round modules disabled" });
				if (ctx.reactRouterConfig.splitRouteModules === "enforce" && chunkName === "main" && chunk) {
					let exportNames = getExportNames(chunk.code);
					validateRouteChunks$1({
						ctx,
						id,
						valid: {
							clientAction: !exportNames.includes("clientAction"),
							clientLoader: !exportNames.includes("clientLoader"),
							clientMiddleware: !exportNames.includes("clientMiddleware"),
							HydrateFallback: !exportNames.includes("HydrateFallback")
						}
					});
				}
				return chunk ?? preventEmptyChunkSnippet({ reason: `No ${chunkName} chunk` });
			}
		},
		{
			name: "react-router:virtual-modules",
			enforce: "pre",
			resolveId(id) {
				const vmod = Object.values(virtual$1).find((vmod) => vmod.id === id);
				if (vmod) return vmod.resolvedId;
			},
			async load(id) {
				switch (id) {
					case virtual$1.serverBuild.resolvedId: return await getServerEntry({ routeIds: getServerBundleRouteIds(this, ctx) });
					case virtual$1.serverManifest.resolvedId: {
						let routeIds = getServerBundleRouteIds(this, ctx);
						invariant(viteConfig);
						let reactRouterServerManifest;
						if (viteCommand === "build") {
							let { reactRouterBrowserManifest, reactRouterServerManifest: serverManifest } = await generateReactRouterManifestsForBuild({
								viteConfig,
								routeIds
							});
							reactRouterServerManifest = serverManifest;
							ctx.reactRouterManifest = reactRouterBrowserManifest;
						} else {
							reactRouterServerManifest = await getReactRouterManifestForDev();
							ctx.reactRouterManifest = reactRouterServerManifest;
						}
						if (!ctx.reactRouterConfig.ssr) {
							invariant(viteConfig);
							validateSsrFalsePrerenderExports(viteConfig, ctx, reactRouterServerManifest, viteChildCompiler);
						}
						return `export default ${jsesc(reactRouterServerManifest, { es6: true })};`;
					}
					case virtual$1.browserManifest.resolvedId:
						if (viteCommand === "build") throw new Error("This module only exists in development");
						return `window.__reactRouterManifest=${jsesc(await getReactRouterManifestForDev(), { es6: true })};`;
				}
			}
		},
		{
			name: "react-router:dot-server",
			enforce: "pre",
			async resolveId(id, importer, options) {
				if (viteCommand === "serve" && options?.scan === true || options?.ssr) return;
				if (options?.custom?.["react-router:dot-server"] ?? false) return;
				options.custom = {
					...options.custom,
					"react-router:dot-server": true
				};
				let resolved = await this.resolve(id, importer, options);
				if (!resolved) return;
				if (!(/\.server(\.[cm]?[jt]sx?)?$/.test(resolved.id) || /\/\.server\//.test(resolved.id))) return;
				if (!importer) return;
				if (viteCommand !== "build" && importer.endsWith(".html")) return;
				let importerShort = getVite().normalizePath(path$2.relative(ctx.rootDirectory, importer));
				if (isRoute(ctx.reactRouterConfig, importer)) {
					let serverOnlyExports = SERVER_ONLY_ROUTE_EXPORTS.map((xport) => `\`${xport}\``).join(", ");
					throw Error([
						colors.red(`Server-only module referenced by client`),
						"",
						`    '${id}' imported by route '${importerShort}'`,
						"",
						`  React Router automatically removes server-code from these exports:`,
						`    ${serverOnlyExports}`,
						"",
						`  But other route exports in '${importerShort}' depend on '${id}'.`,
						"",
						"  See https://reactrouter.com/explanation/code-splitting#removal-of-server-code",
						""
					].join("\n"));
				}
				throw Error([
					colors.red(`Server-only module referenced by client`),
					"",
					`    '${id}' imported by '${importerShort}'`,
					"",
					"  See https://reactrouter.com/explanation/code-splitting#removal-of-server-code",
					""
				].join("\n"));
			}
		},
		{
			name: "react-router:dot-client",
			async transform(code, id, options) {
				if (!options?.ssr) return;
				if (/\.client(\.[cm]?[jt]sx?)?$/.test(id) || /\/\.client\//.test(id)) return {
					code: getExportNames(code).map((name) => name === "default" ? "export default undefined;" : `export const ${name} = undefined;`).join("\n"),
					map: null
				};
			}
		},
		{
			name: "react-router:route-exports",
			async transform(code, id, options) {
				if (isRouteChunkModuleId(id)) id = id.split("?")[0];
				let route = getRoute(ctx.reactRouterConfig, id);
				if (!route) return;
				if (!options?.ssr && isSpaModeEnabled(ctx.reactRouterConfig)) {
					let exportNames = getExportNames(code);
					let serverOnlyExports = exportNames.filter((exp) => {
						if (route.id === "root" && exp === "loader") return false;
						return SERVER_ONLY_ROUTE_EXPORTS.includes(exp);
					});
					if (serverOnlyExports.length > 0) {
						let str = serverOnlyExports.map((e) => `\`${e}\``).join(", ");
						let message = `SPA Mode: ${serverOnlyExports.length} invalid route export(s) in \`${route.file}\`: ${str}. See https://reactrouter.com/how-to/spa for more information.`;
						throw Error(message);
					}
					if (route.id !== "root") {
						if (exportNames.some((exp) => exp === "HydrateFallback")) {
							let message = `SPA Mode: Invalid \`HydrateFallback\` export found in \`${route.file}\`. \`HydrateFallback\` is only permitted on the root route in SPA Mode. See https://reactrouter.com/how-to/spa for more information.`;
							throw Error(message);
						}
					}
				}
				let [filepath] = id.split("?");
				let ast = parse$1(code, { sourceType: "module" });
				if (!options?.ssr) removeExports(ast, SERVER_ONLY_ROUTE_EXPORTS);
				decorateComponentExportsWithProps(ast);
				return generate(ast, {
					sourceMaps: true,
					filename: id,
					sourceFileName: filepath
				});
			}
		},
		{
			name: "react-router:inject-hmr-runtime",
			enforce: "pre",
			resolveId(id) {
				if (id === virtualInjectHmrRuntime.id) return virtualInjectHmrRuntime.resolvedId;
			},
			async load(id) {
				if (id !== virtualInjectHmrRuntime.resolvedId) return;
				return [
					`import RefreshRuntime from "${virtualHmrRuntime.id}"`,
					"RefreshRuntime.injectIntoGlobalHook(window)",
					"window.$RefreshReg$ = () => {}",
					"window.$RefreshSig$ = () => (type) => type",
					"window.__vite_plugin_react_preamble_installed__ = true"
				].join("\n");
			}
		},
		{
			name: "react-router:hmr-runtime",
			enforce: "pre",
			resolveId(id) {
				if (id === virtualHmrRuntime.id) return virtualHmrRuntime.resolvedId;
			},
			async load(id) {
				if (id !== virtualHmrRuntime.resolvedId) return;
				let reactRefreshDir = path$2.dirname(nodeRequire$1.resolve("react-refresh/package.json"));
				return [
					"const exports = {}",
					await readFile(path$2.join(reactRefreshDir, "cjs/react-refresh-runtime.development.js"), "utf8"),
					await readFile(nodeRequire$1.resolve("./static/refresh-utils.mjs"), "utf8"),
					"export default exports"
				].join("\n");
			}
		},
		{
			name: "react-router:react-refresh-babel",
			async transform(code, id, options) {
				if (viteCommand !== "serve") return;
				if (id.includes("/node_modules/")) return;
				let [filepath] = id.split("?");
				if (!/\.(jsx?|tsx?|mdx?)$/.test(filepath)) return;
				let devRuntime = "react/jsx-dev-runtime";
				let ssr = options?.ssr === true;
				let isJSX = filepath.endsWith("x");
				if (!(!ssr && (isJSX || code.includes(devRuntime)))) return;
				if (isRouteVirtualModule(id)) return { code: addRefreshWrapper(ctx.reactRouterConfig, code, id) };
				let result = await babel.transformAsync(code, {
					babelrc: false,
					configFile: false,
					filename: id,
					sourceFileName: filepath,
					parserOpts: {
						sourceType: "module",
						allowAwaitOutsideFunction: true
					},
					plugins: [[nodeRequire$1.resolve("react-refresh/babel"), { skipEnvCheck: true }]],
					sourceMaps: true
				});
				if (result === null) return;
				code = result.code;
				if (/\$Refresh(?:Reg|Sig)\$\(/.test(code)) code = addRefreshWrapper(ctx.reactRouterConfig, code, id);
				return {
					code,
					map: result.map
				};
			}
		},
		{
			name: "react-router:hmr-updates",
			async handleHotUpdate({ server, file, modules, read }) {
				let route = getRoute(ctx.reactRouterConfig, file);
				let hmrEventData = { route: null };
				if (route) {
					let oldRouteMetadata = currentReactRouterManifestForDev?.routes[route.id];
					let newRouteMetadata = await getRouteMetadata(cache, ctx, viteChildCompiler, route, read);
					hmrEventData.route = newRouteMetadata;
					if (!oldRouteMetadata || [
						"hasLoader",
						"hasClientLoader",
						"clientLoaderModule",
						"hasAction",
						"hasClientAction",
						"clientActionModule",
						"hasClientMiddleware",
						"clientMiddlewareModule",
						"hasErrorBoundary",
						"hydrateFallbackModule"
					].some((key) => oldRouteMetadata[key] !== newRouteMetadata[key])) invalidateVirtualModules$1(server);
				}
				server.hot.send({
					type: "custom",
					event: "react-router:hmr",
					data: hmrEventData
				});
				return modules;
			}
		},
		{
			name: "react-router-server-change-trigger-client-hmr",
			hotUpdate({ server, modules }) {
				if (this.environment.name !== "ssr" && modules.length <= 0) return;
				let clientModules = modules.flatMap((mod) => getParentClientNodes(server.environments.client.moduleGraph, mod));
				for (let clientModule of clientModules) server.environments.client.reloadModule(clientModule);
			}
		},
		prerender({
			config() {
				process.env.IS_RR_BUILD_REQUEST = "yes";
				return {
					buildDirectory: getClientBuildDirectory$1(ctx.reactRouterConfig),
					concurrency: getPrerenderConcurrencyConfig$1(ctx.reactRouterConfig)
				};
			},
			async requests() {
				invariant(viteConfig);
				let requests = [];
				if (isPrerenderingEnabled(ctx.reactRouterConfig)) {
					invariant(ctx.prerenderPaths !== null, "Prerender paths missing");
					invariant(ctx.reactRouterManifest !== null, "Prerender manifest missing");
					let { reactRouterConfig, reactRouterManifest, prerenderPaths } = ctx;
					assertPrerenderPathsMatchRoutes(reactRouterConfig, Array.from(prerenderPaths));
					let buildRoutes = createPrerenderRoutes(reactRouterManifest.routes);
					for (let prerenderPath of prerenderPaths) {
						let matches = matchRoutes(buildRoutes, `/${prerenderPath}/`.replace(/^\/\/+/, "/"));
						if (!matches) continue;
						let leafRoute = matches[matches.length - 1].route;
						let manifestRoute = reactRouterManifest.routes[leafRoute.id];
						if (manifestRoute && !manifestRoute.hasDefaultExport && !manifestRoute.hasErrorBoundary) if (manifestRoute?.hasLoader) requests.push(createDataRequest(prerenderPath, reactRouterConfig, [leafRoute.id], true), createResourceRouteRequest(prerenderPath, reactRouterConfig));
						else viteConfig.logger.warn(`⚠️ Skipping prerendering for resource route without a loader: ${leafRoute.id}`);
						else if (matches.some((m) => reactRouterManifest.routes[m.route.id]?.hasLoader)) requests.push(createDataRequest(prerenderPath, reactRouterConfig, null));
						else requests.push(createRouteRequest(prerenderPath, reactRouterConfig));
					}
				}
				if (!ctx.reactRouterConfig.ssr) requests.push(createSpaModeRequest(ctx.reactRouterConfig));
				return requests;
			},
			async postProcess(request, response, metadata) {
				invariant(metadata);
				if (metadata.type === "data") {
					let pathname = new URL(request.url).pathname;
					if (response.status !== 200 && response.status !== 202) throw new Error(`Prerender (data): Received a ${response.status} status code from \`entry.server.tsx\` while prerendering the \`${metadata.path}\` path.\n${pathname}`, { cause: response });
					let data = await response.text();
					return {
						files: [{
							path: pathname,
							contents: data
						}],
						requests: !metadata.isResourceRoute ? [createRouteRequest(metadata.path, ctx.reactRouterConfig, data)] : []
					};
				}
				if (metadata.type === "resource") {
					let pathname = new URL(request.url).pathname;
					let contents = new Uint8Array(await response.arrayBuffer());
					if (response.status !== 200) throw new Error(`Prerender (resource): Received a ${response.status} status code from \`entry.server.tsx\` while prerendering the \`${pathname}\` path.\n${new TextDecoder().decode(contents)}`);
					return [{
						path: pathname,
						contents
					}];
				}
				let html = await response.text();
				if (metadata.type === "spa") {
					if (response.status !== 200) throw new Error(`SPA Mode: Received a ${response.status} status code from \`entry.server.tsx\` while prerendering your SPA Fallback HTML file.\n` + html);
					if (!html.includes("window.__reactRouterContext =") || !html.includes("window.__reactRouterRouteModules =")) throw new Error("SPA Mode: Did you forget to include `<Scripts/>` in your root route? Your pre-rendered HTML cannot hydrate without `<Scripts />`.");
					return [{
						path: "/__spa-fallback.html",
						contents: html
					}];
				}
				let pathname = new URL(request.url).pathname;
				if (redirectStatusCodes$1.has(response.status)) {
					let location = response.headers.get("Location");
					let delay = response.status === 302 ? 2 : 0;
					let escapedLocation = escapeHtml(location ?? "");
					html = `<!doctype html>
<head>
<title>Redirecting to: ${escapedLocation}</title>
<meta http-equiv="refresh" content="${delay};url=${escapedLocation}">
<meta name="robots" content="noindex">
</head>
<body>
	<a href="${escapedLocation}">
    Redirecting from <code>${escapeHtml(pathname)}</code> to <code>${escapedLocation}</code>
  </a>
</body>
</html>`;
				} else if (response.status !== 200) throw new Error(`Prerender (html): Received a ${response.status} status code from \`entry.server.tsx\` while prerendering the \`${pathname}\` path.\n${html}`);
				return [{
					path: `${pathname}/index.html`,
					contents: html
				}];
			},
			logFile(outputPath, metadata) {
				invariant(viteConfig);
				invariant(metadata);
				if (metadata.type === "spa") return;
				viteConfig.logger.info(`Prerender (${metadata.type}): ${metadata.path} -> ${colors.bold(outputPath)}`);
			},
			async finalize(buildDirectory) {
				invariant(viteConfig);
				let { ssr } = ctx.reactRouterConfig;
				if (!ssr) {
					let spaFallback = path$2.join(buildDirectory, "__spa-fallback.html");
					let index = path$2.join(buildDirectory, "index.html");
					let finalSpaPath;
					if (existsSync(spaFallback) && !existsSync(index)) {
						await rename(spaFallback, index);
						finalSpaPath = index;
					} else if (existsSync(spaFallback)) finalSpaPath = spaFallback;
					if (finalSpaPath) {
						let prettyPath = path$2.relative(viteConfig.root, finalSpaPath);
						if (ctx.prerenderPaths && ctx.prerenderPaths.size > 0) viteConfig.logger.info(`Prerender (html): SPA Fallback -> ${colors.bold(prettyPath)}`);
						else viteConfig.logger.info(`SPA Mode: Generated ${colors.bold(prettyPath)}`);
					}
				}
			}
		}),
		{
			name: "react-router-build-end",
			sharedDuringBuild: true,
			config: {
				order: "post",
				handler({ builder: { buildApp } = {} }) {
					return { builder: { async buildApp(builder) {
						try {
							await buildApp?.(builder);
							invariant(viteConfig);
							let { buildManifest, reactRouterConfig } = ctx;
							invariant(buildManifest, "Expected build manifest");
							await reactRouterConfig.buildEnd?.({
								buildManifest,
								reactRouterConfig,
								viteConfig
							});
						} finally {
							await closePluginResources();
						}
					} } };
				}
			}
		},
		validatePluginOrder(),
		warnOnClientSourceMaps()
	];
};
function getParentClientNodes(clientModuleGraph, module, seenNodes = /* @__PURE__ */ new Set()) {
	if (!module.id) return [];
	if (seenNodes.has(module.url)) return [];
	seenNodes.add(module.url);
	let clientModule = clientModuleGraph.getModuleById(module.id);
	if (clientModule) return [clientModule];
	return [...module.importers].flatMap((importer) => getParentClientNodes(clientModuleGraph, importer, seenNodes));
}
function addRefreshWrapper(reactRouterConfig, code, id) {
	let route = getRoute(reactRouterConfig, id);
	let acceptExports = route ? CLIENT_NON_COMPONENT_EXPORTS$1 : [];
	return REACT_REFRESH_HEADER.replaceAll("__SOURCE__", JSON.stringify(id)) + code + REACT_REFRESH_FOOTER.replaceAll("__SOURCE__", JSON.stringify(id)).replaceAll("__ACCEPT_EXPORTS__", JSON.stringify(acceptExports)).replaceAll("__ROUTE_ID__", JSON.stringify(route?.id));
}
const REACT_REFRESH_HEADER = `
import RefreshRuntime from "${virtualHmrRuntime.id}";

const inWebWorker = typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope;
let prevRefreshReg;
let prevRefreshSig;

if (import.meta.hot && !inWebWorker) {
  if (!window.__vite_plugin_react_preamble_installed__) {
    throw new Error(
      "React Router Vite plugin can't detect preamble. Something is wrong."
    );
  }

  prevRefreshReg = window.$RefreshReg$;
  prevRefreshSig = window.$RefreshSig$;
  window.$RefreshReg$ = (type, id) => {
    RefreshRuntime.register(type, __SOURCE__ + " " + id)
  };
  window.$RefreshSig$ = RefreshRuntime.createSignatureFunctionForTransform;
}`.replaceAll("\n", "");
const REACT_REFRESH_FOOTER = `
if (import.meta.hot && !inWebWorker) {
  window.$RefreshReg$ = prevRefreshReg;
  window.$RefreshSig$ = prevRefreshSig;
  RefreshRuntime.__hmr_import(import.meta.url).then((currentExports) => {
    RefreshRuntime.registerExportsForReactRefresh(__SOURCE__, currentExports);
    import.meta.hot.accept((nextExports) => {
      if (!nextExports) return;
      __ROUTE_ID__ && window.__reactRouterRouteModuleUpdates.set(__ROUTE_ID__, nextExports);
      const invalidateMessage = RefreshRuntime.validateRefreshBoundaryAndEnqueueUpdate(currentExports, nextExports, __ACCEPT_EXPORTS__);
      if (invalidateMessage) import.meta.hot.invalidate(invalidateMessage);
    });
  });
}`;
function getRoute(pluginConfig, file) {
	let vite = getVite();
	let routePath = vite.normalizePath(path$2.relative(pluginConfig.appDirectory, file));
	return Object.values(pluginConfig.routes).find((r) => vite.normalizePath(r.file) === routePath);
}
function isRoute(pluginConfig, file) {
	return Boolean(getRoute(pluginConfig, file));
}
async function getRouteMetadata(cache, ctx, viteChildCompiler, route, readRouteFile) {
	let routeFile = route.file;
	let sourceExports = await getRouteModuleExports(viteChildCompiler, ctx, route.file, readRouteFile);
	let { hasRouteChunkByExportName } = await detectRouteChunksIfEnabled(cache, ctx, routeFile, {
		routeFile,
		readRouteFile,
		viteChildCompiler
	});
	let moduleUrl = combineURLs(ctx.publicPath, `${resolveFileUrl(ctx, resolveRelativeRouteFilePath(route, ctx.reactRouterConfig))}`);
	return {
		id: route.id,
		parentId: route.parentId,
		path: route.path,
		index: route.index,
		caseSensitive: route.caseSensitive,
		url: combineURLs(ctx.publicPath, "/" + path$2.relative(ctx.rootDirectory, resolveRelativeRouteFilePath(route, ctx.reactRouterConfig))),
		module: `${moduleUrl}?import`,
		clientActionModule: hasRouteChunkByExportName.clientAction ? `${getRouteChunkModuleId(moduleUrl, "clientAction")}` : void 0,
		clientLoaderModule: hasRouteChunkByExportName.clientLoader ? `${getRouteChunkModuleId(moduleUrl, "clientLoader")}` : void 0,
		clientMiddlewareModule: hasRouteChunkByExportName.clientMiddleware ? `${getRouteChunkModuleId(moduleUrl, "clientMiddleware")}` : void 0,
		hydrateFallbackModule: hasRouteChunkByExportName.HydrateFallback ? `${getRouteChunkModuleId(moduleUrl, "HydrateFallback")}` : void 0,
		hasAction: sourceExports.includes("action"),
		hasClientAction: sourceExports.includes("clientAction"),
		hasLoader: sourceExports.includes("loader"),
		hasClientLoader: sourceExports.includes("clientLoader"),
		hasClientMiddleware: sourceExports.includes("clientMiddleware"),
		hasDefaultExport: sourceExports.includes("default"),
		hasErrorBoundary: sourceExports.includes("ErrorBoundary"),
		imports: []
	};
}
function isPrerenderingEnabled(reactRouterConfig) {
	return reactRouterConfig.prerender != null && reactRouterConfig.prerender !== false;
}
function isSpaModeEnabled(reactRouterConfig) {
	return reactRouterConfig.ssr === false && !isPrerenderingEnabled(reactRouterConfig);
}
function getStaticPrerenderPaths(routes) {
	let paths = ["/"];
	let paramRoutes = [];
	function recurse(subtree, prefix = "") {
		for (let route of subtree) {
			let newPath = [prefix, route.path].join("/").replace(/\/\/+/g, "/");
			if (route.path) if (route.path.split("/").some((s) => s.startsWith(":") || s === "*")) paramRoutes.push(route.path);
			else paths.push(newPath);
			if (route.children) recurse(route.children, newPath);
		}
	}
	recurse(routes);
	return {
		paths: paths.map((p) => p.replace(/\/\/+/g, "/").replace(/(.+)\/$/, "$1")),
		paramRoutes
	};
}
let redirectStatusCodes$1 = new Set([
	301,
	302,
	303,
	307,
	308
]);
async function getPrerenderPaths(prerender, ssr, routes, logWarning = false) {
	if (prerender == null || prerender === false) return [];
	let pathsConfig;
	if (typeof prerender === "object" && "paths" in prerender) pathsConfig = prerender.paths;
	else pathsConfig = prerender;
	if (pathsConfig === false) return [];
	let prerenderRoutes = createPrerenderRoutes(routes);
	if (pathsConfig === true) {
		let { paths, paramRoutes } = getStaticPrerenderPaths(prerenderRoutes);
		if (logWarning && !ssr && paramRoutes.length > 0) console.warn(colors.yellow(["⚠️ Paths with dynamic/splat params cannot be prerendered when using `prerender: true`. You may want to use the `prerender()` API to prerender the following paths:", ...paramRoutes.map((p) => "  - " + p)].join("\n")));
		return paths;
	}
	if (typeof pathsConfig === "function") return await pathsConfig({ getStaticPaths: () => getStaticPrerenderPaths(prerenderRoutes).paths });
	return pathsConfig;
}
function groupRoutesByParentId(manifest) {
	let routes = {};
	Object.values(manifest).forEach((route) => {
		if (route) {
			let parentId = route.parentId || "";
			if (!routes[parentId]) routes[parentId] = [];
			routes[parentId].push(route);
		}
	});
	return routes;
}
function createPrerenderRoutes(manifest, parentId = "", routesByParentId = groupRoutesByParentId(manifest)) {
	return (routesByParentId[parentId] || []).map((route) => {
		let commonRoute = {
			id: route.id,
			path: route.path
		};
		if (route.index) return {
			index: true,
			...commonRoute
		};
		return {
			children: createPrerenderRoutes(manifest, route.id, routesByParentId),
			...commonRoute
		};
	});
}
async function validateSsrFalsePrerenderExports(viteConfig, ctx, manifest, viteChildCompiler) {
	let prerenderPaths = await getPrerenderPaths(ctx.reactRouterConfig.prerender, ctx.reactRouterConfig.ssr, manifest.routes, true);
	if (prerenderPaths.length === 0) return;
	let prerenderRoutes = createPrerenderRoutes(manifest.routes);
	let prerenderedRoutes = /* @__PURE__ */ new Set();
	for (let path of prerenderPaths) {
		let matches = matchRoutes(prerenderRoutes, `/${path}/`.replace(/^\/\/+/, "/"));
		invariant(matches, `Unable to prerender path because it does not match any routes: ${path}`);
		matches.forEach((m) => prerenderedRoutes.add(m.route.id));
	}
	let errors = [];
	let routeExports = await getRouteManifestModuleExports(viteChildCompiler, ctx);
	for (let [routeId, route] of Object.entries(manifest.routes)) {
		let invalidApis = [];
		invariant(route, "Expected a route object in validateSsrFalseExports");
		let exports = routeExports[route.id];
		if (exports.includes("headers")) invalidApis.push("headers");
		if (exports.includes("action")) invalidApis.push("action");
		if (invalidApis.length > 0) errors.push(`Prerender: ${invalidApis.length} invalid route export(s) in \`${route.id}\` when pre-rendering with \`ssr:false\`: ${invalidApis.map((a) => `\`${a}\``).join(", ")}.  See https://reactrouter.com/how-to/pre-rendering#invalid-exports for more information.`);
		if (!prerenderedRoutes.has(routeId)) {
			if (exports.includes("loader")) errors.push(`Prerender: 1 invalid route export in \`${route.id}\` when pre-rendering with \`ssr:false\`: \`loader\`. See https://reactrouter.com/how-to/pre-rendering#invalid-exports for more information.`);
			let parentRoute = route.parentId ? manifest.routes[route.parentId] : null;
			while (parentRoute && parentRoute.id !== "root") {
				if (parentRoute.hasLoader && !parentRoute.hasClientLoader) errors.push(`Prerender: 1 invalid route export in \`${parentRoute.id}\` when pre-rendering with \`ssr:false\`: \`loader\`. See https://reactrouter.com/how-to/pre-rendering#invalid-exports for more information.`);
				parentRoute = parentRoute.parentId && parentRoute.parentId !== "root" ? manifest.routes[parentRoute.parentId] : null;
			}
		}
	}
	if (errors.length > 0) {
		viteConfig.logger.error(colors.red(errors.join("\n")));
		throw new Error("Invalid route exports found when prerendering with `ssr:false`");
	}
}
function getAddressableRoutes(routes) {
	let nonAddressableIds = /* @__PURE__ */ new Set();
	for (let id in routes) {
		let route = routes[id];
		if (route.index) {
			invariant(route.parentId, `Expected index route "${route.id}" to have "parentId" set`);
			nonAddressableIds.add(route.parentId);
		}
		if (typeof route.path !== "string" && !route.index) nonAddressableIds.add(id);
	}
	return Object.values(routes).filter((route) => !nonAddressableIds.has(route.id));
}
function getRouteBranch(routes, routeId) {
	let branch = [];
	let currentRouteId = routeId;
	while (currentRouteId) {
		let route = routes[currentRouteId];
		invariant(route, `Missing route for ${currentRouteId}`);
		branch.push(route);
		currentRouteId = route.parentId;
	}
	return branch.reverse();
}
function getServerBundleIds(ctx) {
	return ctx.buildManifest?.serverBundles ? Object.keys(ctx.buildManifest.serverBundles) : void 0;
}
function getRoutesByServerBundleId(buildManifest) {
	if (!buildManifest.routeIdToServerBundleId) return {};
	let routesByServerBundleId = {};
	for (let [routeId, serverBundleId] of Object.entries(buildManifest.routeIdToServerBundleId)) {
		routesByServerBundleId[serverBundleId] ??= {};
		let branch = getRouteBranch(buildManifest.routes, routeId);
		for (let route of branch) routesByServerBundleId[serverBundleId][route.id] = route;
	}
	return routesByServerBundleId;
}
const resolveRouteFileCode = async (ctx, input) => {
	if (typeof input === "string") return input;
	invariant(input.viteChildCompiler);
	return await compileRouteFile(input.viteChildCompiler, ctx, input.routeFile, input.readRouteFile);
};
function isRootRouteModuleId(ctx, id) {
	return normalizeRelativeFilePath(id, ctx.reactRouterConfig) === ctx.reactRouterConfig.routes.root.file;
}
async function detectRouteChunksIfEnabled(cache, ctx, id, input) {
	function noRouteChunks() {
		return {
			chunkedExports: [],
			hasRouteChunks: false,
			hasRouteChunkByExportName: {
				clientAction: false,
				clientLoader: false,
				clientMiddleware: false,
				HydrateFallback: false
			}
		};
	}
	if (!ctx.reactRouterConfig.splitRouteModules) return noRouteChunks();
	if (isRootRouteModuleId(ctx, id)) return noRouteChunks();
	let code = await resolveRouteFileCode(ctx, input);
	if (!routeChunkExportNames.some((exportName) => code.includes(exportName))) return noRouteChunks();
	return detectRouteChunks$1(code, cache, normalizeRelativeFilePath(id, ctx.reactRouterConfig) + (typeof input === "string" ? "" : "?read"));
}
async function getRouteChunkIfEnabled(cache, ctx, id, chunkName, input) {
	if (!ctx.reactRouterConfig.splitRouteModules) return null;
	return getRouteChunkCode(await resolveRouteFileCode(ctx, input), chunkName, cache, normalizeRelativeFilePath(id, ctx.reactRouterConfig) + (typeof input === "string" ? "" : "?read"));
}
function validateRouteChunks$1({ ctx, id, valid }) {
	if (isRootRouteModuleId(ctx, id)) return;
	let invalidChunks = Object.entries(valid).filter(([_, isValid]) => !isValid).map(([chunkName]) => chunkName);
	if (invalidChunks.length === 0) return;
	let plural = invalidChunks.length > 1;
	throw new Error([
		`Error splitting route module: ${normalizeRelativeFilePath(id, ctx.reactRouterConfig)}`,
		invalidChunks.map((name) => `- ${name}`).join("\n"),
		`${plural ? "These exports" : "This export"} could not be split into ${plural ? "their own chunks" : "its own chunk"} because ${plural ? "they share" : "it shares"} code with other exports. You should extract any shared code into its own module and then import it within the route module.`
	].join("\n\n"));
}
async function cleanBuildDirectory(viteConfig, ctx) {
	let buildDirectory = ctx.reactRouterConfig.buildDirectory;
	let isWithinRoot = () => {
		let relativePath = path$2.relative(ctx.rootDirectory, buildDirectory);
		return !relativePath.startsWith("..") && !path$2.isAbsolute(relativePath);
	};
	if (viteConfig.build.emptyOutDir ?? isWithinRoot()) await rm(buildDirectory, {
		force: true,
		recursive: true
	});
}
async function cleanViteManifests(environmentsOptions, ctx) {
	let viteManifestPaths = Object.entries(environmentsOptions).map(([environmentName, options]) => {
		let outDir = options.build?.outDir;
		invariant(outDir, `Expected build.outDir for ${environmentName}`);
		return path$2.join(outDir, ".vite/manifest.json");
	});
	await Promise.all(viteManifestPaths.map(async (viteManifestPath) => {
		if (!existsSync(viteManifestPath)) return;
		if (!ctx.viteManifestEnabled) await rm(viteManifestPath, {
			force: true,
			recursive: true
		});
		let viteDir = path$2.dirname(viteManifestPath);
		if ((await readdir(viteDir, { recursive: true })).length === 0) await rm(viteDir, {
			force: true,
			recursive: true
		});
	}));
}
async function getBuildManifest({ reactRouterConfig, rootDirectory }) {
	let { routes, serverBundles, appDirectory } = reactRouterConfig;
	if (!serverBundles) return { routes };
	let { normalizePath } = await import("vite");
	let serverBuildDirectory = getServerBuildDirectory(reactRouterConfig);
	let resolvedAppDirectory = path$2.resolve(rootDirectory, appDirectory);
	let buildManifest = {
		serverBundles: {},
		routeIdToServerBundleId: {},
		routes: Object.fromEntries(Object.entries(routes).map(([id, route]) => {
			let filePath = path$2.join(resolvedAppDirectory, route.file);
			let rootRelativeFilePath = normalizePath(path$2.relative(rootDirectory, filePath));
			return [id, {
				...route,
				file: rootRelativeFilePath
			}];
		}))
	};
	await Promise.all(getAddressableRoutes(routes).map(async (route) => {
		let serverBundleId = await serverBundles({ branch: getRouteBranch(routes, route.id).map((route) => configRouteToBranchRoute({
			...route,
			file: path$2.join(resolvedAppDirectory, route.file)
		})) });
		if (typeof serverBundleId !== "string") throw new Error(`The "serverBundles" function must return a string`);
		if (!/^[a-zA-Z0-9_]+$/.test(serverBundleId)) throw new Error(`The "serverBundles" function must only return strings containing alphanumeric characters and underscores.`);
		buildManifest.routeIdToServerBundleId[route.id] = serverBundleId;
		buildManifest.serverBundles[serverBundleId] ??= {
			id: serverBundleId,
			file: normalizePath(path$2.join(path$2.relative(rootDirectory, path$2.join(serverBuildDirectory, serverBundleId)), reactRouterConfig.serverBuildFile))
		};
	}));
	return buildManifest;
}
function mergeEnvironmentOptions(base, ...overrides) {
	let vite = getVite();
	return overrides.reduce((merged, override) => vite.mergeConfig(merged, override, false), base);
}
async function getEnvironmentOptionsResolvers(ctx, viteCommand) {
	let { serverBuildFile, serverModuleFormat } = ctx.reactRouterConfig;
	let pkgJson = await readPackageJSON(ctx.rootDirectory).catch(() => ({}));
	let packageRoot = path$2.dirname(nodeRequire$1.resolve("@react-router/dev/package.json"));
	let { moduleSyncEnabled } = await import(`file:///${path$2.join(packageRoot, "module-sync-enabled/index.mjs")}`);
	let vite = getVite();
	function getBaseOptions({ viteUserConfig }) {
		return { build: {
			cssMinify: viteUserConfig.build?.cssMinify ?? true,
			manifest: true,
			rollupOptions: {
				preserveEntrySignatures: "exports-only",
				onwarn(warning, defaultHandler) {
					if (warning.code === "MODULE_LEVEL_DIRECTIVE" && warning.message.includes("use client")) return;
					let userHandler = viteUserConfig.build?.rollupOptions?.onwarn;
					if (userHandler) userHandler(warning, defaultHandler);
					else defaultHandler(warning);
				}
			}
		} };
	}
	function getBaseServerOptions({ viteUserConfig }) {
		let maybeModuleSyncConditions = [...moduleSyncEnabled ? ["module-sync"] : []];
		let maybeDevelopmentConditions = viteCommand === "build" ? [] : ["development"];
		let maybeDefaultServerConditions = vite.defaultServerConditions || [];
		let defaultExternalConditions = vite.defaultExternalConditions ?? ["node"];
		if (!hasNodeDependency(pkgJson.dependencies)) {
			maybeDefaultServerConditions = maybeDefaultServerConditions.filter((c) => c !== "node");
			defaultExternalConditions = defaultExternalConditions.filter((c) => c !== "node");
		}
		let baseConditions = [...maybeDevelopmentConditions, ...maybeModuleSyncConditions];
		return mergeEnvironmentOptions(getBaseOptions({ viteUserConfig }), {
			resolve: {
				external: void 0,
				conditions: [...baseConditions, ...maybeDefaultServerConditions],
				externalConditions: [...baseConditions, ...defaultExternalConditions]
			},
			build: {
				ssrEmitAssets: true,
				copyPublicDir: false,
				rollupOptions: {
					input: getUserBuildRollupOptions(viteUserConfig.environments?.ssr)?.input ?? virtual$1.serverBuild.id,
					output: {
						entryFileNames: serverBuildFile,
						format: serverModuleFormat
					}
				}
			}
		});
	}
	let environmentOptionsResolvers = { client: ({ viteUserConfig }) => mergeEnvironmentOptions(getBaseOptions({ viteUserConfig }), { build: {
		rollupOptions: {
			input: [ctx.entryClientFilePath, ...Object.values(ctx.reactRouterConfig.routes).flatMap((route) => {
				let routeFilePath = path$2.resolve(ctx.reactRouterConfig.appDirectory, route.file);
				let isRootRoute = route.file === ctx.reactRouterConfig.routes.root.file;
				let code = readFileSync(routeFilePath, "utf-8");
				return [`${routeFilePath}${BUILD_CLIENT_ROUTE_QUERY_STRING}`, ...ctx.reactRouterConfig.splitRouteModules && !isRootRoute ? routeChunkExportNames.map((exportName) => code.includes(exportName) ? getRouteChunkModuleId(routeFilePath, exportName) : null) : []].filter(isNonNullable);
			})],
			output: getUserBuildRollupOptions(viteUserConfig?.environments?.client)?.output ?? { entryFileNames: ({ moduleIds }) => {
				let routeChunkModuleId = moduleIds.find(isRouteChunkModuleId);
				let routeChunkName = routeChunkModuleId ? getRouteChunkNameFromModuleId(routeChunkModuleId)?.replace("unstable_", "") : null;
				let routeChunkSuffix = routeChunkName ? `-${kebabCase(routeChunkName)}` : "";
				let assetsDir = viteUserConfig?.environments?.client?.build?.assetsDir ?? viteUserConfig?.build?.assetsDir ?? "assets";
				return path$2.posix.join(assetsDir, `[name]${routeChunkSuffix}-[hash].js`);
			} }
		},
		outDir: getClientBuildDirectory$1(ctx.reactRouterConfig)
	} }) };
	let serverBundleIds = getServerBundleIds(ctx);
	if (serverBundleIds) for (let serverBundleId of serverBundleIds) {
		const environmentName = `${SSR_BUNDLE_PREFIX}${serverBundleId}`;
		environmentOptionsResolvers[environmentName] = ({ viteUserConfig }) => mergeEnvironmentOptions(getBaseServerOptions({ viteUserConfig }), { build: { outDir: getServerBuildDirectory(ctx.reactRouterConfig, { serverBundleId }) } }, viteUserConfig.environments?.ssr ?? {});
	}
	else environmentOptionsResolvers.ssr = ({ viteUserConfig }) => mergeEnvironmentOptions(getBaseServerOptions({ viteUserConfig }), { build: { outDir: getServerBuildDirectory(ctx.reactRouterConfig) } });
	return environmentOptionsResolvers;
}
function resolveEnvironmentsOptions(environmentResolvers, resolverOptions) {
	let environmentOptions = {};
	for (let [environmentName, resolver] of Object.entries(environmentResolvers)) environmentOptions[environmentName] = resolver(resolverOptions);
	return environmentOptions;
}
async function getEnvironmentsOptions(ctx, viteCommand, resolverOptions) {
	return resolveEnvironmentsOptions(await getEnvironmentOptionsResolvers(ctx, viteCommand), resolverOptions);
}
function isNonNullable(x) {
	return x != null;
}
async function asyncFlatten(arr) {
	do
		arr = (await Promise.all(arr)).flat(Infinity);
	while (arr.some((v) => v?.then));
	return arr;
}
function assertPrerenderPathsMatchRoutes(config, prerenderPaths) {
	let routes = createPrerenderRoutes(config.routes);
	for (let path of prerenderPaths) if (!matchRoutes(routes, `/${path}/`.replace(/^\/\/+/, "/"))) throw new Error(`Unable to prerender path because it does not match any routes: ${path}`);
}
function getPrerenderConcurrencyConfig$1(reactRouterConfig) {
	let concurrency = 1;
	let { prerender } = reactRouterConfig;
	if (typeof prerender === "object" && "concurrency" in prerender) concurrency = prerender.concurrency ?? 1;
	return concurrency;
}
function createDataRequest(prerenderPath, reactRouterConfig, onlyRoutes, isResourceRoute) {
	let dataRequestPath = prerenderPath.endsWith("/") ? `${prerenderPath}_.data` : `${prerenderPath}.data`;
	let normalizedPath = `${reactRouterConfig.basename}${dataRequestPath}`.replace(/\/\/+/g, "/");
	let url = new URL(`http://localhost${normalizedPath}`);
	if (onlyRoutes?.length) url.searchParams.set("_routes", onlyRoutes.join(","));
	return {
		request: new Request(url),
		metadata: {
			type: "data",
			path: prerenderPath,
			isResourceRoute
		}
	};
}
function createRouteRequest(prerenderPath, reactRouterConfig, data) {
	let normalizedPath = `${reactRouterConfig.basename}${prerenderPath}/`.replace(/\/\/+/g, "/");
	let headers = new Headers();
	if (data) {
		let encodedData = encodeURI(data);
		if (encodedData.length < 8 * 1024) headers.set("X-React-Router-Prerender-Data", encodedData);
	}
	return {
		request: new Request(`http://localhost${normalizedPath}`, { headers }),
		metadata: {
			type: "html",
			path: prerenderPath
		}
	};
}
function createResourceRouteRequest(prerenderPath, reactRouterConfig, requestInit) {
	let normalizedPath = `${reactRouterConfig.basename}${prerenderPath}/`.replace(/\/\/+/g, "/").replace(/\/$/g, "");
	return {
		request: new Request(`http://localhost${normalizedPath}`, requestInit),
		metadata: {
			type: "resource",
			path: prerenderPath
		}
	};
}
function createSpaModeRequest(reactRouterConfig) {
	return {
		request: new Request(`http://localhost${reactRouterConfig.basename}`, { headers: { "X-React-Router-SPA-Mode": "yes" } }),
		metadata: {
			type: "spa",
			path: "/"
		}
	};
}
const ESCAPE_REGEX = /[&><\u2028\u2029]/g;
const ESCAPE_LOOKUP = {
	"&": "\\u0026",
	">": "\\u003e",
	"<": "\\u003c",
	"\u2028": "\\u2028",
	"\u2029": "\\u2029"
};
function escapeHtml(html) {
	return html.replace(ESCAPE_REGEX, (match) => ESCAPE_LOOKUP[match]);
}
//#endregion
//#region vite/has-dependency.ts
const nodeRequire = createRequire(import.meta.url);
function hasDependency({ name, rootDirectory }) {
	try {
		return Boolean(nodeRequire.resolve(name, { paths: [rootDirectory] }));
	} catch (e) {
		return false;
	}
}
//#endregion
//#region vite/rsc/virtual-route-config.ts
const js = String.raw;
function createVirtualRouteConfig({ appDirectory, routeConfig }) {
	let routeIdByFile = /* @__PURE__ */ new Map();
	let code = js`import * as React from "react";
function frameworkRoute(lazy) {
  return async () => {
    const mod = await lazy();
    let Component;
    let Layout;
    let ErrorBoundary;
    let HydrateFallback;
    if ("default" in mod && mod.default) {
      if ("ServerComponent" in mod && mod.ServerComponent) {
        throw new Error("Module cannot have both a default export and a ServerComponent export");
      }
      Component = mod.default;
    } else if ("ServerComponent" in mod && mod.ServerComponent) {
      Component = mod.ServerComponent;
    }
    if ("Layout" in mod && mod.Layout) {
      if ("ServerLayout" in mod && mod.ServerLayout) {
        throw new Error("Module cannot have both a Layout export and a ServerLayout export");
      }
      Layout = mod.Layout;
    } else if ("ServerLayout" in mod && mod.ServerLayout) {
      Layout = mod.ServerLayout;
    }
    if ("ErrorBoundary" in mod && mod.ErrorBoundary) {
      if ("ServerErrorBoundary" in mod && mod.ServerErrorBoundary) {
        throw new Error(
          "Module cannot have both an ErrorBoundary export and a ServerErrorBoundary export",
        );
      }
      ErrorBoundary = mod.ErrorBoundary;
    } else if ("ServerErrorBoundary" in mod && mod.ServerErrorBoundary) {
      ErrorBoundary = mod.ServerErrorBoundary;
    }
    if ("HydrateFallback" in mod && mod.HydrateFallback) {
      if ("ServerHydrateFallback" in mod && mod.ServerHydrateFallback) {
        throw new Error(
          "Module cannot have both a HydrateFallback export and a ServerHydrateFallback export",
        );
      }
      HydrateFallback = mod.HydrateFallback;
    } else if ("ServerHydrateFallback" in mod && mod.ServerHydrateFallback) {
      HydrateFallback = mod.ServerHydrateFallback;
    }

    const {
      action,
      clientAction,
      clientLoader,
      clientMiddleware,
      handle,
      headers,
      links,
      loader,
      meta,
      middleware,
      shouldRevalidate,
    } = mod;

    return {
      Component,
      ErrorBoundary,
      HydrateFallback,
      Layout,
      action,
      clientAction,
      clientLoader,
      clientMiddleware,
      handle,
      headers,
      links,
      loader,
      meta,
      middleware,
      shouldRevalidate,
    };
  };
}
export default [`;
	const closeRouteSymbol = Symbol("CLOSE_ROUTE");
	let stack = [...routeConfig];
	while (stack.length > 0) {
		const route = stack.pop();
		if (!route) break;
		if (route === closeRouteSymbol) {
			code += "]},";
			continue;
		}
		code += "{";
		const routeFile = path$1.resolve(appDirectory, route.file);
		const routeId = route.id || createRouteId(route.file, appDirectory);
		routeIdByFile.set(routeFile, routeId);
		code += `lazy: frameworkRoute(() => import(${JSON.stringify(`${routeFile}`)})),`;
		code += `id: ${JSON.stringify(routeId)},`;
		if (typeof route.path === "string") code += `path: ${JSON.stringify(route.path)},`;
		if (route.index) code += `index: true,`;
		if (route.caseSensitive) code += `caseSensitive: true,`;
		if (route.children) {
			code += ["children:["];
			stack.push(closeRouteSymbol);
			stack.push(...[...route.children].reverse());
		} else code += "},";
	}
	code += "];\n";
	return {
		code,
		routeIdByFile
	};
}
function createRouteId(file, appDirectory) {
	return path$1.relative(appDirectory, file).replace(/\\+/, "/").slice(0, -path$1.extname(file).length);
}
//#endregion
//#region vite/rsc/virtual-route-modules.ts
const ENSURE_CLIENT_ROUTE_MODULE_CHUNK_FOR_HMR = `
import * as ___EnsureClientRouteModuleForHMR_REACT___ from "react";
export function EnsureClientRouteModuleForHMR___() { return ___EnsureClientRouteModuleForHMR_REACT___.createElement(___EnsureClientRouteModuleForHMR_REACT___.Fragment, null) }
`;
function virtualRouteModulesPlugin({ enforceSplitRouteModules, environments: { client = ["client", "ssr"], server = ["rsc"] } = {}, getRouteIdForFile, isRootRouteModule, transformToJs, shouldTransform }) {
	let clientEnvironments = new Set(client);
	let serverEnvironments = new Set(server);
	let cache = /* @__PURE__ */ new Map();
	async function createClientRouteEntry(id, code, isRootRouteModule, routeId) {
		let result = "";
		let routeChunks = detectRouteChunks(cache, id, code, isRootRouteModule);
		let { staticExports } = await parseRouteExports(code);
		validateRouteModuleExports(staticExports);
		let needsReactImport = false;
		for (let exportName of staticExports) {
			if (isServerRouteExport(exportName)) continue;
			if ((exportName === "clientAction" || exportName === "clientLoader") && routeChunks.hasRouteChunkByExportName[exportName]) result += `export const ${exportName} = async (...args) => import("${createId(id, "client-route-module", exportName)}").then(mod => mod.${exportName}(...args));\n`;
			else if (exportName === "HydrateFallback") {
				needsReactImport = true;
				result += `export const ${exportName} = React.lazy(() => import("${createId(id, "client-route-module", routeChunks.hasRouteChunkByExportName[exportName] ? exportName : "shared")}").then(mod => ({ default: mod.${exportName} })));\n`;
			} else result += `export { ${exportName} } from "${createId(id, "client-route-module", routeChunks.hasRouteChunkByExportName[exportName] ? exportName : "shared")}";\n`;
		}
		if (needsReactImport) result = `import * as React from "react";\n${result}`;
		if (enforceSplitRouteModules() && !isRootRouteModule) {
			let { hasRouteChunkByExportName } = routeChunks;
			let hasClientAction = staticExports.includes("clientAction");
			let hasClientLoader = staticExports.includes("clientLoader");
			let hasClientMiddleware = staticExports.includes("clientMiddleware");
			let hasHydrateFallback = staticExports.includes("HydrateFallback");
			validateRouteChunks({
				id: routeId,
				valid: {
					clientAction: !hasClientAction || hasRouteChunkByExportName.clientAction,
					clientLoader: !hasClientLoader || hasRouteChunkByExportName.clientLoader,
					clientMiddleware: !hasClientMiddleware || hasRouteChunkByExportName.clientMiddleware,
					HydrateFallback: !hasHydrateFallback || hasRouteChunkByExportName.HydrateFallback
				}
			});
		}
		return { code: "\"use client\";\n" + result };
	}
	async function createServerRouteEntry(id, code, isRootRouteModule, routeId) {
		let result = "";
		let routeChunks = detectRouteChunks(cache, id, code, isRootRouteModule);
		let { staticExports } = await parseRouteExports(code);
		validateRouteModuleExports(staticExports);
		let needsReactImport = false;
		for (let exportName of staticExports) if (isClientRouteExport(exportName)) result += `export { ${exportName} } from "${createId(id, "client-route-module", routeChunks.hasRouteChunkByExportName[exportName] ? exportName : "shared")}";\n`;
		else if (isServerComponentExport(exportName)) {
			needsReactImport = true;
			result += `import { ${exportName} as ${exportName}WithoutCss } from "${createId(id, "server-route-module")}";\n`;
			result += `export function ${exportName}(props) {\n`;
			result += `  return React.createElement(React.Fragment, null,\n`;
			result += `    import.meta.viteRsc.loadCss(),\n`;
			result += `    React.createElement(EnsureClientRouteModuleForHMR___, null),\n`;
			result += `    React.createElement(${exportName}WithoutCss, props),\n`;
			result += `  );\n`;
			result += `}\n`;
		} else result += `export { ${exportName} } from "${createId(id, "server-route-module")}";\n`;
		if (needsReactImport) result = `import * as React from "react";
import { EnsureClientRouteModuleForHMR___ } from "${createId(id, "client-route-module", "shared")}";\n
${result}`;
		if (isRootRouteModule && !staticExports.includes("ErrorBoundary") && !staticExports.includes("ServerErrorBoundary")) result += `export { ErrorBoundary } from "${createId(id, "client-route-module", "shared")}";\n`;
		if (enforceSplitRouteModules() && !isRootRouteModule) {
			let { hasRouteChunkByExportName } = routeChunks;
			let hasClientAction = staticExports.includes("clientAction");
			let hasClientLoader = staticExports.includes("clientLoader");
			let hasClientMiddleware = staticExports.includes("clientMiddleware");
			let hasHydrateFallback = staticExports.includes("HydrateFallback");
			validateRouteChunks({
				id: routeId,
				valid: {
					clientAction: !hasClientAction || hasRouteChunkByExportName.clientAction,
					clientLoader: !hasClientLoader || hasRouteChunkByExportName.clientLoader,
					clientMiddleware: !hasClientMiddleware || hasRouteChunkByExportName.clientMiddleware,
					HydrateFallback: !hasHydrateFallback || hasRouteChunkByExportName.HydrateFallback
				}
			});
		}
		return { code: result };
	}
	function createServerRouteModule(code) {
		const ast = parse$1(code, { sourceType: "module" });
		removeExports(ast, CLIENT_ROUTE_EXPORTS);
		return generate(ast);
	}
	async function createClientRouteModuleChunk(id, code, chunk, routeId, isRootRouteModule, isDevMode) {
		let routeChunks = detectRouteChunks(cache, id, code, isRootRouteModule);
		const ast = parse$1(code, { sourceType: "module" });
		const { staticExports } = await parseRouteExports(code);
		if (chunk === "shared") removeExports(ast, [...SERVER_ROUTE_EXPORTS, ...routeChunks.chunkedExports]);
		else {
			const toRemove = new Set([...SERVER_ROUTE_EXPORTS, ...staticExports]);
			toRemove.delete(chunk);
			removeExports(ast, Array.from(toRemove));
		}
		let result = "\"use client\";\n" + generate(ast).code;
		if (chunk === "shared") {
			if (isRootRouteModule && !staticExports.includes("ErrorBoundary") && !staticExports.includes("ServerErrorBoundary")) {
				const hasRootLayout = staticExports.includes("Layout") || staticExports.includes("ServerLayout");
				result += `\nimport { createElement as __rr_createElement } from "react";\n`;
				result += `import { UNSAFE_RSCDefaultRootErrorBoundary } from "react-router";\n`;
				result += `export function ErrorBoundary() {\n`;
				result += `  return __rr_createElement(UNSAFE_RSCDefaultRootErrorBoundary, { hasRootLayout: ${hasRootLayout} });\n`;
				result += `}\n`;
			}
			result += ENSURE_CLIENT_ROUTE_MODULE_CHUNK_FOR_HMR;
		}
		let hasAction = staticExports.includes("action");
		let hasLoader = staticExports.includes("loader");
		let hasComponent = staticExports.includes("default") || staticExports.includes("ServerComponent");
		let hasErrorBoundary = staticExports.includes("ErrorBoundary") || staticExports.includes("ServerErrorBoundary");
		if (isDevMode) {
			result += `export function ReactRouterHMRMeta___() {return null;};\n`;
			result += `Object.assign(ReactRouterHMRMeta___, {
        hasAction: ${JSON.stringify(hasAction)},
        hasComponent: ${JSON.stringify(hasComponent)},
        hasErrorBoundary: ${JSON.stringify(hasErrorBoundary)},
        hasLoader: ${JSON.stringify(hasLoader)},
        hasClientLoader: ${JSON.stringify(staticExports.includes("clientLoader"))},
      });\n`;
			result += `\nif (import.meta.hot) {\n`;
			result += `  import.meta.hot.accept((mod) => {
          if (typeof __reactRouterDataRouter === "object") {
            __reactRouterDataRouter._updateRoutesForHMR(new Map([[${JSON.stringify(routeId)}, {
              routeModule: mod,
              ...mod.ReactRouterHMRMeta___,
            }]]));

            if (${chunk === "shared" ? "!mod.default || " : ""}mod.clientLoader || (
              mod.ReactRouterHMRMeta___.hasClientLoader || ReactRouterHMRMeta___.hasClientLoader || ReactRouterHMRMeta___.hasLoader
            )) {
              __reactRouterDataRouter.revalidate();
            }
          }
        });
      `;
			result += `}\n`;
		}
		return { code: result };
	}
	return {
		name: "react-router-rsc-virtual-route-modules",
		enforce: "pre",
		async transform(_code, id) {
			const [filename, ...rest] = id.split("?");
			const routeId = getRouteIdForFile(filename);
			if (!routeId || shouldTransform && !shouldTransform?.(filename)) return;
			let isClientEnvironment = clientEnvironments.has(this.environment.name);
			let isServerEnvironment = serverEnvironments.has(this.environment.name);
			if (!isClientEnvironment && !isServerEnvironment) return;
			let code = await transformToJs(_code, filename);
			let searchParams = rest.length > 0 ? new URLSearchParams(rest.join("?")) : null;
			let clientRouteModuleType = searchParams?.get("client-route-module");
			let isServerRouteModule = searchParams?.has("server-route-module");
			if (clientRouteModuleType) return await createClientRouteModuleChunk(id, code, clientRouteModuleType, routeId, isRootRouteModule(filename), this.environment.mode === "dev");
			if (isServerRouteModule) return createServerRouteModule(code);
			if (isClientEnvironment) return await createClientRouteEntry(id, code, isRootRouteModule(filename), routeId);
			return await createServerRouteEntry(id, code, isRootRouteModule(filename), routeId);
		}
	};
}
function createClientRouteModuleForOptimizeDepsScan(code) {
	const ast = parse$1(code, { sourceType: "module" });
	removeExports(ast, SERVER_ROUTE_EXPORTS);
	return generate(ast);
}
function createId(id, type, value) {
	let [base, ...rest] = id.split("?");
	const searchParams = new URLSearchParams(rest.join("?"));
	searchParams.delete("client-route-module");
	searchParams.delete("server-route-module");
	searchParams.set(type, value || "");
	return `${base}?${searchParams.toString()}`;
}
async function parseRouteExports(code) {
	await init;
	const [, exportSpecifiers] = parse(code);
	const staticExports = exportSpecifiers.map(({ n: name }) => name);
	return {
		staticExports,
		hasClientExports: staticExports.some(isClientRouteExport)
	};
}
const CLIENT_ROUTE_EXPORTS = [
	...[
		"clientAction",
		"clientLoader",
		"clientMiddleware",
		"handle",
		"meta",
		"links",
		"shouldRevalidate"
	],
	"default",
	"ErrorBoundary",
	"HydrateFallback",
	"Layout"
];
const CLIENT_ROUTE_EXPORTS_SET = new Set(CLIENT_ROUTE_EXPORTS);
function isClientRouteExport(name) {
	return CLIENT_ROUTE_EXPORTS_SET.has(name);
}
const SERVER_COMPONENT_EXPORTS = [
	"ServerComponent",
	"ServerLayout",
	"ServerHydrateFallback",
	"ServerErrorBoundary"
];
const SERVER_COMPONENT_EXPORTS_SET = new Set(SERVER_COMPONENT_EXPORTS);
function isServerComponentExport(name) {
	return SERVER_COMPONENT_EXPORTS_SET.has(name);
}
const SERVER_ROUTE_EXPORTS = [
	...SERVER_COMPONENT_EXPORTS,
	"loader",
	"action",
	"middleware",
	"headers"
];
const SERVER_ROUTE_EXPORTS_SET = new Set(SERVER_ROUTE_EXPORTS);
function isServerRouteExport(name) {
	return SERVER_ROUTE_EXPORTS_SET.has(name);
}
const CLIENT_MODULE_CHUNKS = new Set([
	"clientAction",
	"clientLoader",
	"clientMiddleware",
	"HydrateFallback"
]);
const MUTUALLY_EXCLUSIVE_ROUTE_EXPORTS = new Map([
	["ErrorBoundary", "ServerErrorBoundary"],
	["HydrateFallback", "ServerHydrateFallback"],
	["Layout", "ServerLayout"],
	["default", "ServerComponent"]
]);
function validateRouteModuleExports(toValidate) {
	let errors = [];
	for (let [clientExport, serverExport] of MUTUALLY_EXCLUSIVE_ROUTE_EXPORTS) if (toValidate.includes(clientExport) && toValidate.includes(serverExport)) errors.push([clientExport, serverExport]);
	if (errors.length > 0) throw new Error(`Invalid route module exports. The following pairs of exports are mutually exclusive and cannot be exported from the same module:\n` + errors.map(([clientExport, serverExport]) => `- ${clientExport} and ${serverExport}`).join("\n"));
}
function detectRouteChunks(cache, id, code, isRootRouteModule) {
	function noRouteChunks() {
		return {
			chunkedExports: [],
			hasRouteChunks: false,
			hasRouteChunkByExportName: {
				clientAction: false,
				clientLoader: false,
				clientMiddleware: false,
				HydrateFallback: false
			}
		};
	}
	if (isRootRouteModule) return noRouteChunks();
	if (!Array.from(CLIENT_MODULE_CHUNKS).some((exportName) => code.includes(exportName))) return noRouteChunks();
	let [filename] = id.split("?");
	return detectRouteChunks$1(code, cache, filename);
}
function validateRouteChunks({ id, valid }) {
	let invalidChunks = Object.entries(valid).filter(([_, isValid]) => !isValid).map(([chunkName]) => chunkName);
	if (invalidChunks.length === 0) return;
	let plural = invalidChunks.length > 1;
	throw new Error([
		`Error splitting route module: ${id}`,
		invalidChunks.map((name) => `- ${name}`).join("\n"),
		`${plural ? "These exports" : "This export"} could not be split into ${plural ? "their own chunks" : "its own chunk"} because ${plural ? "they share" : "it shares"} code with other exports. You should extract any shared code into its own module and then import it within the route module.`
	].join("\n\n"));
}
//#endregion
//#region vite/rsc/plugin.ts
const redirectStatusCodes = new Set([
	301,
	302,
	303,
	307,
	308
]);
let configLoaderPromise;
let typegenWatcherPromise;
function reactRouterRSCVitePlugin() {
	let runningWithinTheReactRouterMonoRepo = Boolean(arguments && arguments.length === 1 && typeof arguments[0] === "object" && arguments[0] && "__runningWithinTheReactRouterMonoRepo" in arguments[0] && arguments[0].__runningWithinTheReactRouterMonoRepo === true);
	let configLoader;
	let viteCommand;
	let resolvedViteConfig;
	let routeIdByFile;
	let logger;
	let entries;
	let config;
	let rootRouteFile;
	function updateConfig(newConfig) {
		config = newConfig;
		rootRouteFile = Path.resolve(newConfig.appDirectory, newConfig.routes.root.file);
	}
	function isRootRouteModule(id) {
		return path$1.normalize(id) === path$1.normalize(rootRouteFile);
	}
	function getRouteIdForFile(file) {
		let normalizedFile = path$1.normalize(file);
		let directMatch = routeIdByFile?.get(normalizedFile);
		if (directMatch) return directMatch;
		return Array.from(routeIdByFile ?? []).find(([routeFile]) => path$1.normalize(routeFile).endsWith(normalizedFile))?.[1];
	}
	function getTransformLanguage(filename) {
		switch (path$1.extname(filename).toLowerCase()) {
			case ".ts":
			case ".cts":
			case ".mts": return "ts";
			case ".tsx": return "tsx";
			case ".js":
			case ".cjs":
			case ".mjs":
			case ".jsx":
			case ".md":
			case ".mdx": return "jsx";
			default: return;
		}
	}
	async function transformToJs(code, filename) {
		await preloadVite();
		let vite = getVite();
		let lang = getTransformLanguage(filename);
		return ("transformWithOxc" in vite && typeof vite.transformWithOxc === "function" ? await vite.transformWithOxc(code, filename, {
			lang,
			jsx: {
				runtime: "automatic",
				development: viteCommand !== "build",
				target: "esnext"
			}
		}) : await vite.transformWithEsbuild(code, filename, {
			loader: lang,
			target: "esnext",
			format: "esm",
			jsx: "automatic",
			jsxDev: viteCommand !== "build"
		})).code;
	}
	return [
		{
			name: "react-router/rsc",
			async config(viteUserConfig, { command, mode }) {
				await init;
				await preloadVite();
				viteCommand = command;
				const rootDirectory = getRootDirectory(viteUserConfig);
				const watch = command === "serve" && process.env.IS_RR_BUILD_REQUEST !== "yes";
				await loadDotenv({
					rootDirectory,
					viteUserConfig,
					mode
				});
				configLoaderPromise ??= createConfigLoader({
					rootDirectory,
					mode,
					watch,
					validateConfig: (userConfig) => {
						let errors = [];
						if (userConfig.buildEnd) errors.push("buildEnd");
						if (userConfig.presets?.length) errors.push("presets");
						if (userConfig.serverBundles) errors.push("serverBundles");
						if (userConfig.subResourceIntegrity) errors.push("subResourceIntegrity");
						if (errors.length) return `RSC Framework Mode does not currently support the following React Router config:\n${errors.map((x) => ` - ${x}`).join("\n")}\n`;
					}
				});
				configLoader = await configLoaderPromise;
				const configResult = await configLoader.getConfig();
				if (!configResult.ok) throw new Error(configResult.error);
				updateConfig(configResult.value);
				if (viteUserConfig.base && config.basename !== "/" && viteCommand === "serve" && !viteUserConfig.server?.middlewareMode && !config.basename.startsWith(viteUserConfig.base)) throw new Error("When using the React Router `basename` and the Vite `base` config, the `basename` config must begin with `base` for the default Vite dev server.");
				logger = (await import("vite")).createLogger(viteUserConfig.logLevel, { prefix: "[react-router]" });
				entries = await resolveRSCEntryFiles({ reactRouterConfig: config });
				let viteNormalizePath = (await import("vite")).normalizePath;
				let optimizeDepsEntries = getOptimizeDepsEntries({
					entryClientFilePath: entries.client,
					reactRouterConfig: config
				});
				let routeFiles = new Set(Object.values(config.routes).map((route) => resolveRelativeRouteFilePath(route, config)));
				return {
					resolve: { dedupe: [
						"react",
						"react/jsx-runtime",
						"react/jsx-dev-runtime",
						"react-dom",
						"react-dom/client",
						"react-router",
						"react-router/dom",
						"react-router/internal/react-server-client",
						...hasDependency({
							name: "react-server-dom-webpack",
							rootDirectory
						}) ? ["react-server-dom-webpack"] : []
					] },
					optimizeDeps: {
						entries: optimizeDepsEntries,
						...defineOptimizeDepsCompilerOptions({
							rolldown: {
								transform: { jsx: "react-jsx" },
								plugins: config.future.unstable_optimizeDeps ? [createRSCOptimizeDepsRouteModulesPlugin({
									routeFiles,
									transformToJs
								})] : []
							},
							esbuild: { jsx: "automatic" }
						}),
						include: [
							"react",
							"react/jsx-runtime",
							"react/jsx-dev-runtime",
							"react-dom",
							...hasDependency({
								name: "react-server-dom-webpack",
								rootDirectory
							}) ? ["react-server-dom-webpack"] : [],
							...runningWithinTheReactRouterMonoRepo ? [] : [
								"react-router",
								"react-router/dom",
								"react-router/internal/react-server-client"
							]
						]
					},
					...defineCompilerOptions({
						oxc: { jsx: {
							runtime: "automatic",
							development: viteCommand !== "build"
						} },
						esbuild: {
							jsx: "automatic",
							jsxDev: viteCommand !== "build"
						}
					}),
					environments: {
						client: { build: {
							rollupOptions: {
								input: { index: entries.client },
								output: { manualChunks(id) {
									const normalized = viteNormalizePath(id);
									if (normalized.includes("node_modules/react/") || normalized.includes("node_modules/react-dom/") || normalized.includes("node_modules/react-server-dom-webpack/") || normalized.includes("node_modules/@vitejs/plugin-rsc/")) return "react";
									if (normalized.includes("node_modules/react-router/")) return "router";
								} }
							},
							outDir: join(config.buildDirectory, "client")
						} },
						rsc: {
							build: {
								rollupOptions: {
									input: { index: entries.rsc },
									output: {
										entryFileNames: config.serverBuildFile,
										format: config.serverModuleFormat
									}
								},
								outDir: join(config.buildDirectory, "server")
							},
							resolve: { noExternal: ["@react-router/dev/config/default-rsc-entries/entry.ssr"] }
						},
						ssr: {
							build: {
								rollupOptions: {
									input: { index: entries.ssr },
									output: { 
									// @vitejs/plugin-rsc currently breaks if it's set to
format: config.serverModuleFormat }
								},
								outDir: join(config.buildDirectory, "server/__ssr_build")
							},
							resolve: { noExternal: ["@react-router/dev/config/default-rsc-entries/entry.rsc"] }
						}
					}
				};
			},
			configResolved(viteConfig) {
				resolvedViteConfig = viteConfig;
			},
			async configureServer(viteDevServer) {
				configLoader.onChange(async ({ result, configCodeChanged, routeConfigCodeChanged, configChanged, routeConfigChanged }) => {
					if (!result.ok) {
						invalidateVirtualModules(viteDevServer);
						logger.error(result.error, {
							clear: true,
							timestamp: true
						});
						return;
					}
					let message = configChanged ? "Config changed." : routeConfigChanged ? "Route config changed." : configCodeChanged ? "Config saved." : routeConfigCodeChanged ? " Route config saved." : "Config saved";
					logger.info(colors.green(message), {
						clear: true,
						timestamp: true
					});
					updateConfig(result.value);
					if (configChanged || routeConfigChanged) invalidateVirtualModules(viteDevServer);
				});
			},
			configurePreviewServer(previewServer) {
				const clientBuildDirectory = getClientBuildDirectory(config);
				if ((config.prerender || config.ssr === false) && process.env.IS_RR_BUILD_REQUEST !== "yes") {
					previewServer.middlewares.use(async (req, res, next) => {
						try {
							const htmlFileBase = ((req.url || "/") + (req.url?.endsWith("/") ? "" : "/") + "index.html").slice(1);
							const htmlFilePath = path$1.join(clientBuildDirectory, htmlFileBase);
							if (existsSync$1(htmlFilePath)) {
								res.setHeader("Content-Type", "text/html");
								res.end(await readFile$1(htmlFilePath, "utf-8"));
								return;
							}
							next();
						} catch (error) {
							next(error);
						}
					});
					return () => {
						if (config.ssr === false) previewServer.middlewares.use(async (req, res, next) => {
							try {
								res.statusCode = 404;
								const url = new URL(req.url || "/", `http://localhost`);
								const htmlFilePath = path$1.join(clientBuildDirectory, url.pathname.endsWith(".rsc") ? "__spa-fallback.rsc" : "__spa-fallback.html");
								if (existsSync$1(htmlFilePath)) {
									res.setHeader("Content-Type", "text/html");
									res.end(await readFile$1(htmlFilePath, "utf-8"));
									return;
								}
								res.end();
							} catch (error) {
								next(error);
							}
						});
					};
				}
			},
			buildApp: {
				order: "post",
				async handler() {
					await configLoader.close();
				}
			}
		},
		(() => {
			let logged = false;
			function logExperimentalNotice() {
				if (logged) return;
				logged = true;
				logger.info(colors.yellow(`${viteCommand === "serve" ? "  " : ""}🧪 Using React Router's RSC Framework Mode (experimental)`));
			}
			return {
				name: "react-router/rsc/log-experimental-notice",
				sharedDuringBuild: true,
				buildStart: logExperimentalNotice,
				configureServer: logExperimentalNotice
			};
		})(),
		process.env.IS_RR_BUILD_REQUEST !== "yes" ? {
			name: "react-router/rsc/typegen",
			async config(viteUserConfig, { command, mode }) {
				if (command === "serve") {
					const vite = await import("vite");
					typegenWatcherPromise ??= watch(getRootDirectory(viteUserConfig), {
						mode,
						rsc: true,
						logger: vite.createLogger("warn", { prefix: "[react-router]" })
					});
				}
			},
			async buildEnd() {
				(await typegenWatcherPromise)?.close();
			}
		} : null,
		{
			name: "react-router/rsc/virtual-route-config",
			resolveId(id) {
				if (id === virtual.routeConfig.id) return virtual.routeConfig.resolvedId;
			},
			load(id) {
				if (id === virtual.routeConfig.resolvedId) {
					const result = createVirtualRouteConfig({
						appDirectory: config.appDirectory,
						routeConfig: config.unstable_routeConfig
					});
					routeIdByFile = result.routeIdByFile;
					return result.code;
				}
			}
		},
		virtualRouteModulesPlugin({
			environments: {
				client: ["client", "ssr"],
				server: ["rsc"]
			},
			getRouteIdForFile,
			isRootRouteModule,
			transformToJs,
			enforceSplitRouteModules: () => config.splitRouteModules === "enforce"
		}),
		{
			name: "react-router/rsc/virtual-basename",
			resolveId(id) {
				if (id === virtual.basename.id) return virtual.basename.resolvedId;
			},
			load(id) {
				if (id === virtual.basename.resolvedId) return `export default ${JSON.stringify(config.basename)};`;
			}
		},
		{
			name: "react-router/rsc/virtual-route-discovery",
			resolveId(id) {
				if (id === virtual.routeDiscovery.id) return virtual.routeDiscovery.resolvedId;
			},
			load(id) {
				if (id === virtual.routeDiscovery.resolvedId) return `export default ${JSON.stringify(config.ssr === false ? { mode: "initial" } : config.routeDiscovery ?? { mode: "lazy" })};`;
			}
		},
		{
			name: "react-router/rsc/hmr/inject-runtime",
			enforce: "pre",
			resolveId(id) {
				if (id === virtual.injectHmrRuntime.id) return virtual.injectHmrRuntime.resolvedId;
			},
			async load(id) {
				if (id !== virtual.injectHmrRuntime.resolvedId) return;
				return viteCommand === "serve" ? [`if (import.meta.hot) {
  import.meta.hot.accept();
  import.meta.hot.on('rsc:update', () => {
    // Defer revalidation to the next animation frame so React Fast Refresh
    // can apply pending client component updates first. Without this delay,
    // the RSC payload (showing updated text) can arrive and be reconciled
    // against a DOM that still has the old text, causing a hydration mismatch.
    requestAnimationFrame(() => {
      __reactRouterDataRouter.revalidate()
    });
  })
}`].join("\n") : "";
			}
		},
		{
			name: "react-router/rsc/virtual-react-router-serve-config",
			resolveId(id) {
				if (id === virtual.reactRouterServeConfig.id) return virtual.reactRouterServeConfig.resolvedId;
			},
			load(id) {
				if (id === virtual.reactRouterServeConfig.resolvedId) {
					const rscOutDir = resolvedViteConfig.environments.rsc?.build?.outDir;
					invariant(rscOutDir, "RSC build directory config not found");
					const clientOutDir = resolvedViteConfig.environments.client?.build?.outDir;
					invariant(clientOutDir, "Client build directory config not found");
					const assetsBuildDirectory = Path.relative(rscOutDir, clientOutDir);
					const publicPath = resolvedViteConfig.base;
					return `export default ${JSON.stringify({
						assetsBuildDirectory,
						publicPath
					})};`;
				}
			}
		},
		validatePluginOrder(),
		warnOnClientSourceMaps(),
		prerender({
			config() {
				return {
					buildDirectory: getClientBuildDirectory(config),
					concurrency: getPrerenderConcurrencyConfig(config)
				};
			},
			logFile: (path) => logger.info(`Prerendered ${colors.bold(path)}`),
			async requests() {
				const prerenderPaths = new Set(await getPrerenderPaths(config.prerender, config.ssr, config.routes, true));
				let basename = !config.basename || config.basename === "/" ? "/" : config.basename.endsWith("/") ? config.basename : config.basename + "/";
				if (config.ssr === false) prerenderPaths.add("/__spa-fallback.html");
				return Array.from(prerenderPaths).map((prerenderPath) => `http://localhost${basename}${prerenderPath.slice(1)}`);
			},
			async postProcess(request, response, metadata) {
				let url = new URL(request.url);
				let isRedirect = redirectStatusCodes.has(response.status);
				if (!isRedirect && response.status !== 200 && response.status !== 202 && !(url.pathname === "/__spa-fallback.html" && response.status === 404)) throw new Error(`Prerender (data): Received a ${response.status} status code from \`entry.server.tsx\` while prerendering the \`${url.pathname}\` path.\n${url.pathname}`, { cause: response });
				if (metadata?.manifest) return [{
					path: url.pathname,
					contents: await response.text()
				}];
				let isHtml = response.headers.get("content-type")?.includes("text/html");
				let htmlResponse = isHtml ? isRedirect ? response : response.clone() : null;
				let location = response.headers.get("Location");
				let delay = response.status === 302 ? 2 : 0;
				let redirectBody = isRedirect ? `<!doctype html>
<head>
<title>Redirecting to: ${location}</title>
<meta http-equiv="refresh" content="${delay};url=${location}">
<meta name="robots" content="noindex">
</head>
<body>
	<a href="${location}">
  Redirecting from <code>${url.pathname}</code> to <code>${location}</code>
</a>
</body>
</html>` : "";
				let files = [{
					path: isHtml || redirectBody ? url.pathname === "/__spa-fallback.html" ? "__spa-fallback.html" : (url.pathname.endsWith("/") ? url.pathname : url.pathname + "/") + "index.html" : url.pathname,
					contents: redirectBody || (isHtml ? await response.text() : new Uint8Array(await response.arrayBuffer()))
				}];
				if (htmlResponse) {
					let body = await htmlResponse.text();
					let matches = Array.from(body.matchAll(/<script>\(self\.__FLIGHT_DATA\|\|=\[\]\)\.push\(("(?:[^"\\]|\\.)*")\)<\/script>/gim));
					if (matches.length) {
						let rscData = "";
						for (const match of matches) rscData += JSON.parse(match[1]);
						files.push({
							path: url.pathname === "/" ? "_.rsc" : (url.pathname === "/__spa-fallback.html" ? "__spa-fallback" : url.pathname) + ".rsc",
							contents: rscData
						});
					}
				} else if (!url.pathname.endsWith(".rsc")) {
					let dataUrl = new URL(url);
					dataUrl.pathname += ".rsc";
					return {
						files,
						requests: [dataUrl.href]
					};
				}
				return files;
			}
		})
	];
}
const virtual = {
	routeConfig: create("unstable_rsc/routes"),
	routeDiscovery: create("unstable_rsc/route-discovery"),
	injectHmrRuntime: create("unstable_rsc/inject-hmr-runtime"),
	basename: create("unstable_rsc/basename"),
	reactRouterServeConfig: create("unstable_rsc/react-router-serve-config")
};
function invalidateVirtualModules(viteDevServer) {
	for (const vmod of Object.values(virtual)) for (const env of Object.values(viteDevServer.environments)) {
		const mod = env.moduleGraph.getModuleById(vmod.resolvedId);
		if (mod) env.moduleGraph.invalidateModule(mod);
	}
}
function getRootDirectory(viteUserConfig) {
	return viteUserConfig.root ?? process.env.REACT_ROUTER_ROOT ?? process.cwd();
}
const jsRouteModuleRE = /\.[cm]?[jt]sx?$/;
function createRSCOptimizeDepsRouteModulesPlugin({ routeFiles, transformToJs }) {
	return {
		name: "react-router:rsc-optimize-deps-route-modules",
		transform: {
			filter: { id: jsRouteModuleRE },
			async handler(code, id) {
				let filename = id.split("?")[0];
				let normalizedFilename = getVite().normalizePath(filename);
				if (!routeFiles.has(normalizedFilename)) return;
				return {
					code: createClientRouteModuleForOptimizeDepsScan(await transformToJs(code, filename)).code,
					map: null,
					moduleType: "js"
				};
			}
		}
	};
}
const getClientBuildDirectory = (reactRouterConfig) => path$1.join(reactRouterConfig.buildDirectory, "client");
function getPrerenderConcurrencyConfig(reactRouterConfig) {
	let concurrency = 1;
	let { prerender } = reactRouterConfig;
	if (typeof prerender === "object" && "concurrency" in prerender) concurrency = prerender.concurrency ?? 1;
	return concurrency;
}
//#endregion
export { reactRouterVitePlugin as reactRouter, reactRouterRSCVitePlugin as unstable_reactRouterRSC };
