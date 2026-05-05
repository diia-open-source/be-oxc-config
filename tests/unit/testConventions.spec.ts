import { RuleTester } from '@typescript-eslint/rule-tester'

import plugin from '../../oxlint/plugins/testConventions.mjs'

const ruleTester = new RuleTester()

// --- no-persistent-mock ---

ruleTester.run('no-persistent-mock', plugin.rules['no-persistent-mock'], {
    valid: [
        // *Once variants are OK
        'mock.mockResolvedValueOnce(data)',
        'mock.mockReturnValueOnce(value)',
        'mock.mockRejectedValueOnce(error)',
        'mock.mockImplementationOnce(() => {})',

        // Other method calls — not flagged
        'mock.mockClear()',
        'mock.mockReset()',
        'mock.mockRestore()',
        'obj.someMethod()',
    ],

    invalid: [
        {
            code: 'mock.mockResolvedValue(data)',
            errors: [{ messageId: 'forbidden' }],
        },
        {
            code: 'mock.mockReturnValue(value)',
            errors: [{ messageId: 'forbidden' }],
        },
        {
            code: 'mock.mockRejectedValue(error)',
            errors: [{ messageId: 'forbidden' }],
        },
        {
            code: 'mock.mockImplementation(() => {})',
            errors: [{ messageId: 'forbidden' }],
        },
    ],
})

// --- no-vi-mock-in-workflows ---

ruleTester.run('no-vi-mock-in-workflows', plugin.rules['no-vi-mock-in-workflows'], {
    valid: [
        // vi.mock not in worker directory — rule is skipped
        {
            filename: '/tests/unit/services/auth.spec.ts',
            code: `vi.mock('../auth')`,
        },

        // vi.fn in worker directory — different method, not flagged
        {
            filename: '/tests/unit/worker/workflows/payment.spec.ts',
            code: `const fn = vi.fn()`,
        },

        // vi.spyOn in worker directory — different method, not flagged
        {
            filename: '/tests/unit/worker/activities/notify.spec.ts',
            code: `vi.spyOn(obj, 'method')`,
        },
    ],

    invalid: [
        // vi.mock in workflow test
        {
            filename: '/tests/unit/worker/workflows/payment.spec.ts',
            code: `vi.mock('../../../src/worker/workflows/payment')`,
            errors: [{ messageId: 'forbidden' }],
        },

        // vi.mock in activity test
        {
            filename: '/tests/unit/worker/activities/notify.spec.ts',
            code: `vi.mock('../../../src/activities/notify')`,
            errors: [{ messageId: 'forbidden' }],
        },
    ],
})
