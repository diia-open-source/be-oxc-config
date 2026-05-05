export default {
    meta: { name: '@diia-inhouse/oxlint-plugin-class' },
    rules: {
        'no-module-level-const': {
            meta: {
                type: 'suggestion',
                messages: {
                    forbidden:
                        'Module-level "{{ kind }} {{ name }}" should be a private class property. Only types, interfaces, and re-exports belong at module level alongside a class.',
                },
            },
            create(context) {
                return {
                    'Program:exit'(programNode) {
                        const hasDefaultClassExport = programNode.body.some(
                            (stmt) =>
                                stmt.type === 'ExportDefaultDeclaration' &&
                                stmt.declaration &&
                                stmt.declaration.type === 'ClassDeclaration',
                        )

                        if (!hasDefaultClassExport) {
                            return
                        }

                        for (const stmt of programNode.body) {
                            if (stmt.type !== 'VariableDeclaration') {
                                continue
                            }

                            for (const decl of stmt.declarations) {
                                const name = decl.id.type === 'Identifier' ? decl.id.name : '<destructured>'

                                context.report({
                                    node: decl,
                                    messageId: 'forbidden',
                                    data: { kind: stmt.kind, name },
                                })
                            }
                        }
                    },
                }
            },
        },

        'no-interface-in-implementation': {
            meta: {
                type: 'problem',
                messages: {
                    forbidden:
                        '{{ kind }} "{{ name }}" must be in a separate file. Types and interfaces must not share a file with class implementation.',
                },
            },
            create(context) {
                return {
                    'Program:exit'(programNode) {
                        const hasDefaultClassExport = programNode.body.some(
                            (stmt) =>
                                stmt.type === 'ExportDefaultDeclaration' &&
                                stmt.declaration &&
                                stmt.declaration.type === 'ClassDeclaration',
                        )

                        if (!hasDefaultClassExport) {
                            return
                        }

                        for (const stmt of programNode.body) {
                            if (stmt.type === 'TSInterfaceDeclaration') {
                                context.report({
                                    node: stmt,
                                    messageId: 'forbidden',
                                    data: { kind: 'interface', name: stmt.id.name },
                                })
                            }

                            if (stmt.type === 'TSTypeAliasDeclaration') {
                                context.report({
                                    node: stmt,
                                    messageId: 'forbidden',
                                    data: { kind: 'type', name: stmt.id.name },
                                })
                            }

                            if (stmt.type === 'ExportNamedDeclaration' && stmt.declaration) {
                                if (stmt.declaration.type === 'TSInterfaceDeclaration') {
                                    context.report({
                                        node: stmt.declaration,
                                        messageId: 'forbidden',
                                        data: { kind: 'interface', name: stmt.declaration.id.name },
                                    })
                                }

                                if (stmt.declaration.type === 'TSTypeAliasDeclaration') {
                                    context.report({
                                        node: stmt.declaration,
                                        messageId: 'forbidden',
                                        data: { kind: 'type', name: stmt.declaration.id.name },
                                    })
                                }
                            }
                        }
                    },
                }
            },
        },
    },
}
