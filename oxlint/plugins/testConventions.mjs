const PERSISTENT_MOCK_METHODS = new Set(['mockResolvedValue', 'mockReturnValue', 'mockRejectedValue', 'mockImplementation'])

function getOnceVariant(name) {
    return `${name}Once`
}

export default {
    meta: { name: '@diia-inhouse/oxlint-plugin-test' },
    rules: {
        'no-persistent-mock': {
            meta: {
                type: 'problem',
                messages: {
                    forbidden:
                        'Use {{ once }}() instead of {{ method }}(). Persistent mocks hide test isolation issues and mask unexpected call counts.',
                },
            },
            create(context) {
                return {
                    CallExpression(node) {
                        if (
                            node.callee.type === 'MemberExpression' &&
                            node.callee.property.type === 'Identifier' &&
                            PERSISTENT_MOCK_METHODS.has(node.callee.property.name)
                        ) {
                            const method = node.callee.property.name

                            context.report({
                                node: node.callee.property,
                                messageId: 'forbidden',
                                data: { method, once: getOnceVariant(method) },
                            })
                        }
                    },
                }
            },
        },

        'no-vi-mock-in-workflows': {
            meta: {
                type: 'problem',
                messages: {
                    forbidden: 'vi.mock() is forbidden in workflow tests. Use mockActivities() from Temporal test utilities instead.',
                },
            },
            create(context) {
                if (!context.filename.includes('/worker/')) {
                    return {}
                }

                return {
                    CallExpression(node) {
                        if (
                            node.callee.type === 'MemberExpression' &&
                            node.callee.object.type === 'Identifier' &&
                            node.callee.object.name === 'vi' &&
                            node.callee.property.type === 'Identifier' &&
                            node.callee.property.name === 'mock'
                        ) {
                            context.report({ node, messageId: 'forbidden' })
                        }
                    },
                }
            },
        },
    },
}
