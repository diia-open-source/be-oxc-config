function isTestFile(filename) {
    return filename.includes('/tests/') || filename.includes('/test/')
}

function isWorkflowFile(filename) {
    return !isTestFile(filename) && filename.includes('/worker/workflows/') && !filename.includes('.types.')
}

function isActivityFile(filename) {
    return !isTestFile(filename) && filename.includes('/worker/activities/')
}

const FORBIDDEN_NODE_MODULES = new Set([
    'node:path',
    'path',
    'node:fs',
    'fs',
    'node:fs/promises',
    'fs/promises',
    'node:crypto',
    'crypto',
    'node:child_process',
    'child_process',
    'node:os',
    'os',
    'node:net',
    'net',
    'node:dns',
    'dns',
    'node:http',
    'http',
    'node:https',
    'https',
])

export default {
    meta: { name: '@diia-inhouse/oxlint-plugin-temporal' },
    rules: {
        'workflow-single-param': {
            meta: {
                type: 'problem',
                messages: {
                    tooMany:
                        'Workflow function "{{ name }}" has {{ count }} parameters. Workflows must accept a single object parameter for serialization compatibility.',
                },
            },
            create(context) {
                if (!isWorkflowFile(context.filename)) {
                    return {}
                }

                function checkFunction(node, name) {
                    if (node.params.length > 1) {
                        context.report({
                            node,
                            messageId: 'tooMany',
                            data: { name: name || '<anonymous>', count: String(node.params.length) },
                        })
                    }
                }

                return {
                    'ExportNamedDeclaration > FunctionDeclaration'(node) {
                        checkFunction(node, node.id?.name)
                    },
                    'ExportNamedDeclaration > VariableDeclaration > VariableDeclarator'(node) {
                        if (node.init && (node.init.type === 'ArrowFunctionExpression' || node.init.type === 'FunctionExpression')) {
                            checkFunction(node.init, node.id?.name)
                        }
                    },
                }
            },
        },

        'async-activity': {
            meta: {
                type: 'problem',
                messages: {
                    notAsync: 'Activity method "{{ name }}" must be async. All Temporal activities must be async functions.',
                },
            },
            create(context) {
                if (!isActivityFile(context.filename)) {
                    return {}
                }

                return {
                    MethodDefinition(node) {
                        if (node.kind === 'constructor' || node.key.type !== 'Identifier' || node.accessibility === 'private') {
                            return
                        }

                        const fn = node.value

                        if (fn && !fn.async) {
                            context.report({
                                node: node.key,
                                messageId: 'notAsync',
                                data: { name: node.key.name },
                            })
                        }
                    },
                }
            },
        },

        'no-node-imports': {
            meta: {
                type: 'problem',
                messages: {
                    forbidden:
                        'Importing "{{ source }}" in a workflow file will break the Temporal bundle. Workflows run in a sandboxed VM — Node.js built-in modules are not available.',
                },
            },
            create(context) {
                if (!isWorkflowFile(context.filename)) {
                    return {}
                }

                return {
                    ImportDeclaration(node) {
                        const source = node.source.value

                        if (FORBIDDEN_NODE_MODULES.has(source)) {
                            context.report({
                                node: node.source,
                                messageId: 'forbidden',
                                data: { source },
                            })
                        }
                    },
                }
            },
        },

        'no-path-alias-imports': {
            meta: {
                type: 'problem',
                messages: {
                    forbidden:
                        'Path alias "{{ source }}" cannot be used in workflow files. The Temporal bundler does not resolve tsconfig path aliases. Use relative imports or import only from type-only workflow packages.',
                },
            },
            create(context) {
                if (!isWorkflowFile(context.filename)) {
                    return {}
                }

                return {
                    ImportDeclaration(node) {
                        if (node.importKind === 'type') {
                            return
                        }

                        const source = node.source.value

                        if (source.startsWith('@') && !source.startsWith('@diia-inhouse/') && !source.startsWith('@temporalio/')) {
                            context.report({
                                node: node.source,
                                messageId: 'forbidden',
                                data: { source },
                            })
                        }
                    },
                }
            },
        },
    },
}
