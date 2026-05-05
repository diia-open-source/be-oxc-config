import { RuleTester } from '@typescript-eslint/rule-tester'

import plugin from '../../oxlint/plugins/codeConventions.mjs'

const ruleTester = new RuleTester()

// --- no-inline-object-return-type ---

ruleTester.run('no-inline-object-return-type', plugin.rules['no-inline-object-return-type'], {
    valid: [
        // Named interface return type
        `
        interface FooResult { a: string; b: number }
        function foo(): FooResult { return { a: 'x', b: 1 } }
        `,

        // Named type alias return type
        `
        type BarResult = { x: number }
        function bar(): BarResult { return { x: 1 } }
        `,

        // Primitive return type
        'function baz(): string { return "hello" }',

        // Void return type
        'function noop(): void {}',

        // Array return type
        'function arr(): string[] { return ["a"] }',

        // Promise return type
        'async function asyncFn(): Promise<string> { return "done" }',

        // No return type annotation
        'function noAnnotation() { return { x: 1 } }',

        // Arrow function without return type
        'const fn = () => ({ x: 1 })',

        // Class method with named return type
        `
        interface Result { x: number }
        class Foo { bar(): Result { return { x: 1 } } }
        `,
    ],

    invalid: [
        // Function declaration
        {
            code: 'function foo(): { a: string; b: number } { return { a: "x", b: 1 } }',
            errors: [{ messageId: 'forbidden' }],
        },

        // Arrow function
        {
            code: 'const arrowFn = (): { c: boolean } => ({ c: true })',
            errors: [{ messageId: 'forbidden' }],
        },

        // Function expression
        {
            code: 'const fnExpr = function (): { d: string } { return { d: "y" } }',
            errors: [{ messageId: 'forbidden' }],
        },

        // Class method
        {
            code: 'class MyClass { bar(): { x: number } { return { x: 1 } } }',
            errors: [{ messageId: 'forbidden' }],
        },

        // Async method in a class
        {
            code: 'class Svc { async get(): { x: number } { return { x: 1 } } }',
            errors: [{ messageId: 'forbidden' }],
        },
    ],
})

// --- no-promise-settimeout ---

ruleTester.run('no-promise-settimeout', plugin.rules['no-promise-settimeout'], {
    valid: [
        // Regular Promise usage
        'new Promise((resolve) => resolve(42))',

        // setTimeout without Promise wrapper
        'setTimeout(() => {}, 1000)',

        // import from node:timers/promises (the correct way)
        `import { setTimeout } from 'node:timers/promises'`,

        // Promise with non-setTimeout call
        'new Promise((resolve) => { fetch("/api").then(resolve) })',

        // Not a Promise constructor
        'new EventEmitter()',

        // Promise with multiple statements in body
        `new Promise((resolve) => {
            const x = 1
            resolve(x)
        })`,
    ],

    invalid: [
        // Arrow function body with block statement
        {
            code: `new Promise((resolve) => { setTimeout(resolve, 1000) })`,
            errors: [{ messageId: 'forbidden' }],
        },

        // Arrow function with expression body
        {
            code: `new Promise((resolve) => setTimeout(resolve, 1000))`,
            errors: [{ messageId: 'forbidden' }],
        },

        // Function expression
        {
            code: `new Promise(function(resolve) { setTimeout(resolve, 1000) })`,
            errors: [{ messageId: 'forbidden' }],
        },
    ],
})

// --- prefer-as-const-object ---

ruleTester.run('prefer-as-const-object', plugin.rules['prefer-as-const-object'], {
    valid: [
        // Already has `as const`
        `export const FooTypes = { digital: 'digital', paper: 'paper' } as const`,

        // Different casing with `as const`
        `export const BarStatus = { Active: 'ACTIVE', Inactive: 'INACTIVE' } as const`,

        // Not all values are string literals — skip
        `export const Config = { port: 3000, host: 'localhost' }`,

        // Values don't match keys even case-insensitively
        `export const Mapping = { a: 'hello', b: 'world' }`,

        // Single property — still valid with as const
        `export const OneKey = { solo: 'solo' } as const`,

        // Empty object — skip
        `export const Empty = {}`,

        // Non-const declaration
        `let FooTypes = { digital: 'digital', paper: 'paper' }`,

        // Computed property — skip
        `export const Foo = { [key]: 'key' }`,

        // Not a top-level declaration (inside function)
        `function fn() { const Foo = { a: 'a', b: 'b' }; return Foo }`,

        // Mixed: some keys match, some don't — skip
        `export const Mixed = { a: 'a', b: 'something_else' }`,

        // satisfies with as const
        `export const FooTypes = { digital: 'digital', paper: 'paper' } as const satisfies Record<string, string>`,
    ],

    invalid: [
        // Exact key/value match, no `as const`
        {
            code: `export const FooTypes = { digital: 'digital', paper: 'paper' }`,
            errors: [{ messageId: 'missingAsConst' }],
        },

        // Different casing match, no `as const`
        {
            code: `export const BarStatus = { Active: 'ACTIVE', Inactive: 'INACTIVE' }`,
            errors: [{ messageId: 'missingAsConst' }],
        },

        // camelCase key, SCREAMING_SNAKE value
        {
            code: `export const ActionType = { getData: 'GET_DATA', setData: 'SET_DATA' }`,
            errors: [{ messageId: 'missingAsConst' }],
        },

        // Non-exported const — still should require as const
        {
            code: `const InternalStatus = { active: 'active', deleted: 'deleted' }`,
            errors: [{ messageId: 'missingAsConst' }],
        },

        // Single property match
        {
            code: `export const OneKey = { solo: 'solo' }`,
            errors: [{ messageId: 'missingAsConst' }],
        },

        // PascalCase key, lowercase value
        {
            code: `export const Formats = { Digital: 'digital', Paper: 'paper' }`,
            errors: [{ messageId: 'missingAsConst' }],
        },
    ],
})

// --- const-enum-naming ---

ruleTester.run('const-enum-naming', plugin.rules['const-enum-naming'], {
    valid: [
        // PascalCase, plural, with as const
        `export const FooStatuses = { active: 'active', deleted: 'deleted' } as const`,

        // PascalCase, plural, different casing
        `export const BarTypes = { Digital: 'DIGITAL', Paper: 'PAPER' } as const`,

        // Not enum-like (number value) — skip
        `export const Config = { port: 3000, debug: true }`,

        // Not enum-like (values don't match keys) — skip
        `export const Mapping = { a: 'hello', b: 'world' }`,

        // Not top-level — skip
        `function fn() { const fooTypes = { a: 'a' }; return fooTypes }`,

        // PascalCase, plural, without as const (naming is fine)
        `export const FooStatuses = { active: 'active', deleted: 'deleted' }`,

        // Empty object — skip
        `export const Empty = {}`,

        // let declaration — skip
        `let fooTypes = { a: 'a' }`,

        // as const satisfies — still detected
        `export const FooTypes = { a: 'A' } as const satisfies Record<string, string>`,
    ],

    invalid: [
        // camelCase — should be PascalCase
        {
            code: `export const fooStatuses = { active: 'active', deleted: 'deleted' } as const`,
            errors: [{ messageId: 'notPascalCase' }],
        },

        // Not plural
        {
            code: `export const FooType = { active: 'ACTIVE', deleted: 'DELETED' } as const`,
            errors: [{ messageId: 'notPlural' }],
        },

        // camelCase AND not plural — two errors
        {
            code: `export const fooType = { active: 'ACTIVE' } as const`,
            errors: [{ messageId: 'notPascalCase' }, { messageId: 'notPlural' }],
        },

        // camelCase without as const (naming rule still applies)
        {
            code: `export const fooStatuses = { active: 'active', deleted: 'deleted' }`,
            errors: [{ messageId: 'notPascalCase' }],
        },

        // Not plural, without as const
        {
            code: `const FooType = { a: 'A', b: 'B' }`,
            errors: [{ messageId: 'notPlural' }],
        },
    ],
})

// --- const-enum-type-name ---

ruleTester.run('const-enum-type-name', plugin.rules['const-enum-type-name'], {
    valid: [
        // Correct singular (removes 's')
        `export type BarType = (typeof BarTypes)[keyof typeof BarTypes]`,

        // Correct singular (removes 'es')
        `export type FooStatus = (typeof FooStatuses)[keyof typeof FooStatuses]`,

        // Correct singular (ies → y)
        `type Category = (typeof Categories)[keyof typeof Categories]`,

        // Not the indexed access pattern — skip
        `type RandomType = string`,

        // Not typeof in objectType — skip
        `type Foo = Record<string, string>`,

        // Different object and index references — skip
        `type Foo = (typeof A)[keyof typeof B]`,

        // camelCase object — type name is still correctly singular (casing difference in first letter)
        `export type TabCode = (typeof tabCodes)[keyof typeof tabCodes]`,
    ],

    invalid: [
        // Same name as object (not singular)
        {
            code: `export type FooStatuses = (typeof FooStatuses)[keyof typeof FooStatuses]`,
            errors: [{ messageId: 'notSingular' }],
        },

        // Completely unrelated name
        {
            code: `export type SomeRandomName = (typeof FooStatuses)[keyof typeof FooStatuses]`,
            errors: [{ messageId: 'notSingular' }],
        },

        // Wrong singular derivation
        {
            code: `export type BarTyp = (typeof BarTypes)[keyof typeof BarTypes]`,
            errors: [{ messageId: 'notSingular' }],
        },
    ],
})
