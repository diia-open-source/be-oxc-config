import { RuleTester } from '@typescript-eslint/rule-tester'

import plugin from '../../oxlint/plugins/classEncapsulation.mjs'

const ruleTester = new RuleTester()

// --- no-module-level-const ---

ruleTester.run('no-module-level-const', plugin.rules['no-module-level-const'], {
    valid: [
        // No export default class — rule is skipped
        `
            const logger = console
            export class Foo {}
        `,

        // Only imports and export default class — nothing to flag
        `
            import { Logger } from './logger'
            export default class MyService {
                private logger = new Logger()
            }
        `,

        // Type/interface at module level is fine
        `
            interface Config { port: number }
            type Status = 'active' | 'inactive'
            export default class MyService {}
        `,

        // Re-export at module level is fine
        `
            export { Something } from './something'
            export default class MyService {}
        `,
    ],

    invalid: [
        // const at module level with export default class
        {
            code: `
                const TIMEOUT = 5000
                export default class MyService {}
            `,
            errors: [{ messageId: 'forbidden' }],
        },

        // let at module level
        {
            code: `
                let counter = 0
                export default class MyService {}
            `,
            errors: [{ messageId: 'forbidden' }],
        },

        // Multiple const declarations
        {
            code: `
                const A = 1
                const B = 2
                export default class MyService {}
            `,
            errors: [{ messageId: 'forbidden' }, { messageId: 'forbidden' }],
        },
    ],
})

// --- no-interface-in-implementation ---

ruleTester.run('no-interface-in-implementation', plugin.rules['no-interface-in-implementation'], {
    valid: [
        // No export default class — rule is skipped
        `
            interface Config { port: number }
            export class Foo {}
        `,

        // Only class, no types
        `
            export default class MyService {
                handle() {}
            }
        `,
    ],

    invalid: [
        // Interface in file with export default class
        {
            code: `
                interface Config { port: number }
                export default class MyService {}
            `,
            errors: [{ messageId: 'forbidden' }],
        },

        // Type alias in file with export default class
        {
            code: `
                type Status = 'active' | 'inactive'
                export default class MyService {}
            `,
            errors: [{ messageId: 'forbidden' }],
        },

        // Exported interface
        {
            code: `
                export interface Config { port: number }
                export default class MyService {}
            `,
            errors: [{ messageId: 'forbidden' }],
        },

        // Exported type alias
        {
            code: `
                export type Status = 'active' | 'inactive'
                export default class MyService {}
            `,
            errors: [{ messageId: 'forbidden' }],
        },

        // Multiple type declarations
        {
            code: `
                interface Config { port: number }
                type Status = 'active' | 'inactive'
                export default class MyService {}
            `,
            errors: [{ messageId: 'forbidden' }, { messageId: 'forbidden' }],
        },
    ],
})
