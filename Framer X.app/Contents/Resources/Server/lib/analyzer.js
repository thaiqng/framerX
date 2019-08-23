"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ts = require("typescript");
const logger_1 = require("./logger");
const logger = logger_1.createLogger("framer:analyzer");
const printer = ts.createPrinter({
    newLine: ts.NewLineKind.LineFeed,
});
function toSourceCode(node, source) {
    return printer.printNode(ts.EmitHint.Unspecified, node, source || node.getSourceFile());
}
exports.toSourceCode = toSourceCode;
function printAllChildren(node, depth = 0) {
    logger.log(new Array(depth + 1).join("----"), ts.formatSyntaxKind(node.kind), node.pos, node.end);
    depth++;
    node.forEachChild(c => printAllChildren(c, depth));
}
exports.printAllChildren = printAllChildren;
function referencesIdentifier(node, name) {
    let seen = false;
    function references(n) {
        if (seen)
            return;
        if (ts.isIdentifier(n)) {
            if (n.escapedText.toString() === name) {
                seen = true;
                return;
            }
        }
        ts.forEachChild(n, references);
    }
    references(node);
    return seen;
}
exports.referencesIdentifier = referencesIdentifier;
function hasNodeKind(node, kind) {
    let seen = false;
    function kinds(n) {
        if (seen)
            return;
        if (n.kind === kind) {
            seen = true;
            return;
        }
        ts.forEachChild(n, kinds);
    }
    kinds(node);
    return seen;
}
function hasNodeKindRange(node, firstKind, lastKind) {
    let seen = false;
    function kinds(n) {
        if (seen)
            return;
        if (n.kind >= firstKind && n.kind <= lastKind) {
            seen = true;
            return;
        }
        ts.forEachChild(n, kinds);
    }
    kinds(node);
    return seen;
}
// at every potential repeat point, we inject a check if we might be out of budget
function createInstrument() {
    const fn = ts.createElementAccess(ts.createIdentifier("window"), ts.createLiteral("__checkBudget__"));
    return ts.createStatement(ts.createCall(fn, [], []));
}
function instrumentIterator(node) {
    const block = node.statement;
    if (ts.isBlock(block)) {
        return ts.updateBlock(block, [createInstrument()].concat(block.statements));
    }
    else {
        return ts.createBlock([createInstrument(), block]);
    }
}
function instrumentVisitor(node) {
    node = ts.visitEachChild(node, instrumentVisitor, _ctx);
    if (ts.isWhileStatement(node)) {
        return ts.updateWhile(node, node.expression, instrumentIterator(node));
    }
    if (ts.isForStatement(node)) {
        return ts.updateFor(node, node.initializer, node.condition, node.incrementor, instrumentIterator(node));
    }
    if (ts.isFunctionDeclaration(node) && node.body) {
        const body = node.body;
        return ts.updateFunctionDeclaration(node, node.decorators, node.modifiers, node.asteriskToken, node.name, node.typeParameters, node.parameters, node.type, ts.updateBlock(body, [createInstrument()].concat(body.statements)));
    }
    if (ts.isFunctionExpression(node)) {
        const body = node.body;
        return ts.updateFunctionExpression(node, node.modifiers, node.asteriskToken, node.name, node.typeParameters, node.parameters, node.type, ts.updateBlock(body, [createInstrument()].concat(body.statements)));
    }
    if (ts.isMethodDeclaration(node) && node.body) {
        const body = node.body;
        return ts.updateMethod(node, node.decorators, node.modifiers, node.asteriskToken, node.name, node.questionToken, node.typeParameters, node.parameters, node.type, ts.updateBlock(body, [createInstrument()].concat(body.statements)));
    }
    if (ts.isArrowFunction(node) && ts.isBlock(node.body)) {
        const body = node.body;
        return ts.updateArrowFunction(node, node.modifiers, node.typeParameters, node.parameters, node.type, node.equalsGreaterThanToken, ts.updateBlock(body, [createInstrument()].concat(body.statements)));
    }
    if (ts.isConstructorDeclaration(node) && node.body) {
        const body = node.body;
        const statements = body.statements;
        const first = statements[0];
        const firstToken = first ? first.getFirstToken() : null;
        const firstIsSuperCall = firstToken ? firstToken.getText() === "super" : false;
        let instrumentedBody;
        if (firstIsSuperCall) {
            instrumentedBody = [first, createInstrument()].concat(statements.slice(1));
        }
        else {
            instrumentedBody = [createInstrument()].concat(statements);
        }
        return ts.updateConstructor(node, node.decorators, node.modifiers, node.parameters, ts.updateBlock(body, instrumentedBody));
    }
    return node;
}
exports.instrumentVisitor = instrumentVisitor;
var EntityType;
(function (EntityType) {
    EntityType["Component"] = "component";
    EntityType["Override"] = "override";
    EntityType["Action"] = "action";
    // Device and DeviceSkin are currently not used in code, only in package.json of Framer Library, keeping for completeness
    EntityType["Device"] = "device";
    EntityType["DeviceSkin"] = "deviceSkin";
})(EntityType = exports.EntityType || (exports.EntityType = {}));
function buildInfoExport(entities) {
    const dicts = entities.map(c => {
        const properties = [ts.createPropertyAssignment(ts.createStringLiteral("name"), ts.createLiteral(c.name))];
        if (c.children !== undefined) {
            properties.push(ts.createPropertyAssignment(ts.createStringLiteral("children"), ts.createLiteral(c.children)));
        }
        properties.push(ts.createPropertyAssignment(ts.createStringLiteral("type"), ts.createLiteral(c.type)));
        return ts.createObjectLiteral(properties);
    });
    const info = ts.createVariableDeclaration("__info__", undefined, ts.createArrayLiteral(dicts));
    return ts.createVariableStatement([ts.createToken(ts.SyntaxKind.ExportKeyword)], [info]);
}
exports.buildInfoExport = buildInfoExport;
function analyzeClasses(node, entities, exports) {
    if (!ts.isClassDeclaration(node))
        return;
    // figure out name
    let name = "Default";
    if (node.name) {
        name = node.name.getText();
    }
    if (node.modifiers) {
        for (const x of node.modifiers) {
            if (x.kind === ts.SyntaxKind.ExportKeyword) {
                exports.add(name);
                break;
            }
        }
    }
    // must extend Component, we blindly assume that means React.Component
    let extendsComponent = false;
    if (node.heritageClauses) {
        for (const x of node.heritageClauses) {
            if (referencesIdentifier(x, "Component")) {
                extendsComponent = true;
                break;
            }
        }
    }
    if (!extendsComponent)
        return;
    // figure out if this node references this.props.children
    // there are so many ways it can, we merely look for a `children` identifier being used
    const children = referencesIdentifier(node, "children");
    const type = EntityType.Component;
    entities.set(name, { children, type });
}
function analyzeHigherOrderComponent(node, name, entities) {
    if (!node)
        return;
    if (!ts.isCallExpression(node))
        return;
    node.arguments.forEach(n => {
        if (ts.isIdentifier(n)) {
            const ref = n.escapedText.toString();
            if (entities.has(ref)) {
                // a call expression that direcly references a name that refers to a known component class
                entities.set(name, entities.get(ref));
            }
        }
    });
}
function analyzeAnnotatedExport(node, name, entities) {
    if (!node)
        return;
    const type = node.type;
    if (!type)
        return;
    if (type.getText() === "React.ComponentClass") {
        entities.set(name, { type: EntityType.Component });
    }
}
function analyzeOverride(node, name, entities) {
    if (!node)
        return;
    if (!node.initializer)
        return;
    const type = node.type;
    if (type &&
        ts.isTypeReferenceNode(type) &&
        ts.isIdentifier(type.typeName) &&
        (type.typeName.escapedText === "Override" || type.typeName.escapedText === "OverrideFunction")) {
        entities.set(name, { type: EntityType.Override });
    }
}
function analyzeOverrideFunction(node, name, entities) {
    if (!node)
        return;
    const type = node.type;
    if (type &&
        ts.isTypeReferenceNode(type) &&
        ts.isIdentifier(type.typeName) &&
        (type.typeName.escapedText === "Override" || type.typeName.escapedText === "OverrideFunction")) {
        entities.set(name, { type: EntityType.Override });
    }
}
function analyzeActionFunction(node, name, entities) {
    if (!node)
        return;
    const type = node.type;
    if (type &&
        ts.isTypeReferenceNode(type) &&
        ts.isIdentifier(type.typeName) &&
        (type.typeName.escapedText === "Action" || type.typeName.escapedText === "ActionHandler")) {
        entities.set(name, { type: EntityType.Action });
    }
}
function analyzeStatelessComponent(node, name, entities) {
    if (!node)
        return;
    let body;
    if (ts.isFunctionDeclaration(node)) {
        body = node;
    }
    else if (node.initializer && ts.isFunctionLike(node.initializer)) {
        body = node.initializer;
    }
    if (!body)
        return;
    // Components must start with capital, this will set them apart from most functions
    const firstChar = name[0];
    if (firstChar !== firstChar.toUpperCase())
        return;
    let isComponent = false;
    // Trust the types
    const type = node.type;
    if (type && ts.isTypeReferenceNode(type)) {
        const typeName = type.typeName.getText();
        isComponent = typeName.match(/^(React\.)?(SFC|StatelessComponent|FunctionComponent)$/) !== null;
    }
    // Has JSX
    if (!isComponent && hasNodeKindRange(body, ts.SyntaxKind.JsxElement, ts.SyntaxKind.JsxExpression)) {
        isComponent = true;
    }
    if (isComponent) {
        entities.set(name, {
            children: referencesIdentifier(body, "children"),
            type: EntityType.Component,
        });
    }
}
function analyzeExportedVariableDeclaration(node, entities, exports, exported) {
    // not all nodes seem to be connected to a source file in practice
    if (!node.getSourceFile())
        return;
    node.declarations.forEach(n => {
        if (ts.isVariableDeclaration(n)) {
            const name = n.name.getText();
            if (exported)
                exports.add(name);
            analyzeAnnotatedExport(n, name, entities);
            analyzeHigherOrderComponent(n.initializer, name, entities);
            analyzeStatelessComponent(n, name, entities);
            analyzeOverride(n, name, entities);
        }
    });
}
function analyzeExportedIdentifiers(node, exports) {
    if (ts.isIdentifier(node)) {
        exports.add(node.escapedText.toString());
    }
    ts.forEachChild(node, n => analyzeExportedIdentifiers(n, exports));
}
function isExported(node) {
    let exported = false;
    if (node.modifiers) {
        for (const x of node.modifiers) {
            if (x.kind === ts.SyntaxKind.ExportKeyword) {
                exported = true;
                break;
            }
        }
    }
    return exported;
}
function analyzeExports(node, entities, exports) {
    if (ts.isClassDeclaration(node))
        return;
    if (ts.isVariableStatement(node)) {
        const exported = isExported(node);
        // also find higher order components if we find `ident = call(..., ident, ...)`
        analyzeExportedVariableDeclaration(node.declarationList, entities, exports, exported);
        return;
    }
    if (ts.isFunctionDeclaration(node) && node.name && isExported(node)) {
        const name = node.name.getText();
        exports.add(name);
        analyzeStatelessComponent(node, name, entities);
        analyzeOverrideFunction(node, name, entities);
        analyzeActionFunction(node, name, entities);
        return;
    }
    if (ts.isExportDeclaration(node)) {
        analyzeExportedIdentifiers(node, exports);
        return;
    }
    if (ts.isExportAssignment(node)) {
        analyzeExportedIdentifiers(node, exports);
        return;
    }
    if (ts.isExportSpecifier(node)) {
        analyzeExportedIdentifiers(node, exports);
        return;
    }
}
function analyzeFile(sourceFile) {
    const statements = [];
    const exportedNames = new Set();
    const entities = new Map();
    sourceFile.statements.forEach(n => {
        if (ts.isVariableStatement(n)) {
            if (referencesIdentifier(n, "___info__") || referencesIdentifier(n, "__info__")) {
                return;
            }
        }
        statements.push(instrumentVisitor(n));
        analyzeClasses(n, entities, exportedNames);
        analyzeExports(n, entities, exportedNames);
    });
    if (exportedNames.size > 0) {
        const results = [];
        for (const name of entities.keys()) {
            if (!exportedNames.has(name))
                continue;
            const { children, type } = entities.get(name);
            results.push({ name, children, type });
        }
        statements.push(buildInfoExport(results));
    }
    return ts.updateSourceFileNode(sourceFile, ts.createNodeArray(statements));
}
let _ctx;
function analyzeAndExportComponents(ctx) {
    return (sourceFile) => {
        _ctx = ctx;
        return analyzeFile(sourceFile);
    };
}
exports.analyzeAndExportComponents = analyzeAndExportComponents;
