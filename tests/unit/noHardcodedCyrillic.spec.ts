import { RuleTester } from '@typescript-eslint/rule-tester'

import plugin from '../../oxlint/plugins/noHardcodedCyrillic.mjs'

const rule = plugin.rules['no-hardcoded-cyrillic']
const ruleTester = new RuleTester()
const filename = '/src/services/auth.ts'

ruleTester.run('no-hardcoded-cyrillic', rule, {
    valid: [
        // ASCII-only string
        {
            filename,
            code: `const msg = 'Hello world'`,
        },

        // Cyrillic in locale file — excluded
        {
            filename: '/src/locales/uk.ts',
            code: `const msg = 'Привіт'`,
        },

        // Cyrillic in spec file — excluded
        {
            filename: '/src/services/auth.spec.ts',
            code: `const msg = 'Привіт'`,
        },

        // Cyrillic in test file — excluded
        {
            filename: '/src/services/auth.test.ts',
            code: `const msg = 'Привіт'`,
        },

        // Cyrillic in tests directory — excluded
        {
            filename: '/tests/unit/auth.ts',
            code: `const msg = 'Привіт'`,
        },

        // Number literal
        {
            filename,
            code: `const x = 42`,
        },

        // Template literal without Cyrillic
        {
            filename,
            code: 'const msg = `Hello ${name}`',
        },
    ],

    invalid: [
        // Cyrillic string literal
        {
            filename,
            code: `const msg = 'Привіт'`,
            errors: [{ messageId: 'forbidden' }],
        },

        // Cyrillic template literal
        {
            filename,
            code: 'const msg = `Привіт ${name}`',
            errors: [{ messageId: 'forbidden' }],
        },

        // Cyrillic in a mixed string
        {
            filename,
            code: `const msg = 'Error: помилка авторизації'`,
            errors: [{ messageId: 'forbidden' }],
        },
    ],
})
