function isSchemaConstructor(callee) {
    return (
        (callee.type === 'Identifier' && callee.name === 'Schema') ||
        (callee.type === 'MemberExpression' &&
            callee.object.type === 'Identifier' &&
            callee.object.name === 'mongoose' &&
            callee.property.type === 'Identifier' &&
            callee.property.name === 'Schema')
    )
}

function getOptionValue(optionsNode, key) {
    if (!optionsNode || optionsNode.type !== 'ObjectExpression') {
        return undefined
    }

    const prop = optionsNode.properties.find((p) => p.type === 'Property' && p.key.type === 'Identifier' && p.key.name === key)

    if (!prop) {
        return undefined
    }

    return prop.value.type === 'Literal' ? prop.value.value : undefined
}

function isModelFile(filename) {
    return filename.includes('/models/')
}

export default {
    meta: { name: '@diia-inhouse/oxlint-plugin-mongoose' },
    rules: {
        'schema-timestamps': {
            meta: {
                type: 'problem',
                messages: {
                    missing: 'Mongoose schema is missing { timestamps: true } in options.',
                },
            },
            create(context) {
                if (!isModelFile(context.filename)) {
                    return {}
                }

                const subSchemaVars = new Set()

                return {
                    'VariableDeclarator[init.type="NewExpression"]'(node) {
                        if (!isSchemaConstructor(node.init.callee)) {
                            return
                        }

                        const options = node.init.arguments[1]

                        if (getOptionValue(options, '_id') === false) {
                            subSchemaVars.add(node.id.name)
                        }
                    },
                    'ExportDefaultDeclaration, ExportNamedDeclaration'() {
                        // Reset tracking per export boundary — not needed
                    },
                    'Program:exit'(programNode) {
                        for (const stmt of programNode.body) {
                            if (stmt.type !== 'VariableDeclaration') {
                                continue
                            }

                            for (const decl of stmt.declarations) {
                                if (!decl.init || decl.init.type !== 'NewExpression' || !isSchemaConstructor(decl.init.callee)) {
                                    continue
                                }

                                if (subSchemaVars.has(decl.id.name)) {
                                    continue
                                }

                                const options = decl.init.arguments[1]

                                if (getOptionValue(options, 'timestamps') !== true) {
                                    context.report({ node: decl, messageId: 'missing' })
                                }
                            }
                        }
                    },
                }
            },
        },

        'sub-schema-id-false': {
            meta: {
                type: 'problem',
                messages: {
                    missing: 'Sub-schema is missing { _id: false } in options. Embedded documents should not generate _id.',
                },
            },
            create(context) {
                if (!isModelFile(context.filename)) {
                    return {}
                }

                const schemaVars = new Map()

                return {
                    VariableDeclarator(node) {
                        if (!node.init || node.init.type !== 'NewExpression' || !isSchemaConstructor(node.init.callee)) {
                            return
                        }

                        schemaVars.set(node.id.name, {
                            node: node.init,
                            hasIdFalse: getOptionValue(node.init.arguments[1], '_id') === false,
                            hasTimestamps: getOptionValue(node.init.arguments[1], 'timestamps') === true,
                            usedAsSubSchema: false,
                        })
                    },
                    Property(node) {
                        if (node.key.type !== 'Identifier' || node.key.name !== 'type' || node.value.type !== 'ArrayExpression') {
                            return
                        }

                        for (const el of node.value.elements) {
                            if (el && el.type === 'Identifier' && schemaVars.has(el.name)) {
                                schemaVars.get(el.name).usedAsSubSchema = true
                            }
                        }
                    },
                    'Program:exit'() {
                        for (const [, info] of schemaVars) {
                            if (info.usedAsSubSchema && !info.hasIdFalse) {
                                context.report({ node: info.node, messageId: 'missing' })
                            }
                        }
                    },
                }
            },
        },

        'status-requires-history': {
            meta: {
                type: 'problem',
                messages: {
                    missing:
                        'Schema has "status" field but no "statusHistory". Every model with status MUST have statusHistory — missing it is a data corruption bug.',
                },
            },
            create(context) {
                if (!isModelFile(context.filename)) {
                    return {}
                }

                return {
                    NewExpression(node) {
                        if (!isSchemaConstructor(node.callee)) {
                            return
                        }

                        const options = node.arguments[1]

                        if (getOptionValue(options, '_id') === false) {
                            return
                        }

                        const fields = node.arguments[0]

                        if (!fields || fields.type !== 'ObjectExpression') {
                            return
                        }

                        const fieldNames = new Set(
                            fields.properties.filter((p) => p.type === 'Property' && p.key.type === 'Identifier').map((p) => p.key.name),
                        )

                        const hasHistory = [...fieldNames].some((name) => name.toLowerCase().includes('statushistor'))

                        if (fieldNames.has('status') && !hasHistory) {
                            context.report({ node, messageId: 'missing' })
                        }
                    },
                }
            },
        },
    },
}
