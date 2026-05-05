const CYRILLIC_PATTERN = /[\u0400-\u04FF\u0500-\u052F]/

const EXCLUDED_PATHS = ['/locales/', '.spec.ts', '.test.ts', '/tests/']

function isExcludedFile(filename) {
    return EXCLUDED_PATHS.some((path) => filename.includes(path))
}

function checkStringNode(context, node) {
    if (isExcludedFile(context.filename)) {
        return
    }

    const value = node.type === 'TemplateLiteral' ? node.quasis.map((q) => q.value.raw).join('') : node.value

    if (typeof value === 'string' && CYRILLIC_PATTERN.test(value)) {
        context.report({ node, messageId: 'forbidden', data: { text: value.length > 50 ? value.slice(0, 50) + '...' : value } })
    }
}

export default {
    meta: { name: '@diia-inhouse/oxlint-plugin-locale' },
    rules: {
        'no-hardcoded-cyrillic': {
            meta: {
                type: 'problem',
                messages: {
                    forbidden: 'Hardcoded Cyrillic string "{{ text }}" found. Move user-facing text to locale files and use i18n service.',
                },
            },
            create(context) {
                return {
                    Literal(node) {
                        checkStringNode(context, node)
                    },
                    TemplateLiteral(node) {
                        checkStringNode(context, node)
                    },
                }
            },
        },
    },
}
