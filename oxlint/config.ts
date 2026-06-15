import { createRequire } from 'node:module'

import { defineConfig as defineOxlintConfig, type OxlintConfig } from 'oxlint'

type Config = OxlintConfig & { ignorePatterns: string[] }

const require = createRequire(import.meta.url)
const resolve = (pkg: string): string => require.resolve(pkg).replace(/\/[^/]+$/, '')
const resolveFile = (path: string): string => new URL(path, import.meta.url).pathname

const baseConfig: OxlintConfig = {
    plugins: ['unicorn', 'typescript', 'import', 'promise', 'node', 'vitest', 'oxc'],

    jsPlugins: [
        resolve('eslint-plugin-security'),
        resolve('eslint-plugin-regexp'),
        { name: '@stylistic/js', specifier: resolve('@stylistic/eslint-plugin') },
        resolve('@diia-inhouse/eslint-plugin'),
        { name: '@diia-inhouse/package', specifier: resolveFile('./plugins/packageCheck.mjs') },
        { name: '@diia-inhouse/locale', specifier: resolveFile('./plugins/noHardcodedCyrillic.mjs') },
        { name: '@diia-inhouse/test', specifier: resolveFile('./plugins/testConventions.mjs') },
        { name: '@diia-inhouse/mongoose', specifier: resolveFile('./plugins/mongooseSchema.mjs') },
        { name: '@diia-inhouse/class', specifier: resolveFile('./plugins/classEncapsulation.mjs') },
        { name: '@diia-inhouse/temporal', specifier: resolveFile('./plugins/temporalConventions.mjs') },
        { name: '@diia-inhouse/code', specifier: resolveFile('./plugins/codeConventions.mjs') },
    ],

    categories: {
        correctness: 'error',
        suspicious: 'warn',
    },

    env: { es6: true, node: true },

    options: { typeAware: true, reportUnusedDisableDirectives: 'error' },

    ignorePatterns: ['*.js', '*.mjs', 'dist', 'node_modules', 'coverage', 'src/generated/**', 'oxlint.config.ts', 'oxfmt.config.ts'],

    rules: {
        'eslint/no-duplicate-imports': 'error',
        'eslint/no-redeclare': 'error',
        'eslint/no-implicit-coercion': 'error',
        'eslint/no-cond-assign': ['error', 'always'],
        'eslint/no-console': 'error',
        'eslint/no-underscore-dangle': ['warn', { allow: ['_id'] }],

        // Projects use vitest; disable duplicate jest plugin diagnostics
        'jest/valid-title': 'off',
        'jest/no-conditional-expect': 'off',
        'jest/no-disabled-tests': 'off',

        // Projects use Class.prototype.method.name as describe titles by convention
        'vitest/valid-title': 'off',
        'vitest/no-conditional-expect': 'off',
        'vitest/no-disabled-tests': 'off',
        'eslint/curly': ['error', 'all'],
        'eslint/eqeqeq': ['error', 'always'],
        'eslint/prefer-template': 'error',
        'eslint/no-restricted-imports': [
            'error',
            {
                paths: [
                    {
                        name: '@diia-inhouse/utils',
                        allowTypeImports: true,
                        message: 'Direct import of @diia-inhouse/utils is forbidden. Inject via DI and access through this.utils.*',
                    },
                    {
                        name: 'moleculer',
                        message: 'Moleculer is legacy. Use gRPC clients and proto definitions for inter-service communication.',
                    },
                ],
            },
        ],
        'eslint/class-methods-use-this': 'off',
        'eslint/sort-imports': 'off',
        'eslint/no-invalid-regexp': 'off',
        'eslint/no-useless-backreference': 'off',
        'eslint/no-empty-character-class': 'off',

        'import/prefer-default-export': 'off',
        'import/named': 'off',
        'import/no-unassigned-import': ['warn', { allow: ['**/*.css', 'reflect-metadata', 'module-alias/register'] }],

        'typescript/consistent-type-assertions': ['error', { assertionStyle: 'as' }],
        'typescript/no-unsafe-type-assertion': 'off',
        'typescript/no-unused-vars': ['error', { ignoreRestSiblings: true, argsIgnorePattern: '^_' }],
        'typescript/explicit-function-return-type': 'error',
        'typescript/return-await': ['error', 'always'],
        'typescript/array-type': 'error',
        'typescript/no-inferrable-types': 'error',
        'typescript/no-floating-promises': 'error',
        'typescript/no-explicit-any': 'error',
        'typescript/consistent-return': 'off',
        'typescript/prefer-optional-chain': 'off',
        'typescript/no-require-imports': 'off',
        'typescript/no-empty-object-type': 'off',
        'typescript/no-useless-default-assignment': 'off',
        'typescript/no-unnecessary-type-parameters': 'off',

        'unicorn/custom-error-definition': 'error',
        'unicorn/no-nested-ternary': 'error',
        'unicorn/filename-case': ['error', { case: 'camelCase', ignore: ['^\\d+.*\\.ts$'] }],
        'unicorn/numeric-separators-style': 'off',
        'unicorn/catch-error-name': ['error', { name: 'err' }],
        'unicorn/no-null': 'off',
        'unicorn/no-anonymous-default-export': 'off',
        'unicorn/prefer-module': 'off',
        'unicorn/prefer-top-level-await': 'off',
        'unicorn/no-array-method-this-argument': 'off',
        'unicorn/no-array-callback-reference': 'off',
        'unicorn/prefer-spread': 'off',
        'unicorn/require-post-message-target-origin': 'off',
        'unicorn/no-array-sort': 'off',
        'unicorn/no-array-reduce': 'error',

        'promise/always-return': 'error',
        'promise/no-return-wrap': 'error',
        'promise/param-names': 'error',
        'promise/catch-or-return': 'error',
        'promise/no-nesting': 'warn',
        'promise/no-promise-in-callback': 'warn',
        'promise/no-callback-in-promise': 'warn',
        'promise/no-new-statics': 'error',
        'promise/no-return-in-finally': 'warn',
        'promise/valid-params': 'warn',

        'regexp/confusing-quantifier': 'warn',
        'regexp/control-character-escape': 'error',
        'regexp/match-any': 'error',
        'regexp/negation': 'error',
        'regexp/no-contradiction-with-assertion': 'error',
        'regexp/no-dupe-characters-character-class': 'error',
        'regexp/no-dupe-disjunctions': 'error',
        'regexp/no-empty-alternative': 'warn',
        'regexp/no-empty-capturing-group': 'error',
        'regexp/no-empty-character-class': 'error',
        'regexp/no-empty-group': 'error',
        'regexp/no-empty-lookarounds-assertion': 'error',
        'regexp/no-empty-string-literal': 'error',
        'regexp/no-escape-backspace': 'error',
        'regexp/no-extra-lookaround-assertions': 'error',
        'regexp/no-invalid-regexp': 'error',
        'regexp/no-invisible-character': 'error',
        'regexp/no-lazy-ends': 'warn',
        'regexp/no-legacy-features': 'error',
        'regexp/no-misleading-capturing-group': 'error',
        'regexp/no-misleading-unicode-character': 'error',
        'regexp/no-missing-g-flag': 'error',
        'regexp/no-non-standard-flag': 'error',
        'regexp/no-obscure-range': 'off',
        'regexp/no-optional-assertion': 'error',
        'regexp/no-potentially-useless-backreference': 'warn',
        'regexp/no-super-linear-backtracking': 'error',
        'regexp/no-trivially-nested-assertion': 'error',
        'regexp/no-trivially-nested-quantifier': 'error',
        'regexp/no-unused-capturing-group': 'error',
        'regexp/no-useless-assertions': 'error',
        'regexp/no-useless-backreference': 'error',
        'regexp/no-useless-character-class': 'error',
        'regexp/no-useless-dollar-replacements': 'error',
        'regexp/no-useless-escape': 'error',
        'regexp/no-useless-flag': 'warn',
        'regexp/no-useless-lazy': 'error',
        'regexp/no-useless-non-capturing-group': 'error',
        'regexp/no-useless-quantifier': 'error',
        'regexp/no-useless-range': 'error',
        'regexp/no-useless-set-operand': 'error',
        'regexp/no-useless-string-literal': 'error',
        'regexp/no-useless-two-nums-quantifier': 'error',
        'regexp/no-zero-quantifier': 'error',
        'regexp/optimal-lookaround-quantifier': 'warn',
        'regexp/optimal-quantifier-concatenation': 'error',
        'regexp/prefer-character-class': 'error',
        'regexp/prefer-d': 'error',
        'regexp/prefer-plus-quantifier': 'error',
        'regexp/prefer-predefined-assertion': 'error',
        'regexp/prefer-question-quantifier': 'error',
        'regexp/prefer-range': 'error',
        'regexp/prefer-set-operation': 'error',
        'regexp/prefer-star-quantifier': 'error',
        'regexp/prefer-unicode-codepoint-escapes': 'error',
        'regexp/prefer-w': 'error',
        'regexp/simplify-set-operations': 'error',
        // regexp/sort-flags: not supported by oxlint's JS plugin bridge (uses token APIs)
        'regexp/strict': 'error',
        'regexp/use-ignore-case': 'error',

        '@stylistic/js/comma-dangle': 'off',
        '@stylistic/js/space-before-blocks': 'error',
        '@stylistic/js/space-infix-ops': 'error',
        '@stylistic/js/eol-last': ['error', 'always'],
        '@stylistic/js/padding-line-between-statements': [
            'error',
            { blankLine: 'always', prev: '*', next: 'return' },
            { blankLine: 'always', prev: ['const', 'let'], next: '*' },
            { blankLine: 'any', prev: ['const', 'let'], next: 'block-like' },
            { blankLine: 'any', prev: ['const', 'let'], next: ['const', 'let'] },
            { blankLine: 'always', prev: 'block-like', next: '*' },
            { blankLine: 'never', prev: 'case', next: '*' },
            { blankLine: 'always', prev: '*', next: 'export' },
        ],

        'security/detect-object-injection': 'off',
        'security/detect-non-literal-fs-filename': 'error',
        'security/detect-non-literal-regexp': 'error',

        '@diia-inhouse/logger-err-field': 'error',
        '@diia-inhouse/package/no-service-in-package-name': 'error',
        '@diia-inhouse/package/pinned-dependencies': 'error',
        '@diia-inhouse/locale/no-hardcoded-cyrillic': 'error',
        '@diia-inhouse/code/no-promise-settimeout': 'error',
        '@diia-inhouse/code/no-inline-object-return-type': 'error',
        '@diia-inhouse/code/prefer-as-const-object': 'error',
        '@diia-inhouse/code/const-enum-naming': 'error',
        '@diia-inhouse/code/const-enum-type-name': 'error',

        '@diia-inhouse/mongoose/status-requires-history': 'error',
        // Context-specific rules — off by default, enable per service in oxlint.config.ts
        '@diia-inhouse/mongoose/schema-timestamps': 'off',
        '@diia-inhouse/mongoose/sub-schema-id-false': 'off',
        '@diia-inhouse/class/no-module-level-const': 'warn',
        '@diia-inhouse/class/no-interface-in-implementation': 'warn',
        '@diia-inhouse/temporal/workflow-single-param': 'error',
        '@diia-inhouse/temporal/async-activity': 'error',
        '@diia-inhouse/temporal/no-node-imports': 'error',
        '@diia-inhouse/temporal/no-path-alias-imports': 'error',
    },

    overrides: [
        {
            files: ['**/bin/**'],
            rules: {
                'security/detect-non-literal-fs-filename': 'off',
                'eslint/no-console': 'off',
                '@stylistic/js/padding-line-between-statements': 'off',
            },
        },
        {
            files: ['**/*.d.ts'],
            rules: {
                'import/no-unassigned-import': 'off',
            },
        },
        {
            files: ['**/deps/**', '**/deps.ts', 'src/index.ts', 'src/workerEntry.ts'],
            rules: {
                'eslint/no-restricted-imports': 'off',
            },
        },
        {
            files: ['tests/**'],
            plugins: ['vitest'],
            rules: {
                'eslint/no-restricted-imports': 'off',
                'vitest/no-conditional-in-test': 'error',
                'vitest/no-duplicate-hooks': 'error',
                'vitest/prefer-hooks-in-order': 'error',
                'vitest/prefer-hooks-on-top': 'error',
                'vitest/require-to-throw-message': 'error',
                'vitest/require-top-level-describe': 'error',
                'typescript/unbound-method': 'off',
                '@diia-inhouse/test/no-persistent-mock': 'off',
                '@diia-inhouse/test/no-vi-mock-in-workflows': 'error',
                '@diia-inhouse/class/no-interface-in-implementation': 'off',
            },
        },
    ],
}

const boundariesExtension: Partial<OxlintConfig> = {
    jsPlugins: [{ name: 'boundaries', specifier: resolve('@boundaries/eslint-plugin') }],

    settings: {
        'import/resolver': { oxc: {} },
        'boundaries/elements': [
            { type: 'actionsTypes', pattern: 'src/actions/**/*.types.ts', mode: 'file', capture: ['version', 'actionName'] },
            { type: 'actions', pattern: 'src/actions/**/*.ts', mode: 'file', capture: ['version', 'actionName'] },
            { type: 'viewsTypes', pattern: 'src/views/*types.ts', mode: 'file' },
            { type: 'views', pattern: 'src/views/**' },
            { type: 'schemas', pattern: 'src/**/*.schema.ts', mode: 'file' },
            { type: 'providersTypes', pattern: 'src/providers/**/*types.ts', mode: 'file', capture: ['providerName'] },
            { type: 'providers', pattern: 'src/providers/**', capture: ['providerName'] },
            { type: 'repositories', pattern: 'src/repositories/**' },
            { type: 'modelsTypes', pattern: 'src/models/*.types.ts', mode: 'file', capture: ['modelName'] },
            { type: 'models', pattern: 'src/models/*.ts', mode: 'file', capture: ['modelName'] },
            { type: 'servicesTypes', pattern: 'src/services/**/*types.ts', mode: 'file' },
            { type: 'services', pattern: 'src/services/**' },
            { type: 'configsTypes', pattern: 'src/configs/*types.ts', mode: 'file' },
            { type: 'configs', pattern: 'src/configs/**' },
            { type: 'locales', pattern: 'src/locales/**' },
            { type: 'eventListenersTypes', pattern: 'src/eventListeners/*.types.ts', mode: 'file', capture: ['eventName'] },
            { type: 'eventListeners', pattern: 'src/eventListeners/*.ts', mode: 'file', capture: ['eventName'] },
            { type: 'externalEventListenersTypes', pattern: 'src/externalEventListeners/*.types.ts', mode: 'file', capture: ['eventName'] },
            { type: 'externalEventListeners', pattern: 'src/externalEventListeners/*.ts', mode: 'file', capture: ['eventName'] },
            { type: 'workerWorkflowsTypes', pattern: 'src/worker/workflows/**/*.types.ts', mode: 'file' },
            { type: 'workerWorkflows', pattern: 'src/worker/workflows/**' },
            { type: 'workerActivities', pattern: 'src/worker/activities/**' },
            { type: 'workerSchedules', pattern: 'src/worker/schedules/**' },
            { type: 'worker', pattern: 'src/worker/**' },
            { type: 'depsTypes', pattern: 'src/deps/*types.ts', mode: 'file' },
            { type: 'deps', pattern: 'src/deps/**', mode: 'file' },
            { type: 'srcRoot', pattern: 'src/*', mode: 'file' },
            { type: 'tests', pattern: 'tests/**' },
            { type: 'migrations', pattern: 'migrations/**' },
            { type: 'configFiles', pattern: '*.{json,md,mjs,mts,ts}', mode: 'full' },
            { type: 'generated', pattern: 'src/generated/**' },
        ],
    },

    rules: {
        'boundaries/no-unknown': 'error',
        'boundaries/no-unknown-files': 'error',
        'boundaries/entry-point': 'error',
        'boundaries/dependencies': [
            'error',
            {
                default: 'disallow',
                rules: [
                    {
                        from: { type: 'actions' },
                        allow: {
                            to: [
                                { type: 'services' },
                                { type: 'servicesTypes' },
                                { type: 'views' },
                                { type: 'generated' },
                                { type: 'schemas' },
                                { type: 'modelsTypes' },
                                { type: 'actionsTypes', captured: { actionName: '{{ from.captured.actionName }}' } },
                            ],
                        },
                    },
                    { from: { type: 'actionsTypes' }, allow: { to: [{ type: 'generated' }] } },
                    {
                        from: { type: 'services' },
                        allow: {
                            to: [
                                { type: 'services' },
                                { type: 'servicesTypes' },
                                { type: 'providers' },
                                { type: 'providersTypes' },
                                { type: 'repositories' },
                                { type: 'modelsTypes' },
                                { type: 'configsTypes' },
                                { type: 'workerWorkflows' },
                                { type: 'workerWorkflowsTypes' },
                            ],
                        },
                    },
                    {
                        from: { type: 'providers' },
                        allow: {
                            to: [
                                { type: 'configsTypes' },
                                { type: 'schemas' },
                                { type: 'providersTypes', captured: { providerName: '{{ from.captured.providerName }}' } },
                            ],
                        },
                    },
                    { from: { type: 'providersTypes' }, allow: { to: [{ type: 'modelsTypes' }] } },
                    { from: { type: 'schemas' }, allow: [] },
                    {
                        from: { type: 'views' },
                        allow: { to: [{ type: 'viewsTypes' }, { type: 'servicesTypes' }, { type: 'modelsTypes' }, { type: 'generated' }] },
                    },
                    { from: { type: 'viewsTypes' }, allow: { to: [{ type: 'locales' }] } },
                    {
                        from: { type: 'repositories' },
                        allow: { to: [{ type: 'models' }, { type: 'configsTypes' }, { type: 'modelsTypes' }] },
                    },
                    {
                        from: { type: 'models' },
                        allow: { to: [{ type: 'modelsTypes', captured: { modelName: '{{ from.captured.modelName }}' } }] },
                    },
                    { from: { type: 'tests' }, allow: { to: [{ type: '*' }] } },
                    { from: { type: 'servicesTypes' }, allow: { to: [{ type: 'servicesTypes' }, { type: 'modelsTypes' }] } },
                    {
                        from: { type: 'srcRoot' },
                        allow: {
                            to: [
                                { type: 'srcRoot' },
                                { type: 'depsTypes' },
                                { type: 'configsTypes' },
                                { type: 'deps' },
                                { type: 'configs' },
                                { type: 'worker' },
                                { type: 'workerActivities' },
                                { type: 'workerWorkflows' },
                            ],
                        },
                    },
                    {
                        from: { type: 'deps' },
                        allow: {
                            to: [
                                { type: 'depsTypes' },
                                { type: 'configsTypes' },
                                { type: 'models' },
                                { type: 'viewsTypes' },
                                { type: 'providers' },
                                { type: 'services' },
                            ],
                        },
                    },
                    {
                        from: { type: 'depsTypes' },
                        allow: { to: [{ type: 'configsTypes' }, { type: 'viewsTypes' }, { type: 'providers' }] },
                    },
                    { from: { type: 'configs' }, allow: { to: [{ type: 'configsTypes' }] } },
                    { from: { type: 'configsTypes' }, allow: { to: [{ type: 'configs' }] } },
                    { from: { type: 'eventListenersTypes' }, allow: { to: [{ type: 'modelsTypes' }] } },
                    {
                        from: { type: 'eventListeners' },
                        allow: {
                            to: [
                                { type: 'services' },
                                { type: 'servicesTypes' },
                                { type: 'configsTypes' },
                                { type: 'schemas' },
                                { type: 'eventListenersTypes', captured: { eventName: '{{ from.captured.eventName }}' } },
                            ],
                        },
                    },
                    { from: { type: 'externalEventListenersTypes' }, allow: [] },
                    {
                        from: { type: 'externalEventListeners' },
                        allow: {
                            to: [
                                { type: 'services' },
                                { type: 'configsTypes' },
                                { type: 'schemas' },
                                { type: 'externalEventListenersTypes', captured: { eventName: '{{ from.captured.eventName }}' } },
                            ],
                        },
                    },
                    {
                        from: { type: 'worker' },
                        allow: { to: [{ type: 'configsTypes' }, { type: 'depsTypes' }, { type: 'workerActivities' }] },
                    },
                    {
                        from: { type: 'workerActivities' },
                        allow: {
                            to: [
                                { type: 'services' },
                                { type: 'servicesTypes' },
                                { type: 'repositories' },
                                { type: 'modelsTypes' },
                                { type: 'configsTypes' },
                            ],
                        },
                    },
                    { from: { type: 'workerWorkflowsTypes' }, allow: [] },
                    {
                        from: { type: 'workerWorkflows' },
                        allow: {
                            to: [
                                { type: 'services' },
                                { type: 'configsTypes' },
                                { type: 'workerActivities' },
                                { type: 'workerWorkflowsTypes' },
                            ],
                        },
                    },
                    { from: { type: 'workerSchedules' }, allow: { to: [{ type: 'configsTypes' }, { type: 'workerWorkflows' }] } },
                    { from: { type: 'migrations' }, allow: { to: [{ type: '*' }] } },
                ],
            },
        ],
    },
}

export const base: Config = defineOxlintConfig(baseConfig) as Config

export const boundaries: Config = defineOxlintConfig({
    ...baseConfig,
    jsPlugins: [...(baseConfig.jsPlugins ?? []), ...(boundariesExtension.jsPlugins ?? [])],
    settings: { ...boundariesExtension.settings },
    rules: { ...baseConfig.rules, ...boundariesExtension.rules },
}) as Config

const sharedOverrides = baseConfig.overrides ?? []

/**
 * `defineConfig` used by every service's `oxlint.config.ts`.
 *
 * A service that sets its own `overrides` array does `{ ...boundaries, overrides: [...] }`.
 * The shallow spread copies `boundaries.overrides`, but the explicit `overrides` key then
 * *replaces* it — silently dropping the shared exemptions. To make consumption safe, we
 * always prepend the shared overrides.
 *
 * Dedupe is by object identity, not by `files`: we only strip the shared overrides a service
 * re-introduced by spreading `...boundaries.overrides` (oxlint's `defineConfig` is identity, so
 * those are the same object references). Everything a service actually authored is kept and
 * appended *after* the shared overrides — and since a later matching override wins in oxlint, a
 * service can still redefine rules for the same `files` glob (e.g. re-enable a shared exemption).
 */
export const defineConfig = (config: OxlintConfig): OxlintConfig => {
    const serviceOverrides = (config.overrides ?? []).filter((override) => !sharedOverrides.includes(override))

    return defineOxlintConfig({
        ...config,
        overrides: [...sharedOverrides, ...serviceOverrides],
    })
}
