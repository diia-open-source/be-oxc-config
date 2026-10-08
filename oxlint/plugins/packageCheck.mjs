import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'

const FIX_FLAGS = new Set(['--fix', '--fix-suggestions', '--fix-dangerously'])
const DEPENDENCY_FIELDS = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies']
const PUBLISH_FIELDS = ['license', 'files', 'publishConfig', 'repository']
const LEGACY_CONFIG_FIELDS = ['prettier', 'eslintConfig', 'eslintIgnore']
const LEGACY_PACKAGES = [
    'eslint',
    'typescript-eslint',
    'jsonc-eslint-parser',
    'eslint-config-prettier',
    'eslint-plugin-prettier',
    '@diia-inhouse/eslint-config',
    'prettier',
    'prettier-plugin-sort-imports',
    '@ianvs/prettier-plugin-sort-imports',
    'tsc-watch',
    'ts-node',
    'ts-node-dev',
    'nodemon',
]
const LEGACY_SCRIPT_NAMES = new Set(['eslint', 'prettier'])
const LEGACY_TOOL_PATTERN = /\b(eslint|prettier)\b/
const SERVICE_NAME_PATTERN = /^service-|-service$/
const VERSION_RANGE_PATTERN = /^[\^~]/
const EXACT_VERSION_PATTERN = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/
const INSTALLED_FIELDS = ['dependencies', 'devDependencies', 'optionalDependencies']
const EMPTY_FIELDS = [
    'keywords',
    'description',
    'author',
    'scripts',
    'dependencies',
    'devDependencies',
    'peerDependencies',
    'optionalDependencies',
    'overrides',
]
const DEV_TOOL_PATTERNS = [
    /^@types\//,
    /^vitest(-|$)/,
    /^@vitest\//,
    /^jest(-|$)/,
    /^@jest\//,
    /^oxlint(-|$)/,
    /^oxfmt$/,
    /^eslint(-|$)/,
    /^@eslint\//,
    /^prettier(-|$)/,
    /^typescript$/,
    /^madge$/,
    /^lockfile-lint$/,
    /^semantic-release(-|$)/,
    /^@semantic-release\//,
    /^rimraf$/,
    /^tsc-alias$/,
    /^tsc-watch$/,
    /^@diia-inhouse\/(test|oxc-config|configs|scaffold|eslint-config|eslint-plugin)$/,
]
const DEFAULT_NODE_MAJOR = 24
const DEFAULT_AUTHOR = 'diia-team'
const DEV_SCRIPT = 'diia-dev'
const COMMITLINT_CONFIG = '@diia-inhouse/configs/dist/commitlint'
const MADGE_TS_CONFIG = './tsconfig.json'

const isFixRun = () => process.argv.some((arg) => FIX_FLAGS.has(arg))

const manifests = new Map()
const manifestByDir = new Map()

function findManifest(file) {
    const seen = []
    let dir = dirname(resolve(file))
    let found = null

    for (;;) {
        const known = manifestByDir.get(dir)

        if (known !== undefined) {
            found = known
            break
        }

        seen.push(dir)

        const candidate = join(dir, 'package.json')
        const parent = dirname(dir)

        if (existsSync(candidate)) {
            found = candidate
            break
        }

        if (parent === dir) {
            break
        }

        dir = parent
    }

    for (const d of seen) {
        manifestByDir.set(d, found)
    }

    return found
}

function loadManifest(path) {
    let text

    try {
        text = readFileSync(path, 'utf8')
    } catch {
        return null
    }

    const cached = manifests.get(path)

    if (cached?.text === text) {
        return cached
    }

    try {
        const entry = { path, text, data: JSON.parse(text), reported: new Set() }

        manifests.set(path, entry)

        return entry
    } catch {
        return null
    }
}

function writeManifest(entry, data) {
    const indent = /^\{\r?\n([ \t]+)/.exec(entry.text)?.[1] ?? '    '
    const text = `${JSON.stringify(data, null, indent)}${entry.text.endsWith('\n') ? '\n' : ''}`

    writeFileSync(entry.path, text)
    entry.text = text
    entry.data = data
}

function loadLock(entry) {
    if (entry.lock === undefined) {
        try {
            entry.lock = JSON.parse(readFileSync(join(dirname(entry.path), 'package-lock.json'), 'utf8'))
        } catch {
            entry.lock = null
        }
    }

    return entry.lock
}

const installedVersion = (entry, name) => loadLock(entry)?.packages?.[`node_modules/${name}`]?.version

const parseVersion = (text) => {
    const match = /^(\d+)\.(\d+)\.(\d+)/.exec(text)

    return match ? match.slice(1, 4).map(Number) : null
}

const compareVersions = (a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2]

const lowestOf = (comparator) => {
    const bare = comparator.replace(/^[\^~]|^>=|^=/, '')

    if (comparator === '' || comparator === '*' || /^[<x]/i.test(comparator)) {
        return [0, 0, 0]
    }

    const match = /^(\d+)(?:\.(\d+|x|\*))?(?:\.(\d+|x|\*))?(?:[-+][0-9A-Za-z.+-]*)?$/.exec(bare)

    return match
        ? [match[1], match[2], match[3]].map((part) => (part === undefined || part === 'x' || part === '*' ? 0 : Number(part)))
        : null
}

const minVersion = (range) => {
    const alternatives = String(range)
        .split('||')
        .map((alternative) =>
            alternative
                .trim()
                .replace(/\s+-\s+.*$/, '')
                .split(/\s+/)
                .filter(Boolean),
        )
    const mins = alternatives.map((comparators) => {
        const lows = comparators.map(lowestOf)

        return lows.some((low) => low === null)
            ? null
            : lows.reduce((highest, low) => (compareVersions(low, highest) > 0 ? low : highest), [0, 0, 0])
    })

    return mins.some((min) => min === null) ? null : mins.reduce((lowest, min) => (compareVersions(min, lowest) < 0 ? min : lowest))
}

const formatVersion = (version) => version.join('.')

const allDependencies = (data) => Object.assign({}, ...DEPENDENCY_FIELDS.map((field) => data[field] ?? {}))
const dependsOn = (data, name) => name in allDependencies(data)
const isUnscoped = ({ name }) => typeof name === 'string' && !name.startsWith('@')
const isPrivate = (data) => data.private === true || isUnscoped(data)
const isDevTool = (name) => DEV_TOOL_PATTERNS.some((pattern) => pattern.test(name))
const isEmpty = (value) =>
    value === '' ||
    (Array.isArray(value) && value.length === 0) ||
    (typeof value === 'object' && value !== null && !Array.isArray(value) && Object.keys(value).length === 0)

export const manifestRules = {
    'no-service-in-package-name': {
        messages: {
            suffix: 'package.json "name" is "{{ name }}": the repository is called <name>-service, the package is called <name>. Not auto-fixed, because the name is the service identity at runtime.',
        },
        check: ({ name }) => (typeof name === 'string' && SERVICE_NAME_PATTERN.test(name) ? [{ messageId: 'suffix', data: { name } }] : []),
    },

    'pinned-dependencies': {
        messages: {
            unpinned: 'Dependency "{{ name }}" has unpinned version "{{ version }}". Pin to an exact version (remove ^ or ~).',
            inexact:
                'Dependency "{{ name }}" is "{{ version }}", not an exact version from the registry. Not auto-fixed: run `npm i {{ name }}@<version>`.',
        },
        check: (data) => {
            const violations = []

            for (const field of DEPENDENCY_FIELDS) {
                for (const [name, version] of Object.entries(data[field] ?? {})) {
                    if (typeof version !== 'string') {
                        continue
                    }

                    if (VERSION_RANGE_PATTERN.test(version)) {
                        violations.push({ messageId: 'unpinned', data: { name, version } })
                    } else if (INSTALLED_FIELDS.includes(field) && !EXACT_VERSION_PATTERN.test(version)) {
                        violations.push({ messageId: 'inexact', data: { name, version } })
                    }
                }
            }

            return violations
        },
        fix: (data, _options, entry) => {
            for (const field of DEPENDENCY_FIELDS) {
                for (const [name, version] of Object.entries(data[field] ?? {})) {
                    const installed = typeof version === 'string' && VERSION_RANGE_PATTERN.test(version) && installedVersion(entry, name)

                    if (installed) {
                        data[field][name] = installed
                    }
                }
            }

            return data
        },
    },

    'unique-dependencies': {
        messages: {
            duplicate:
                'Dependency "{{ name }}" is listed in both {{ first }} and {{ second }}. Not auto-fixed, because package-lock.json must change with it: run `npm uninstall -D {{ name }}` if it is needed at runtime, `npm uninstall {{ name }}` if not.',
        },
        check: (data) => {
            const violations = []
            const seen = new Map()

            for (const field of INSTALLED_FIELDS) {
                for (const name of Object.keys(data[field] ?? {})) {
                    if (seen.has(name)) {
                        violations.push({ messageId: 'duplicate', data: { name, first: seen.get(name), second: field } })
                    } else {
                        seen.set(name, field)
                    }
                }
            }

            return violations
        },
    },

    'no-dev-tooling-in-dependencies': {
        messages: {
            tool: 'Dependency "{{ name }}" is a development tool listed as a runtime dependency. Not auto-fixed, because package-lock.json must change with it: run `npm uninstall {{ name }} && npm i -D {{ name }}`.',
        },
        check: (data) =>
            isPrivate(data)
                ? Object.keys(data.dependencies ?? {})
                      .filter(isDevTool)
                      .map((name) => ({ messageId: 'tool', data: { name } }))
                : [],
    },

    'private-package': {
        messages: {
            missing: 'An unscoped package ("{{ name }}") can never be published to the registry; say so with "private": true.',
        },
        check: (data) => (isUnscoped(data) && data.private !== true ? [{ messageId: 'missing', data: { name: data.name } }] : []),
        fix: (data) => ({ ...data, private: true }),
    },

    'no-publish-fields': {
        messages: {
            field: 'package.json "{{ field }}" describes publishing, and this package is private. Remove it.',
        },
        check: (data) =>
            isPrivate(data)
                ? PUBLISH_FIELDS.filter((field) => field in data).map((field) => ({ messageId: 'field', data: { field } }))
                : [],
        fix: (data) => {
            for (const field of PUBLISH_FIELDS) {
                delete data[field]
            }

            return data
        },
    },

    'no-empty-fields': {
        messages: {
            empty: 'package.json "{{ field }}" is empty. Remove it.',
        },
        check: (data) =>
            EMPTY_FIELDS.filter((field) => field in data && isEmpty(data[field])).map((field) => ({ messageId: 'empty', data: { field } })),
        fix: (data) => {
            for (const field of EMPTY_FIELDS) {
                if (field in data && isEmpty(data[field])) {
                    delete data[field]
                }
            }

            return data
        },
    },

    'engines-node': {
        schema: [{ type: 'object', properties: { nodeMajor: { type: 'integer' } }, additionalProperties: false }],
        messages: {
            engines: 'package.json "engines.node" must be "{{ expected }}", the Node.js major CI builds on (found {{ found }}).',
        },
        check: (data, { nodeMajor = DEFAULT_NODE_MAJOR }) => {
            const expected = `>=${nodeMajor}`

            return data.engines?.node === expected
                ? []
                : [{ messageId: 'engines', data: { expected, found: data.engines?.node ?? 'nothing' } }]
        },
        fix: (data, { nodeMajor = DEFAULT_NODE_MAJOR }) => ({ ...data, engines: { ...data.engines, node: `>=${nodeMajor}` } }),
    },

    author: {
        schema: [{ type: 'object', properties: { author: { type: 'string' } }, additionalProperties: false }],
        messages: {
            author: 'package.json "author" must be "{{ expected }}" (found {{ found }}).',
        },
        check: (data, { author = DEFAULT_AUTHOR }) =>
            data.author === author ? [] : [{ messageId: 'author', data: { expected: author, found: data.author ?? 'nothing' } }],
        fix: (data, { author = DEFAULT_AUTHOR }) => ({ ...data, author }),
    },

    description: {
        messages: {
            missing: 'package.json "description" is empty. Say in one line what this package does.',
        },
        check: ({ description }) => (typeof description === 'string' && description.trim() !== '' ? [] : [{ messageId: 'missing' }]),
    },

    'no-legacy-tooling': {
        messages: {
            installed:
                'The oxc toolchain replaced {{ names }}. Not auto-fixed, because package-lock.json must change with it: run `npm uninstall {{ command }}`.',
        },
        check: (data) => {
            const installed = LEGACY_PACKAGES.filter((name) => dependsOn(data, name))

            return installed.length > 0
                ? [{ messageId: 'installed', data: { names: installed.join(', '), command: installed.join(' ') } }]
                : []
        },
    },

    'no-legacy-config-fields': {
        messages: {
            field: 'package.json "{{ field }}" configures a tool the oxc toolchain replaced. Remove it.',
        },
        check: (data) => LEGACY_CONFIG_FIELDS.filter((field) => field in data).map((field) => ({ messageId: 'field', data: { field } })),
        fix: (data) => {
            for (const field of LEGACY_CONFIG_FIELDS) {
                delete data[field]
            }

            return data
        },
    },

    'no-legacy-scripts': {
        messages: {
            script: 'Script "{{ name }}" runs {{ tool }}, which the oxc toolchain replaced.',
        },
        check: ({ scripts = {} }) => {
            const violations = []

            for (const [name, body] of Object.entries(scripts)) {
                const tool = LEGACY_SCRIPT_NAMES.has(name) ? name : LEGACY_TOOL_PATTERN.exec(String(body))?.[1]

                if (tool) {
                    violations.push({ messageId: 'script', data: { name, tool } })
                }
            }

            return violations
        },
        fix: (data) => {
            for (const [name, body] of Object.entries(data.scripts ?? {})) {
                if (LEGACY_SCRIPT_NAMES.has(name)) {
                    delete data.scripts[name]
                } else {
                    data.scripts[name] = String(body)
                        .replace(/\bprettier --write\b/g, 'oxfmt')
                        .replace(/\bprettier --check\b/g, 'oxfmt --check')
                }
            }

            return data
        },
    },

    'dev-script': {
        messages: {
            dev: 'Script "dev" must run "{{ expected }}" (found "{{ found }}"); it watches the entry file with the tsx bundled in @diia-inhouse/oxc-config.',
        },
        check: (data) => {
            const dev = data.scripts?.dev

            return dependsOn(data, '@diia-inhouse/diia-app') && typeof dev === 'string' && !/^diia-dev(\s|$)/.test(dev)
                ? [{ messageId: 'dev', data: { expected: DEV_SCRIPT, found: dev } }]
                : []
        },
        fix: (data) => ({ ...data, scripts: { ...data.scripts, dev: DEV_SCRIPT } }),
    },

    'peers-installed-locally': {
        messages: {
            missing:
                'Peer dependency "{{ name }}" is not installed for this package\'s own tests. Not auto-fixed, because package-lock.json must change with it: run `npm i -D {{ name }}`.',
        },
        check: (data) =>
            isPrivate(data)
                ? []
                : Object.keys(data.peerDependencies ?? {})
                      .filter((name) => data.peerDependenciesMeta?.[name]?.optional !== true)
                      .filter((name) => !(name in (data.devDependencies ?? {})) && !(name in (data.dependencies ?? {})))
                      .map((name) => ({ messageId: 'missing', data: { name } })),
    },

    'exports-package-json': {
        messages: {
            missing:
                'package.json "exports" does not expose "./package.json", so nothing can read this package\'s manifest through the package.',
        },
        check: (data) => {
            const { exports } = data

            if (
                isPrivate(data) ||
                exports === undefined ||
                (typeof exports === 'object' && exports !== null && './package.json' in exports)
            ) {
                return []
            }

            return [{ messageId: 'missing' }]
        },
        fix: (data) => {
            const { exports } = data
            const isSubpathMap =
                typeof exports === 'object' &&
                exports !== null &&
                !Array.isArray(exports) &&
                Object.keys(exports).every((key) => key.startsWith('.'))

            return isSubpathMap ? { ...data, exports: { ...exports, './package.json': './package.json' } } : data
        },
    },

    'stale-overrides': {
        messages: {
            dead: 'Override "{{ name }}" pins a package nothing in the dependency tree uses. Remove it: `npm pkg delete overrides.{{ name }} && npm install`.',
            redundant:
                'Override "{{ name }}" = {{ pin }} raises nothing: every dependent already asks for {{ pin }} or newer. Remove it: `npm pkg delete overrides.{{ name }} && npm install`.',
            holdingBack:
                'Override "{{ name }}" = {{ pin }} holds {{ dependents }} below the {{ wanted }} they ask for. Raise it: `npm pkg set overrides.{{ name }}={{ wanted }} && npm install`.',
        },
        check: (data, _options, entry) => {
            const packages = loadLock(entry)?.packages

            if (!packages) {
                return []
            }

            const violations = []

            for (const [name, pin] of Object.entries(data.overrides ?? {})) {
                if (typeof pin !== 'string' || !EXACT_VERSION_PATTERN.test(pin)) {
                    continue
                }

                const pinned = parseVersion(pin)
                const dependents = []

                for (const [location, manifest] of Object.entries(packages)) {
                    for (const field of DEPENDENCY_FIELDS) {
                        const range = manifest[field]?.[name]

                        if (range !== undefined) {
                            dependents.push({
                                from: location.replace(/^node_modules\//, '') || 'the package itself',
                                min: minVersion(range),
                            })
                        }
                    }
                }

                if (dependents.length === 0) {
                    violations.push({ messageId: 'dead', data: { name } })
                    continue
                }

                const known = dependents.filter((dependent) => dependent.min !== null)
                const above = known.filter((dependent) => compareVersions(dependent.min, pinned) > 0)

                if (above.length > 0) {
                    const wanted = above.reduce(
                        (highest, dependent) => (compareVersions(dependent.min, highest) > 0 ? dependent.min : highest),
                        pinned,
                    )

                    violations.push({
                        messageId: 'holdingBack',
                        data: { name, pin, wanted: formatVersion(wanted), dependents: above.map((dependent) => dependent.from).join(', ') },
                    })
                } else if (known.length === dependents.length && known.every((dependent) => compareVersions(dependent.min, pinned) >= 0)) {
                    violations.push({ messageId: 'redundant', data: { name, pin } })
                }
            }

            return violations
        },
    },

    'shared-configs': {
        messages: {
            commitlint: 'package.json "commitlint.extends" must be "{{ expected }}" so commit messages are checked by the shared rules.',
            madge: 'package.json "madge.tsConfig" must be "{{ expected }}" so find-circulars resolves the same paths as the build.',
        },
        check: (data) => {
            const violations = []

            if (dependsOn(data, '@diia-inhouse/configs') && data.commitlint?.extends !== COMMITLINT_CONFIG) {
                violations.push({ messageId: 'commitlint', data: { expected: COMMITLINT_CONFIG } })
            }

            if (dependsOn(data, 'madge') && data.madge?.tsConfig !== MADGE_TS_CONFIG) {
                violations.push({ messageId: 'madge', data: { expected: MADGE_TS_CONFIG } })
            }

            return violations
        },
        fix: (data) => {
            if (dependsOn(data, '@diia-inhouse/configs')) {
                data.commitlint = { ...data.commitlint, extends: COMMITLINT_CONFIG }
            }

            if (dependsOn(data, 'madge')) {
                data.madge = { ...data.madge, tsConfig: MADGE_TS_CONFIG }
            }

            return data
        },
    },
}

function defineRule(name, { messages, schema = [], check, fix }) {
    return {
        meta: { type: 'problem', messages, schema },
        create(context) {
            return {
                Program(node) {
                    const path = findManifest(context.filename)
                    const entry = path && loadManifest(path)

                    if (!entry || entry.reported.has(name)) {
                        return
                    }

                    entry.reported.add(name)

                    const options = context.options?.[0] ?? {}
                    let violations = check(entry.data, options, entry)

                    if (violations.length > 0 && fix && isFixRun()) {
                        writeManifest(entry, fix(structuredClone(entry.data), options, entry))
                        violations = check(entry.data, options, entry)
                    }

                    for (const { messageId, data } of violations) {
                        context.report({ node, messageId, data })
                    }
                },
            }
        },
    }
}

export default {
    meta: { name: '@diia-inhouse/oxlint-plugin-package' },
    rules: Object.fromEntries(Object.entries(manifestRules).map(([name, rule]) => [name, defineRule(name, rule)])),
}
