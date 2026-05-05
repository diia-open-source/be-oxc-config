import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

let pkg = null
let loaded = false

function loadPackageJson() {
    if (loaded) {
        return pkg
    }

    loaded = true

    try {
        pkg = JSON.parse(readFileSync(resolve('package.json'), 'utf8'))
    } catch {
        // package.json not found or not parseable
    }

    return pkg
}

const VERSION_RANGE_PATTERN = /^[\^~]/

const DEP_FIELDS = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies']

export default {
    meta: { name: '@diia-inhouse/oxlint-plugin-package' },
    rules: {
        'no-service-in-package-name': {
            meta: {
                type: 'problem',
                messages: {
                    forbidden: 'package.json "name" field must not contain the word "service" (found: "{{ name }}")',
                },
            },
            create(context) {
                return {
                    Program(node) {
                        const data = loadPackageJson()

                        if (data?.name?.includes('service')) {
                            context.report({ node, messageId: 'forbidden', data: { name: data.name } })
                        }
                    },
                }
            },
        },

        'pinned-dependencies': {
            meta: {
                type: 'problem',
                messages: {
                    unpinned: 'Dependency "{{ name }}" has unpinned version "{{ version }}". Pin to an exact version (remove ^ or ~).',
                },
            },
            create(context) {
                return {
                    Program(node) {
                        const data = loadPackageJson()

                        if (!data) {
                            return
                        }

                        for (const field of DEP_FIELDS) {
                            const deps = data[field]

                            if (!deps) {
                                continue
                            }

                            for (const [name, version] of Object.entries(deps)) {
                                if (typeof version === 'string' && VERSION_RANGE_PATTERN.test(version)) {
                                    context.report({ node, messageId: 'unpinned', data: { name, version } })
                                }
                            }
                        }
                    },
                }
            },
        },
    },
}
