/* oxlint-disable security/detect-non-literal-fs-filename */
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { RuleTester } from '@typescript-eslint/rule-tester'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import plugin, { manifestRules } from '../../oxlint/plugins/packageCheck.mjs'

type Manifest = Record<string, unknown>

interface Fixture {
    dir: string
    file: string
}

interface Report {
    messageId: string
}

const ruleTester = new RuleTester()

const service: Manifest = {
    name: 'address',
    version: '1.0.0',
    private: true,
    description: 'Address lookup for the Diia app',
    author: 'diia-team',
    type: 'module',
    scripts: { build: 'tsc', dev: 'diia-dev', lint: 'oxlint && oxfmt --check .' },
    dependencies: { '@diia-inhouse/diia-app': '34.3.0' },
    devDependencies: { '@diia-inhouse/configs': '7.2.2', '@types/node': '24.13.2' },
    engines: { node: '>=24' },
    commitlint: { extends: '@diia-inhouse/configs/dist/commitlint' },
}

const library: Manifest = {
    name: '@diia-inhouse/db',
    version: '1.0.0',
    description: 'Mongo access',
    author: 'diia-team',
    license: 'MIT',
    files: ['dist'],
    scripts: { build: 'tsc', dev: 'tsc --watch' },
    devDependencies: { '@diia-inhouse/configs': '7.2.2' },
    engines: { node: '>=24' },
    commitlint: { extends: '@diia-inhouse/configs/dist/commitlint' },
}

const fixture = (manifest: Manifest, lock?: Manifest): Fixture => {
    const dir = mkdtempSync(join(tmpdir(), 'package-check-'))

    mkdirSync(join(dir, 'src', 'nested'), { recursive: true })
    writeFileSync(join(dir, 'package.json'), `${JSON.stringify(manifest, null, 4)}\n`)

    if (lock) {
        writeFileSync(join(dir, 'package-lock.json'), JSON.stringify(lock))
    }

    return { dir, file: join(dir, 'src', 'nested', 'index.ts') }
}

const file = (manifest: Manifest): string => fixture(manifest).file

const run = (rule: string, filename: string): string[] => {
    const reports: string[] = []
    const context = {
        filename,
        options: [],
        report: ({ messageId }: Report): void => {
            reports.push(messageId)
        },
    }

    plugin.rules[rule].create(context).Program({})

    return reports
}

ruleTester.run('no-service-in-package-name', plugin.rules['no-service-in-package-name'], {
    valid: [
        { code: 'export {}', filename: file(service) },
        { code: 'export {}', filename: file(library) },
    ],
    invalid: [
        { code: 'export {}', filename: file({ ...service, name: 'medical-service' }), errors: [{ messageId: 'suffix' }] },
        { code: 'export {}', filename: file({ ...service, name: 'service-catalog' }), errors: [{ messageId: 'suffix' }] },
    ],
})

ruleTester.run('pinned-dependencies', plugin.rules['pinned-dependencies'], {
    valid: [
        { code: 'export {}', filename: file(service) },
        { code: 'export {}', filename: file({ ...library, peerDependencies: { hono: '>=4' } }) },
    ],
    invalid: [
        {
            code: 'export {}',
            filename: file({ ...service, dependencies: { lodash: '^4.17.21', luxon: '~3.7.0' } }),
            errors: [{ messageId: 'unpinned' }, { messageId: 'unpinned' }],
        },
        {
            code: 'export {}',
            filename: file({
                ...service,
                dependencies: {
                    '@diia-inhouse/ehealth-client': 'https://gitlab.diia.org.ua/api/v4/projects/1131/packages/npm/ehealth-client-1.0.0.tgz',
                    hono: 'latest',
                },
            }),
            errors: [{ messageId: 'inexact' }, { messageId: 'inexact' }],
        },
    ],
})

ruleTester.run('unique-dependencies', plugin.rules['unique-dependencies'], {
    valid: [
        { code: 'export {}', filename: file(service) },
        { code: 'export {}', filename: file({ ...library, peerDependencies: { hono: '>=4' }, devDependencies: { hono: '4.13.7' } }) },
    ],
    invalid: [
        {
            code: 'export {}',
            filename: file({ ...service, dependencies: { lodash: '4.18.1' }, devDependencies: { lodash: '4.18.1' } }),
            errors: [{ messageId: 'duplicate' }],
        },
    ],
})

ruleTester.run('no-dev-tooling-in-dependencies', plugin.rules['no-dev-tooling-in-dependencies'], {
    valid: [
        { code: 'export {}', filename: file(service) },
        { code: 'export {}', filename: file({ ...library, dependencies: { '@types/jsonwebtoken': '9.0.10' } }) },
    ],
    invalid: [
        {
            code: 'export {}',
            filename: file({
                ...service,
                dependencies: { '@diia-inhouse/diia-app': '34.3.0', 'vitest-mock-extended': '5.1.1', '@types/lodash': '4.17.24' },
            }),
            errors: [{ messageId: 'tool' }, { messageId: 'tool' }],
        },
        {
            code: 'export {}',
            filename: file({ ...service, dependencies: { '@bufbuild/protobuf': '2.12.0', '@bufbuild/buf': '1.59.0' } }),
            errors: [{ messageId: 'tool' }],
        },
    ],
})

ruleTester.run('private-package', plugin.rules['private-package'], {
    valid: [
        { code: 'export {}', filename: file(service) },
        { code: 'export {}', filename: file(library) },
    ],
    invalid: [{ code: 'export {}', filename: file({ ...service, private: undefined }), errors: [{ messageId: 'missing' }] }],
})

ruleTester.run('no-publish-fields', plugin.rules['no-publish-fields'], {
    valid: [
        { code: 'export {}', filename: file(service) },
        { code: 'export {}', filename: file(library) },
    ],
    invalid: [
        {
            code: 'export {}',
            filename: file({ ...service, license: 'MIT', files: ['dist'] }),
            errors: [{ messageId: 'field' }, { messageId: 'field' }],
        },
        {
            code: 'export {}',
            filename: file({ ...service, private: undefined, repository: 'https://gitlab.diia.org.ua/diia-inhouse/address-service' }),
            errors: [{ messageId: 'field' }],
        },
    ],
})

ruleTester.run('no-empty-fields', plugin.rules['no-empty-fields'], {
    valid: [
        { code: 'export {}', filename: file(service) },
        { code: 'export {}', filename: file({ ...service, keywords: ['diia'], files: [] }) },
    ],
    invalid: [
        { code: 'export {}', filename: file({ ...service, keywords: [] }), errors: [{ messageId: 'empty' }] },
        {
            code: 'export {}',
            filename: file({ ...service, description: '', scripts: {} }),
            errors: [{ messageId: 'empty' }, { messageId: 'empty' }],
        },
    ],
})

ruleTester.run('engines-node', plugin.rules['engines-node'], {
    valid: [
        { code: 'export {}', filename: file(service) },
        {
            code: 'export {}',
            filename: file({ ...service, engines: { node: '>=22' } }),
            options: [{ nodeMajor: 22 }],
        },
    ],
    invalid: [
        { code: 'export {}', filename: file({ ...service, engines: { node: '>=22' } }), errors: [{ messageId: 'engines' }] },
        { code: 'export {}', filename: file({ ...service, engines: undefined }), errors: [{ messageId: 'engines' }] },
    ],
})

ruleTester.run('author', plugin.rules.author, {
    valid: [
        { code: 'export {}', filename: file(service) },
        { code: 'export {}', filename: file({ ...service, author: 'Diia' }), options: [{ author: 'Diia' }] },
    ],
    invalid: [
        { code: 'export {}', filename: file({ ...service, author: 'Diia' }), errors: [{ messageId: 'author' }] },
        { code: 'export {}', filename: file({ ...service, author: undefined }), errors: [{ messageId: 'author' }] },
    ],
})

ruleTester.run('description', plugin.rules.description, {
    valid: [{ code: 'export {}', filename: file(service) }],
    invalid: [
        { code: 'export {}', filename: file({ ...service, description: undefined }), errors: [{ messageId: 'missing' }] },
        { code: 'export {}', filename: file({ ...service, description: '  ' }), errors: [{ messageId: 'missing' }] },
    ],
})

ruleTester.run('no-legacy-tooling', plugin.rules['no-legacy-tooling'], {
    valid: [{ code: 'export {}', filename: file(service) }],
    invalid: [
        {
            code: 'export {}',
            filename: file({ ...service, devDependencies: { eslint: '9.0.0', 'tsc-watch': '7.2.0' } }),
            errors: [{ messageId: 'installed' }],
        },
        {
            code: 'export {}',
            filename: file({ ...service, devDependencies: { madge: '8.0.0' } }),
            errors: [{ messageId: 'installed' }],
        },
    ],
})

ruleTester.run('no-legacy-config-fields', plugin.rules['no-legacy-config-fields'], {
    valid: [{ code: 'export {}', filename: file(service) }],
    invalid: [
        {
            code: 'export {}',
            filename: file({ ...service, prettier: '@diia-inhouse/eslint-config/prettier' }),
            errors: [{ messageId: 'field' }],
        },
        {
            code: 'export {}',
            filename: file({ ...service, madge: { tsConfig: './tsconfig.json' } }),
            errors: [{ messageId: 'field' }],
        },
    ],
})

ruleTester.run('no-legacy-scripts', plugin.rules['no-legacy-scripts'], {
    valid: [
        { code: 'export {}', filename: file(service) },
        { code: 'export {}', filename: file({ ...service, scripts: { format: 'oxfmt .' } }) },
    ],
    invalid: [
        {
            code: 'export {}',
            filename: file({ ...service, scripts: { prettier: 'prettier --write .', 'lint-fix:locales': 'prettier --write src/locales' } }),
            errors: [{ messageId: 'script' }, { messageId: 'script' }],
        },
        {
            code: 'export {}',
            filename: file({
                ...service,
                scripts: { 'find-circulars': 'madge --circular --extensions ts ./', circulars: 'npx madge --circular ./' },
            }),
            errors: [{ messageId: 'script' }, { messageId: 'script' }],
        },
    ],
})

ruleTester.run('dev-script', plugin.rules['dev-script'], {
    valid: [
        { code: 'export {}', filename: file(service) },
        { code: 'export {}', filename: file({ ...service, scripts: { dev: 'diia-dev src/main.ts' } }) },
        { code: 'export {}', filename: file(library) },
    ],
    invalid: [
        {
            code: 'export {}',
            filename: file({ ...service, scripts: { dev: "tsc-watch --onSuccess 'node dist/index.js'" } }),
            errors: [{ messageId: 'dev' }],
        },
    ],
})

ruleTester.run('peers-installed-locally', plugin.rules['peers-installed-locally'], {
    valid: [
        { code: 'export {}', filename: file({ ...library, peerDependencies: { hono: '>=4' }, devDependencies: { hono: '4.13.7' } }) },
        { code: 'export {}', filename: file({ ...service, peerDependencies: { hono: '>=4' } }) },
        {
            code: 'export {}',
            filename: file({ ...library, peerDependencies: { hono: '>=4' }, peerDependenciesMeta: { hono: { optional: true } } }),
        },
    ],
    invalid: [
        {
            code: 'export {}',
            filename: file({ ...library, peerDependencies: { hono: '>=4', react: '>=19' }, devDependencies: { hono: '4.13.7' } }),
            errors: [{ messageId: 'missing' }],
        },
    ],
})

ruleTester.run('exports-package-json', plugin.rules['exports-package-json'], {
    valid: [
        { code: 'export {}', filename: file(library) },
        { code: 'export {}', filename: file({ ...library, exports: { '.': './dist/index.js', './package.json': './package.json' } }) },
        { code: 'export {}', filename: file({ ...service, exports: { '.': './dist/index.js' } }) },
    ],
    invalid: [
        { code: 'export {}', filename: file({ ...library, exports: { '.': './dist/index.js' } }), errors: [{ messageId: 'missing' }] },
        { code: 'export {}', filename: file({ ...library, exports: './dist/index.js' }), errors: [{ messageId: 'missing' }] },
    ],
})

const lockWith = (requests: Record<string, Record<string, string>>): Manifest => ({
    packages: Object.fromEntries(Object.entries(requests).map(([location, dependencies]) => [location, { dependencies }])),
})

const overriding = (pin: string): Manifest => ({ ...service, overrides: { protobufjs: pin } })

ruleTester.run('stale-overrides', plugin.rules['stale-overrides'], {
    valid: [
        {
            code: 'export {}',
            filename: fixture(overriding('7.6.5'), lockWith({ 'node_modules/@grpc/proto-loader': { protobufjs: '^7.2.5' } })).file,
        },
        {
            code: 'export {}',
            filename: fixture(overriding('7.6.5'), lockWith({ 'node_modules/moleculer': { protobufjs: '^6.0.0 || ^7.0.0' } })).file,
        },
        {
            code: 'export {}',
            filename: fixture(overriding('7.6.5'), lockWith({ 'node_modules/a': { protobufjs: 'git+https://x/y' } })).file,
        },
        {
            code: 'export {}',
            filename: fixture({ ...service, overrides: { madge: { typescript: '$typescript' }, npm: '^11' } }, lockWith({})).file,
        },
        { code: 'export {}', filename: file(overriding('7.6.5')) },
    ],
    invalid: [
        { code: 'export {}', filename: fixture(overriding('7.6.5'), lockWith({})).file, errors: [{ messageId: 'dead' }] },
        {
            code: 'export {}',
            filename: fixture(
                overriding('7.6.5'),
                lockWith({ 'node_modules/a': { protobufjs: '^7.6.5' }, 'node_modules/b': { protobufjs: '7.6.6' } }),
            ).file,
            errors: [{ messageId: 'holdingBack' }],
        },
        {
            code: 'export {}',
            filename: fixture(overriding('7.6.5'), lockWith({ 'node_modules/a': { protobufjs: '~7.6.5' }, '': { protobufjs: '>=7.6.5' } }))
                .file,
            errors: [{ messageId: 'redundant' }],
        },
    ],
})

ruleTester.run('shared-configs', plugin.rules['shared-configs'], {
    valid: [
        { code: 'export {}', filename: file(service) },
        { code: 'export {}', filename: file(library) },
    ],
    invalid: [
        {
            code: 'export {}',
            filename: file({ ...service, commitlint: undefined }),
            errors: [{ messageId: 'commitlint' }],
        },
    ],
})

const withDevDependencies = fixture({
    ...service,
    devDependencies: { ...(service.devDependencies as Manifest), vitest: '5.0.3', lodash: '4.18.1', '@diia-inhouse/test': '8.3.37' },
})
const inFixture = (path: string): string => join(withDevDependencies.dir, path)

ruleTester.run('no-dev-dependency-import', plugin.rules['no-dev-dependency-import'], {
    valid: [
        { code: "import { DiiaApp } from '@diia-inhouse/diia-app'", filename: withDevDependencies.file },
        { code: "import type { Mock } from 'vitest'", filename: withDevDependencies.file },
        { code: "import { type Mock } from 'vitest'", filename: withDevDependencies.file },
        { code: "export type { Mock } from 'vitest'", filename: withDevDependencies.file },
        { code: "import { readFile } from 'node:fs/promises'\nimport path from 'path'", filename: withDevDependencies.file },
        { code: "import { a } from './a'\nimport { b } from '#b'", filename: withDevDependencies.file },
        { code: "export const load = () => import('vitest')", filename: withDevDependencies.file },
        { code: "import { describe } from 'vitest'", filename: inFixture('src/nested/index.spec.ts') },
        { code: "import { describe } from 'vitest'", filename: inFixture('src/__mocks__/index.ts') },
        { code: "import { describe } from 'vitest'", filename: inFixture('tests/unit/index.spec.ts') },
        { code: "import { defineConfig } from 'vitest/config'", filename: inFixture('vitest.config.ts') },
        {
            code: "import { Hono } from 'hono'",
            filename: file({ ...library, peerDependencies: { hono: '>=4' }, devDependencies: { hono: '4.13.7' } }),
        },
        {
            code: "import { db } from '@diia-inhouse/db/postgres'",
            filename: file({ ...library, devDependencies: { '@diia-inhouse/db': '1.0.0' } }),
        },
    ],
    invalid: [
        { code: "import { describe } from 'vitest'", filename: withDevDependencies.file, errors: [{ messageId: 'devDependency' }] },
        { code: "import { type Mock, vi } from 'vitest'", filename: withDevDependencies.file, errors: [{ messageId: 'devDependency' }] },
        { code: "import 'lodash'", filename: withDevDependencies.file, errors: [{ messageId: 'devDependency' }] },
        {
            code: "import { mockClass } from '@diia-inhouse/test/mocks'",
            filename: withDevDependencies.file,
            errors: [{ messageId: 'devDependency' }],
        },
        { code: "export { describe } from 'vitest'", filename: withDevDependencies.file, errors: [{ messageId: 'devDependency' }] },
        { code: "export * from 'vitest'", filename: withDevDependencies.file, errors: [{ messageId: 'devDependency' }] },
        { code: "const lodash = require('lodash')", filename: withDevDependencies.file, errors: [{ messageId: 'devDependency' }] },
        { code: "import lodash = require('lodash')", filename: withDevDependencies.file, errors: [{ messageId: 'devDependency' }] },
    ],
})

const withInstalled = fixture(service)

for (const name of ['@diia-inhouse/diia-app', '@diia-inhouse/configs', 'mongoose', '@temporalio/workflow']) {
    mkdirSync(join(withInstalled.dir, 'node_modules', name), { recursive: true })
}

ruleTester.run('no-undeclared-import', plugin.rules['no-undeclared-import'], {
    valid: [
        { code: "import { DiiaApp } from '@diia-inhouse/diia-app/dist/app'", filename: withInstalled.file },
        { code: "import { tsconfig } from '@diia-inhouse/configs'", filename: withInstalled.file },
        {
            code: "import { AddressService } from '@services/address'\nimport { proto } from '@src/generated'",
            filename: withInstalled.file,
        },
        { code: "import type { Schema } from 'mongoose'", filename: withInstalled.file },
        { code: "import { type Schema } from 'mongoose'", filename: withInstalled.file },
        {
            code: "import { readFile } from 'node:fs/promises'\nimport { a } from './a'\nimport { b } from '#b'",
            filename: withInstalled.file,
        },
        { code: "import { address } from 'address'", filename: withInstalled.file },
        { code: "import { Schema } from 'mongoose'", filename: join(withInstalled.dir, 'tests/unit/index.spec.ts') },
    ],
    invalid: [
        { code: "import { Schema } from 'mongoose'", filename: withInstalled.file, errors: [{ messageId: 'undeclared' }] },
        { code: "export * from 'mongoose'", filename: withInstalled.file, errors: [{ messageId: 'undeclared' }] },
        { code: "const mongoose = require('mongoose')", filename: withInstalled.file, errors: [{ messageId: 'undeclared' }] },
        {
            code: "export const load = () => import('@temporalio/workflow/lib/sinks')",
            filename: withInstalled.file,
            errors: [{ messageId: 'undeclared' }],
        },
    ],
})

describe('manifest fixes', () => {
    it('marks an unscoped package private', () => {
        expect(manifestRules['private-package'].fix({ name: 'address' }, {})).toEqual({ name: 'address', private: true })
    })

    it('drops the publishing fields of a private package', () => {
        const fixed = manifestRules['no-publish-fields'].fix(
            { name: 'address', private: true, license: 'MIT', files: ['dist'], repository: 'x', publishConfig: {} },
            {},
        )

        expect(fixed).toEqual({ name: 'address', private: true })
    })

    it('drops empty fields but leaves an empty files array, which means something', () => {
        expect(manifestRules['no-empty-fields'].fix({ keywords: [], description: '', scripts: {}, files: [], name: 'a' }, {})).toEqual({
            files: [],
            name: 'a',
        })
    })

    it('adds the package.json export to a subpath map and leaves a conditions object alone', () => {
        expect(manifestRules['exports-package-json'].fix({ exports: { '.': './dist/index.js' } }, {})).toEqual({
            exports: { '.': './dist/index.js', './package.json': './package.json' },
        })
        expect(manifestRules['exports-package-json'].fix({ exports: { import: './dist/index.js' } }, {})).toEqual({
            exports: { import: './dist/index.js' },
        })
    })

    it('sets engines.node to the configured major and keeps the other engines', () => {
        expect(manifestRules['engines-node'].fix({ engines: { node: '>=20', npm: '>=10' } }, { nodeMajor: 22 })).toEqual({
            engines: { node: '>=22', npm: '>=10' },
        })
        expect(manifestRules['engines-node'].fix({}, {})).toEqual({ engines: { node: '>=24' } })
    })

    it('sets the author', () => {
        expect(manifestRules.author.fix({ author: 'Diia' }, {})).toEqual({ author: 'diia-team' })
    })

    it('drops the eslint-era config fields', () => {
        expect(manifestRules['no-legacy-config-fields'].fix({ prettier: 'x', eslintConfig: {}, madge: {}, name: 'a' }, {})).toEqual({
            name: 'a',
        })
    })

    it('drops prettier and find-circulars scripts, rewrites prettier calls to oxfmt and leaves what it cannot translate', () => {
        const fixed = manifestRules['no-legacy-scripts'].fix(
            {
                scripts: {
                    prettier: 'prettier --write .',
                    'find-circulars': 'madge --circular --extensions ts ./',
                    'lint-fix:locales': 'prettier --write src/locales',
                    'lint:locales': 'prettier --check src/locales',
                    lint: 'eslint . && oxfmt --check .',
                },
            },
            {},
        )

        expect(fixed).toEqual({
            scripts: {
                'lint-fix:locales': 'oxfmt src/locales',
                'lint:locales': 'oxfmt --check src/locales',
                lint: 'eslint . && oxfmt --check .',
            },
        })
    })

    it('points dev at diia-dev', () => {
        expect(manifestRules['dev-script'].fix({ scripts: { dev: 'tsc-watch', build: 'tsc' } }, {})).toEqual({
            scripts: { dev: 'diia-dev', build: 'tsc' },
        })
    })

    it('wires the shared commitlint config only for packages that use it', () => {
        const fixed = manifestRules['shared-configs'].fix({ devDependencies: { '@diia-inhouse/configs': '7.2.2' } }, {})

        expect(fixed.commitlint).toEqual({ extends: '@diia-inhouse/configs/dist/commitlint' })
        expect(manifestRules['shared-configs'].fix({ devDependencies: {} }, {})).toEqual({ devDependencies: {} })
    })

    it('pins a range to the version package-lock.json resolved, and leaves one the lockfile does not know', () => {
        const { dir } = fixture(
            { ...service, dependencies: { lodash: '^4.17.0', luxon: '~3.7.0' } },
            { packages: { 'node_modules/lodash': { version: '4.18.1' } } },
        )
        const entry = { path: join(dir, 'package.json') }

        expect(manifestRules['pinned-dependencies'].fix({ dependencies: { lodash: '^4.17.0', luxon: '~3.7.0' } }, {}, entry)).toEqual({
            dependencies: { lodash: '4.18.1', luxon: '~3.7.0' },
        })
    })
})

describe('reporting', () => {
    it('reports a manifest problem once per run, however many files sit under it', () => {
        const { dir, file: first } = fixture({ ...service, description: undefined })
        const second = join(dir, 'src', 'other.ts')

        expect(run('description', first)).toEqual(['missing'])
        expect(run('description', first)).toEqual([])
        expect(run('description', second)).toEqual([])
    })

    it('reports again after the manifest changes on disk', () => {
        const { dir, file: filename } = fixture({ ...service, description: undefined })

        expect(run('description', filename)).toEqual(['missing'])

        writeFileSync(join(dir, 'package.json'), `${JSON.stringify({ ...service, description: '' }, null, 4)}\n`)

        expect(run('description', filename)).toEqual(['missing'])
    })

    it('stays quiet when no manifest exists above the file and when it is not valid JSON', () => {
        const orphan = join(mkdtempSync(join(tmpdir(), 'package-check-orphan-')), 'index.ts')
        const { dir, file: filename } = fixture(service)

        writeFileSync(join(dir, 'package.json'), '{ not json')

        expect(run('author', orphan)).toEqual([])
        expect(run('author', filename)).toEqual([])
    })
})

describe('oxlint --fix', () => {
    const argv = process.argv

    beforeAll(() => {
        process.argv = [...argv, '--fix']
    })

    afterAll(() => {
        process.argv = argv
    })

    it('rewrites the manifest in place, keeps its indentation, and reports only what it could not fix', () => {
        const { dir, file: filename } = fixture({
            ...service,
            author: 'Diia',
            private: undefined,
            license: 'MIT',
            files: ['dist'],
            engines: { node: '>=22' },
        })

        expect(run('author', filename)).toEqual([])
        expect(run('private-package', filename)).toEqual([])
        expect(run('no-publish-fields', filename)).toEqual([])
        expect(run('engines-node', filename)).toEqual([])

        const text = readFileSync(join(dir, 'package.json'), 'utf8')
        const manifest = JSON.parse(text)

        expect(manifest.author).toBe('diia-team')
        expect(manifest.private).toBe(true)
        expect(manifest.license).toBeUndefined()
        expect(manifest.files).toBeUndefined()
        expect(manifest.engines).toEqual({ node: '>=24' })
        expect(text.startsWith('{\n    "name"')).toBe(true)
        expect(text.endsWith('}\n')).toBe(true)
    })
})
