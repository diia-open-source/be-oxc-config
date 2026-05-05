import { RuleTester } from '@typescript-eslint/rule-tester'

import plugin from '../../oxlint/plugins/temporalConventions.mjs'

const ruleTester = new RuleTester()
const workflowFile = '/src/worker/workflows/processPayment.ts'
const activityFile = '/src/worker/activities/sendNotification.ts'

// --- workflow-single-param ---

ruleTester.run('workflow-single-param', plugin.rules['workflow-single-param'], {
    valid: [
        // Single parameter
        {
            filename: workflowFile,
            code: `export function processPayment(params: PaymentParams) {}`,
        },

        // No parameters
        {
            filename: workflowFile,
            code: `export function healthCheck() {}`,
        },

        // Exported arrow function with single param
        {
            filename: workflowFile,
            code: `export const processPayment = (params: PaymentParams) => {}`,
        },

        // Not in /worker/workflows/ — rule is skipped
        {
            filename: '/src/services/payment.ts',
            code: `export function processPayment(a: string, b: number) {}`,
        },

        // .types. file — excluded
        {
            filename: '/src/worker/workflows/processPayment.types.ts',
            code: `export function processPayment(a: string, b: number) {}`,
        },

        // Test file — excluded
        {
            filename: '/tests/unit/worker/workflows/processPayment.spec.ts',
            code: `export function processPayment(a: string, b: number) {}`,
        },

        // Non-exported function — not checked
        {
            filename: workflowFile,
            code: `function helper(a: string, b: number) {}`,
        },
    ],

    invalid: [
        // Exported function with 2 params
        {
            filename: workflowFile,
            code: `export function processPayment(userId: string, amount: number) {}`,
            errors: [{ messageId: 'tooMany' }],
        },

        // Exported arrow function with 3 params
        {
            filename: workflowFile,
            code: `export const processPayment = (a: string, b: number, c: boolean) => {}`,
            errors: [{ messageId: 'tooMany' }],
        },
    ],
})

// --- async-activity ---

ruleTester.run('async-activity', plugin.rules['async-activity'], {
    valid: [
        // Async method
        {
            filename: activityFile,
            code: `
                class NotificationActivity {
                    async send() {}
                }
            `,
        },

        // Constructor — exempt
        {
            filename: activityFile,
            code: `
                class NotificationActivity {
                    constructor() {}
                }
            `,
        },

        // Not in /worker/activities/ — rule is skipped
        {
            filename: '/src/services/notification.ts',
            code: `
                class NotificationService {
                    send() {}
                }
            `,
        },

        // Test file — excluded
        {
            filename: '/tests/integration/worker/activities/sendNotification.spec.ts',
            code: `
                class NotificationActivity {
                    send() {}
                }
            `,
        },

        // Private method — exempt
        {
            filename: activityFile,
            code: `
                class NotificationActivity {
                    private resolveSpouses() {}
                }
            `,
        },

        // Private async method — also fine
        {
            filename: activityFile,
            code: `
                class NotificationActivity {
                    private async helper() {}
                }
            `,
        },
    ],

    invalid: [
        // Non-async method in activity file
        {
            filename: activityFile,
            code: `
                class NotificationActivity {
                    send() {}
                }
            `,
            errors: [{ messageId: 'notAsync' }],
        },

        // Multiple non-async methods
        {
            filename: activityFile,
            code: `
                class NotificationActivity {
                    send() {}
                    validate() {}
                }
            `,
            errors: [{ messageId: 'notAsync' }, { messageId: 'notAsync' }],
        },
    ],
})

// --- no-node-imports ---

ruleTester.run('no-node-imports', plugin.rules['no-node-imports'], {
    valid: [
        // Non-Node import
        {
            filename: workflowFile,
            code: `import { proxyActivities } from '@temporalio/workflow'`,
        },

        // Not in /worker/workflows/ — rule is skipped
        {
            filename: '/src/services/file.ts',
            code: `import { readFileSync } from 'node:fs'`,
        },

        // .types. file — excluded
        {
            filename: '/src/worker/workflows/types.types.ts',
            code: `import { join } from 'node:path'`,
        },

        // Test file — excluded
        {
            filename: '/tests/unit/worker/workflows/processPayment.spec.ts',
            code: `import { readFileSync } from 'node:fs'`,
        },
    ],

    invalid: [
        // node:fs
        {
            filename: workflowFile,
            code: `import { readFileSync } from 'node:fs'`,
            errors: [{ messageId: 'forbidden' }],
        },

        // path (without node: prefix)
        {
            filename: workflowFile,
            code: `import { join } from 'path'`,
            errors: [{ messageId: 'forbidden' }],
        },

        // node:crypto
        {
            filename: workflowFile,
            code: `import { randomUUID } from 'node:crypto'`,
            errors: [{ messageId: 'forbidden' }],
        },

        // node:child_process
        {
            filename: workflowFile,
            code: `import { exec } from 'node:child_process'`,
            errors: [{ messageId: 'forbidden' }],
        },
    ],
})

// --- no-path-alias-imports ---

ruleTester.run('no-path-alias-imports', plugin.rules['no-path-alias-imports'], {
    valid: [
        // Relative import
        {
            filename: workflowFile,
            code: `import { helper } from './helper'`,
        },

        // @diia-inhouse/ — allowed
        {
            filename: workflowFile,
            code: `import { Logger } from '@diia-inhouse/types'`,
        },

        // @temporalio/ — allowed
        {
            filename: workflowFile,
            code: `import { proxyActivities } from '@temporalio/workflow'`,
        },

        // Type-only import — allowed
        {
            filename: workflowFile,
            code: `import type { Config } from '@interfaces/config'`,
        },

        // Not in /worker/workflows/ — rule is skipped
        {
            filename: '/src/services/payment.ts',
            code: `import { repo } from '@services/repo'`,
        },

        // Test file — excluded
        {
            filename: '/tests/integration/worker/workflows/processPayment.spec.ts',
            code: `import { repo } from '@services/repo'`,
        },
    ],

    invalid: [
        // @services/ path alias
        {
            filename: workflowFile,
            code: `import { repo } from '@services/repo'`,
            errors: [{ messageId: 'forbidden' }],
        },

        // @interfaces/ path alias
        {
            filename: workflowFile,
            code: `import { Config } from '@interfaces/config'`,
            errors: [{ messageId: 'forbidden' }],
        },
    ],
})
