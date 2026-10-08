import { createRequire } from 'node:module'

import { type OxlintConfig, defineConfig as defineOxlintConfig } from 'oxlint'

type Config = OxlintConfig & { ignorePatterns: string[] }

const require = createRequire(import.meta.url)
const resolve = (pkg: string): string => require.resolve(pkg).replace(/\/[^/]+$/, '')
const resolveFile = (path: string): string => new URL(path, import.meta.url).pathname

const baseConfig: Config = {
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
        { name: '@diia-inhouse/class-conventions', specifier: resolveFile('./plugins/classConventions.mjs') },
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
        'eslint/default-case': 'error',

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
        'import/namespace': 'off',
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
        'unicorn/no-array-reduce': ['error', { allowSimpleOperations: false }],

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
        '@diia-inhouse/package/unique-dependencies': 'error',
        '@diia-inhouse/package/no-dev-tooling-in-dependencies': 'error',
        '@diia-inhouse/package/private-package': 'error',
        '@diia-inhouse/package/no-publish-fields': 'error',
        '@diia-inhouse/package/no-empty-fields': 'error',
        '@diia-inhouse/package/engines-node': 'error',
        '@diia-inhouse/package/author': 'error',
        '@diia-inhouse/package/description': 'error',
        '@diia-inhouse/package/no-legacy-tooling': 'error',
        '@diia-inhouse/package/no-legacy-config-fields': 'error',
        '@diia-inhouse/package/no-legacy-scripts': 'error',
        '@diia-inhouse/package/dev-script': 'error',
        '@diia-inhouse/package/shared-configs': 'error',
        '@diia-inhouse/package/stale-overrides': 'warn',
        '@diia-inhouse/package/peers-installed-locally': 'error',
        '@diia-inhouse/package/exports-package-json': 'error',
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
        '@diia-inhouse/class-conventions/member-ordering': 'error',
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
        'boundaries/files-single-match': true,
        'boundaries/files': [
            { pattern: 'src/actions/**/*.types.ts', category: 'actionsTypes', capture: ['version', 'actionName'] },
            { pattern: 'src/actions/**/*.ts', category: 'actions', capture: ['version', 'actionName'] },
            { pattern: 'src/views/*types.ts', category: 'viewsTypes' },
            { pattern: 'src/views/**', category: 'views' },
            { pattern: 'src/**/*.schema.ts', category: 'schemas' },
            { pattern: 'src/providers/**/*types.ts', category: 'providersTypes', capture: ['providerName'] },
            { pattern: 'src/providers/**/*', category: 'providers', capture: ['providerName'] },
            { pattern: 'src/repositories/**', category: 'repositories' },
            { pattern: 'src/models/*.types.ts', category: 'modelsTypes', capture: ['modelName'] },
            { pattern: 'src/models/*.ts', category: 'models', capture: ['modelName'] },
            { pattern: 'src/services/**/*types.ts', category: 'servicesTypes' },
            { pattern: 'src/services/**', category: 'services' },
            { pattern: 'src/configs/*types.ts', category: 'configsTypes' },
            { pattern: 'src/configs/**', category: 'configs' },
            { pattern: 'src/locales/*/pdf/**', category: 'localesPdf', capture: ['locale'] },
            { pattern: 'src/locales/**', category: 'locales' },
            { pattern: 'src/eventListeners/*.types.ts', category: 'eventListenersTypes', capture: ['eventName'] },
            { pattern: 'src/eventListeners/*.ts', category: 'eventListeners', capture: ['eventName'] },
            { pattern: 'src/externalEventListeners/*.types.ts', category: 'externalEventListenersTypes', capture: ['eventName'] },
            { pattern: 'src/externalEventListeners/*.ts', category: 'externalEventListeners', capture: ['eventName'] },
            { pattern: 'src/worker/workflows/**/*.types.ts', category: 'workerWorkflowsTypes' },
            { pattern: 'src/worker/workflows/**', category: 'workerWorkflows' },
            { pattern: 'src/worker/activities/**', category: 'workerActivities' },
            { pattern: 'src/worker/schedules/**', category: 'workerSchedules' },
            { pattern: 'src/worker/**', category: 'worker' },
            { pattern: 'src/deps/*types.ts', category: 'depsTypes' },
            { pattern: 'src/deps/**', category: 'deps' },
            { pattern: 'src/*', category: 'srcRoot' },
            { pattern: 'tests/**', category: 'tests' },
            { pattern: 'migrations/**', category: 'migrations' },
            { pattern: '*.{json,md,mjs,mts,ts}', category: 'configFiles' },
            { pattern: 'src/generated/**', category: 'generated' },
        ],
    },

    rules: {
        'boundaries/no-unknown-dependencies': 'error',
        'boundaries/no-unknown-files': 'error',
        'boundaries/dependencies': [
            'error',
            {
                default: 'disallow',
                policies: [
                    {
                        from: { file: { categories: 'actions' } },
                        allow: {
                            to: [
                                { file: { categories: 'services' } },
                                { file: { categories: 'servicesTypes' } },
                                { file: { categories: 'views' } },
                                { file: { categories: 'generated' } },
                                { file: { categories: 'schemas' } },
                                { file: { categories: 'modelsTypes' } },
                                { file: { categories: 'actionsTypes', captured: { actionName: '{{ from.file.captured.actionName }}' } } },
                            ],
                        },
                    },
                    { from: { file: { categories: 'actionsTypes' } }, allow: { to: [{ file: { categories: 'generated' } }] } },
                    {
                        from: { file: { categories: 'services' } },
                        allow: {
                            to: [
                                { file: { categories: 'services' } },
                                { file: { categories: 'servicesTypes' } },
                                { file: { categories: 'providers' } },
                                { file: { categories: 'providersTypes' } },
                                { file: { categories: 'repositories' } },
                                { file: { categories: 'modelsTypes' } },
                                { file: { categories: 'configsTypes' } },
                                { file: { categories: 'workerWorkflows' } },
                                { file: { categories: 'workerWorkflowsTypes' } },
                            ],
                        },
                    },
                    {
                        from: { file: { categories: 'providers' } },
                        allow: {
                            to: [
                                { file: { categories: 'providers' } },
                                { file: { categories: 'configsTypes' } },
                                { file: { categories: 'schemas' } },
                                {
                                    file: {
                                        categories: 'providersTypes',
                                        captured: { providerName: '{{ from.file.captured.providerName }}' },
                                    },
                                },
                            ],
                        },
                    },
                    { from: { file: { categories: 'providersTypes' } }, allow: { to: [{ file: { categories: 'modelsTypes' } }] } },
                    { from: { file: { categories: 'schemas' } }, allow: [] },
                    {
                        from: { file: { categories: 'views' } },
                        allow: {
                            to: [
                                { file: { categories: 'views' } },
                                { file: { categories: 'viewsTypes' } },
                                { file: { categories: 'servicesTypes' } },
                                { file: { categories: 'modelsTypes' } },
                                { file: { categories: 'generated' } },
                            ],
                        },
                    },
                    { from: { file: { categories: 'viewsTypes' } }, allow: { to: [{ file: { categories: 'locales' } }] } },
                    {
                        from: { file: { categories: 'repositories' } },
                        allow: {
                            to: [
                                { file: { categories: 'repositories' } },
                                { file: { categories: 'models' } },
                                { file: { categories: 'configsTypes' } },
                                { file: { categories: 'modelsTypes' } },
                            ],
                        },
                    },
                    {
                        from: { file: { categories: 'models' } },
                        allow: {
                            to: [{ file: { categories: 'modelsTypes', captured: { modelName: '{{ from.file.captured.modelName }}' } } }],
                        },
                    },
                    { from: { file: { categories: 'tests' } }, allow: { to: [{ file: { categories: '*' } }] } },
                    {
                        from: { file: { categories: 'servicesTypes' } },
                        allow: {
                            to: [
                                { file: { categories: 'servicesTypes' } },
                                { file: { categories: 'modelsTypes' } },
                                { file: { categories: 'localesPdf' } },
                            ],
                        },
                    },
                    {
                        from: { file: { categories: 'srcRoot' } },
                        allow: {
                            to: [
                                { file: { categories: 'srcRoot' } },
                                { file: { categories: 'depsTypes' } },
                                { file: { categories: 'configsTypes' } },
                                { file: { categories: 'deps' } },
                                { file: { categories: 'configs' } },
                                { file: { categories: 'worker' } },
                                { file: { categories: 'workerActivities' } },
                                { file: { categories: 'workerWorkflows' } },
                            ],
                        },
                    },
                    {
                        from: { file: { categories: 'deps' } },
                        allow: {
                            to: [
                                { file: { categories: 'deps' } },
                                { file: { categories: 'depsTypes' } },
                                { file: { categories: 'configsTypes' } },
                                { file: { categories: 'models' } },
                                { file: { categories: 'viewsTypes' } },
                                { file: { categories: 'providers' } },
                                { file: { categories: 'services' } },
                            ],
                        },
                    },
                    {
                        from: { file: { categories: 'depsTypes' } },
                        allow: {
                            to: [
                                { file: { categories: 'configsTypes' } },
                                { file: { categories: 'viewsTypes' } },
                                { file: { categories: 'providers' } },
                            ],
                        },
                    },
                    {
                        from: { file: { categories: 'configs' } },
                        allow: { to: [{ file: { categories: 'configs' } }, { file: { categories: 'configsTypes' } }] },
                    },
                    { from: { file: { categories: 'configsTypes' } }, allow: { to: [{ file: { categories: 'configs' } }] } },
                    { from: { file: { categories: 'locales' } }, allow: { to: [{ file: { categories: 'locales' } }] } },
                    {
                        from: { file: { categories: 'localesPdf' } },
                        allow: { to: [{ file: { categories: 'localesPdf', captured: { locale: '{{ from.file.captured.locale }}' } } }] },
                    },
                    { from: { file: { categories: 'eventListenersTypes' } }, allow: { to: [{ file: { categories: 'modelsTypes' } }] } },
                    {
                        from: { file: { categories: 'eventListeners' } },
                        allow: {
                            to: [
                                { file: { categories: 'services' } },
                                { file: { categories: 'servicesTypes' } },
                                { file: { categories: 'configsTypes' } },
                                { file: { categories: 'schemas' } },
                                {
                                    file: {
                                        categories: 'eventListenersTypes',
                                        captured: { eventName: '{{ from.file.captured.eventName }}' },
                                    },
                                },
                            ],
                        },
                    },
                    { from: { file: { categories: 'externalEventListenersTypes' } }, allow: [] },
                    {
                        from: { file: { categories: 'externalEventListeners' } },
                        allow: {
                            to: [
                                { file: { categories: 'services' } },
                                { file: { categories: 'configsTypes' } },
                                { file: { categories: 'schemas' } },
                                {
                                    file: {
                                        categories: 'externalEventListenersTypes',
                                        captured: { eventName: '{{ from.file.captured.eventName }}' },
                                    },
                                },
                            ],
                        },
                    },
                    {
                        from: { file: { categories: 'worker' } },
                        allow: {
                            to: [
                                { file: { categories: 'worker' } },
                                { file: { categories: 'configsTypes' } },
                                { file: { categories: 'depsTypes' } },
                                { file: { categories: 'workerActivities' } },
                            ],
                        },
                    },
                    {
                        from: { file: { categories: 'workerActivities' } },
                        allow: {
                            to: [
                                { file: { categories: 'workerActivities' } },
                                { file: { categories: 'services' } },
                                { file: { categories: 'servicesTypes' } },
                                { file: { categories: 'repositories' } },
                                { file: { categories: 'modelsTypes' } },
                                { file: { categories: 'configsTypes' } },
                            ],
                        },
                    },
                    { from: { file: { categories: 'workerWorkflowsTypes' } }, allow: [] },
                    {
                        from: { file: { categories: 'workerWorkflows' } },
                        allow: {
                            to: [
                                { file: { categories: 'workerWorkflows' } },
                                { file: { categories: 'services' } },
                                { file: { categories: 'configsTypes' } },
                                { file: { categories: 'workerActivities' } },
                                { file: { categories: 'workerWorkflowsTypes' } },
                            ],
                        },
                    },
                    {
                        from: { file: { categories: 'workerSchedules' } },
                        allow: {
                            to: [
                                { file: { categories: 'workerSchedules' } },
                                { file: { categories: 'configsTypes' } },
                                { file: { categories: 'workerWorkflows' } },
                            ],
                        },
                    },
                    { from: { file: { categories: 'migrations' } }, allow: { to: [{ file: { categories: '*' } }] } },
                ],
            },
        ],
    },
}

export const base: Config = defineOxlintConfig(baseConfig)

export const boundaries: Config = defineOxlintConfig({
    ...baseConfig,
    jsPlugins: [...(baseConfig.jsPlugins ?? []), ...(boundariesExtension.jsPlugins ?? [])],
    settings: { ...boundariesExtension.settings },
    rules: { ...baseConfig.rules, ...boundariesExtension.rules },
})

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
