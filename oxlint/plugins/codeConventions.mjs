function hasInlineObjectReturnType(node) {
    return node.returnType && node.returnType.type === 'TSTypeAnnotation' && node.returnType.typeAnnotation.type === 'TSTypeLiteral'
}

function normalize(str) {
    return str.replace(/[_-]/g, '').toLowerCase()
}

function isEnumLikeObject(node) {
    if (node.type !== 'ObjectExpression' || node.properties.length === 0) {
        return false
    }

    return node.properties.every((prop) => {
        if (prop.type !== 'Property' || prop.computed) {
            return false
        }

        const key = prop.key.type === 'Identifier' ? prop.key.name : prop.key.type === 'Literal' ? String(prop.key.value) : null

        if (!key) {
            return false
        }

        if (prop.value.type !== 'Literal' || typeof prop.value.value !== 'string') {
            return false
        }

        return normalize(key) === normalize(prop.value.value)
    })
}

function isTopLevel(node) {
    const parent = node.parent

    return parent.type === 'Program' || (parent.type === 'ExportNamedDeclaration' && parent.parent.type === 'Program')
}

function getEnumObject(init) {
    if (!init) {
        return null
    }

    let expr = init

    if (expr.type === 'TSSatisfiesExpression') {
        expr = expr.expression
    }

    if (expr.type === 'TSAsExpression') {
        expr = expr.expression
    }

    return isEnumLikeObject(expr) ? expr : null
}

function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1)
}

function isValidPlural(rawSingular, rawPlural) {
    const singular = capitalizeFirst(rawSingular)
    const plural = capitalizeFirst(rawPlural)

    if (plural === singular + 's') {
        return true
    }

    if (plural === singular + 'es' && /(?:s|x|z|sh|ch)$/.test(singular)) {
        return true
    }

    if (singular.endsWith('y') && plural === singular.slice(0, -1) + 'ies') {
        return true
    }

    return false
}

export default {
    meta: { name: '@diia-inhouse/oxlint-plugin-code' },
    rules: {
        'no-inline-object-return-type': {
            meta: {
                type: 'problem',
                messages: {
                    forbidden:
                        'Do not use inline object return types. Declare a named interface or type alias (e.g. `*Response`, `*Result`) instead.',
                },
            },
            create(context) {
                function check(node) {
                    if (hasInlineObjectReturnType(node)) {
                        context.report({ node: node.returnType, messageId: 'forbidden' })
                    }
                }

                return {
                    FunctionDeclaration(node) {
                        check(node)
                    },
                    FunctionExpression(node) {
                        if (node.parent && node.parent.type === 'MethodDefinition') {
                            return
                        }

                        check(node)
                    },
                    ArrowFunctionExpression(node) {
                        check(node)
                    },
                    MethodDefinition(node) {
                        if (node.value) {
                            check(node.value)
                        }
                    },
                }
            },
        },

        'no-promise-settimeout': {
            meta: {
                type: 'problem',
                messages: {
                    forbidden: 'Do not wrap setTimeout in a Promise. Use `import { setTimeout } from "node:timers/promises"` instead.',
                },
            },
            create(context) {
                return {
                    NewExpression(node) {
                        if (node.callee.type !== 'Identifier' || node.callee.name !== 'Promise') {
                            return
                        }

                        const callback = node.arguments[0]

                        if (!callback || (callback.type !== 'ArrowFunctionExpression' && callback.type !== 'FunctionExpression')) {
                            return
                        }

                        const body = callback.body

                        const exprToCheck =
                            body.type === 'CallExpression'
                                ? body
                                : body.type === 'BlockStatement' && body.body.length === 1 && body.body[0].type === 'ExpressionStatement'
                                  ? body.body[0].expression
                                  : null

                        if (
                            exprToCheck &&
                            exprToCheck.type === 'CallExpression' &&
                            exprToCheck.callee.type === 'Identifier' &&
                            exprToCheck.callee.name === 'setTimeout'
                        ) {
                            context.report({ node, messageId: 'forbidden' })
                        }
                    },
                }
            },
        },

        'const-enum-naming': {
            meta: {
                type: 'suggestion',
                messages: {
                    notPascalCase: "Enum-like const object '{{name}}' should use PascalCase naming.",
                    notPlural: "Enum-like const object '{{name}}' should have a plural name (e.g., '{{name}}s').",
                },
            },
            create(context) {
                return {
                    VariableDeclaration(node) {
                        if (node.kind !== 'const' || !isTopLevel(node)) {
                            return
                        }

                        for (const declarator of node.declarations) {
                            if (!declarator.id || declarator.id.type !== 'Identifier') {
                                continue
                            }

                            if (!getEnumObject(declarator.init)) {
                                continue
                            }

                            const name = declarator.id.name

                            if (!/^[A-Z]/.test(name)) {
                                context.report({ node: declarator.id, messageId: 'notPascalCase', data: { name } })
                            }

                            if (!name.endsWith('s')) {
                                context.report({ node: declarator.id, messageId: 'notPlural', data: { name } })
                            }
                        }
                    },
                }
            },
        },

        'const-enum-type-name': {
            meta: {
                type: 'suggestion',
                messages: {
                    notSingular: "Type '{{typeName}}' derived from '{{objectName}}' should be the singular form of the object name.",
                },
            },
            create(context) {
                return {
                    TSTypeAliasDeclaration(node) {
                        const typeAnnotation = node.typeAnnotation

                        if (typeAnnotation.type !== 'TSIndexedAccessType') {
                            return
                        }

                        const objectType = typeAnnotation.objectType

                        if (objectType.type !== 'TSTypeQuery' || !objectType.exprName || objectType.exprName.type !== 'Identifier') {
                            return
                        }

                        const objectName = objectType.exprName.name
                        const indexType = typeAnnotation.indexType

                        if (indexType.type !== 'TSTypeOperator' || indexType.operator !== 'keyof') {
                            return
                        }

                        if (
                            !indexType.typeAnnotation ||
                            indexType.typeAnnotation.type !== 'TSTypeQuery' ||
                            !indexType.typeAnnotation.exprName ||
                            indexType.typeAnnotation.exprName.type !== 'Identifier'
                        ) {
                            return
                        }

                        if (indexType.typeAnnotation.exprName.name !== objectName) {
                            return
                        }

                        const typeName = node.id.name

                        if (!isValidPlural(typeName, objectName)) {
                            context.report({ node: node.id, messageId: 'notSingular', data: { typeName, objectName } })
                        }
                    },
                }
            },
        },

        'prefer-as-const-object': {
            meta: {
                type: 'suggestion',
                messages: {
                    missingAsConst: 'Enum-like objects where values match keys should use `as const` to preserve literal types.',
                },
            },
            create(context) {
                return {
                    VariableDeclaration(node) {
                        if (node.kind !== 'const' || !isTopLevel(node)) {
                            return
                        }

                        for (const declarator of node.declarations) {
                            if (declarator.init && isEnumLikeObject(declarator.init)) {
                                context.report({ node: declarator.init, messageId: 'missingAsConst' })
                            }
                        }
                    },
                }
            },
        },
    },
}
