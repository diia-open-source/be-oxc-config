import { RuleTester } from '@typescript-eslint/rule-tester'

import plugin from '../../oxlint/plugins/classConventions.mjs'

const ruleTester = new RuleTester()

// --- member-ordering ---

ruleTester.run('member-ordering', plugin.rules['member-ordering'], {
    valid: [
        // Default @typescript-eslint/member-ordering order
        `
            class A {
                static s = 1
                public p = 1
                protected q = 2
                private r = 3
                #h = 4
                constructor() {}
                get g(): number { return 1 }
                set g(v: number) {}
                m(): void {}
            }
        `,

        // Decorated members rank before undecorated ones of the same kind
        `
            declare const Prop: () => PropertyDecorator
            class A {
                @Prop() decorated = 1
                plain = 2
            }
        `,

        // Overload signatures are not ranked, so a decorated implementation may follow them
        `
            declare const Dec: () => MethodDecorator
            class A {
                x = 1
                foo(a: string): void
                foo(a: number): void
                @Dec() foo(a: unknown): void {}
                bar(): void {}
            }
        `,

        `
            abstract class A {
                public abstract baz: string
                protected abstract bar: string
                abstract foo(): void
            }
        `,

        `
            interface I {
                [key: string]: unknown
                (): void
                a: string
                new (): I
                b(): void
            }
        `,

        'type T = { a: string; b(): void }',
    ],

    invalid: [
        {
            code: `
            class A {
                foo(): void {}
                bar = 1
                constructor() {}
            }
            `,
            output: `
            class A {
                bar = 1
                constructor() {}
                foo(): void {}
            }
            `,
            errors: [
                { messageId: 'incorrectGroupOrder', data: { name: 'bar', group: 'public instance method' } },
                { messageId: 'incorrectGroupOrder', data: { name: 'constructor', group: 'public instance method' } },
            ],
        },

        // Overload signatures move together with their implementation
        {
            code: `
            class A {
                foo(a: string): void
                foo(a: unknown): void {}
                x = 1
            }
            `,
            output: `
            class A {
                x = 1
                foo(a: string): void
                foo(a: unknown): void {}
            }
            `,
            errors: [{ messageId: 'incorrectGroupOrder', data: { name: 'x', group: 'public instance method' } }],
        },

        {
            code: `
            interface I {
                b(): void
                a: string
                new (): I
                [key: string]: unknown
                (): void
            }
            `,
            output: `
            interface I {
                [key: string]: unknown
                (): void
                a: string
                new (): I
                b(): void
            }
            `,
            errors: [
                { messageId: 'incorrectGroupOrder', data: { name: 'a', group: 'method' } },
                { messageId: 'incorrectGroupOrder', data: { name: 'new', group: 'method' } },
                { messageId: 'incorrectGroupOrder', data: { name: 'index signature', group: 'method' } },
                { messageId: 'incorrectGroupOrder', data: { name: 'call', group: 'method' } },
            ],
        },

        // Members sharing a line get a separator
        {
            code: 'type T = { b(): void, a: string }',
            output: 'type T = { a: string; b(): void, }',
            errors: [{ messageId: 'incorrectGroupOrder' }],
        },

        {
            code: 'class A { b(): void {} a = 1 }',
            output: 'class A { a = 1; b(): void {} }',
            errors: [{ messageId: 'incorrectGroupOrder' }],
        },

        // A moved initializer is terminated when the next member would continue its expression
        {
            code: `
            const key = 'k'
            class A {
                [key](): void {}
                x = 1
            }
            `,
            output: `
            const key = 'k'
            class A {
                x = 1;
                [key](): void {}
            }
            `,
            errors: [{ messageId: 'incorrectGroupOrder' }],
        },

        {
            code: `
            class A {
                *gen(): Generator<number> {}
                x = 1
            }
            `,
            output: `
            class A {
                x = 1;
                *gen(): Generator<number> {}
            }
            `,
            errors: [{ messageId: 'incorrectGroupOrder' }],
        },

        {
            code: `
            class A {
                in(): void {}
                x = 1
            }
            `,
            output: `
            class A {
                x = 1;
                in(): void {}
            }
            `,
            errors: [{ messageId: 'incorrectGroupOrder' }],
        },

        {
            code: `
            const key = 'k'
            class A {
                [key](): void {}
                x: number
            }
            `,
            output: `
            const key = 'k'
            class A {
                x: number
                [key](): void {}
            }
            `,
            errors: [{ messageId: 'incorrectGroupOrder' }],
        },

        // Leading comments, trailing same-line comments and decorators move with their member
        {
            code: `
            declare const Prop: () => PropertyDecorator
            class A { // opening
                /** docs for foo */
                foo(): void {} // trailing foo

                // section: fields
                @Prop()
                x: number // trailing x
                // dangling before close
            }
            `,
            output: `
            declare const Prop: () => PropertyDecorator
            class A { // opening
                // section: fields
                @Prop()
                x: number // trailing x

                /** docs for foo */
                foo(): void {} // trailing foo
                // dangling before close
            }
            `,
            errors: [{ messageId: 'incorrectGroupOrder' }],
        },

        // Overlapping fixes of a nested class are applied on the next pass
        {
            code: `
            class A {
                foo(): void {}
                x = class {
                    m(): void {}
                    y = 1
                }
            }
            `,
            output: [
                `
            class A {
                x = class {
                    m(): void {}
                    y = 1
                }
                foo(): void {}
            }
            `,
                `
            class A {
                x = class {
                    y = 1
                    m(): void {}
                }
                foo(): void {}
            }
            `,
            ],
            errors: [{ messageId: 'incorrectGroupOrder' }, { messageId: 'incorrectGroupOrder' }],
        },

        // Reordering field initializers is only offered as a suggestion
        {
            code: `
            class A {
                private a = 1
                public b = this.a
            }
            `,
            output: null,
            errors: [
                {
                    messageId: 'incorrectGroupOrder',
                    data: { name: 'b', group: 'private instance field' },
                    suggestions: [
                        {
                            messageId: 'sortMembers',
                            output: `
            class A {
                public b = this.a
                private a = 1
            }
            `,
                        },
                    ],
                },
            ],
        },

        {
            code: `
            class A {
                static {
                    console.log('init')
                }
                static x = 1
            }
            `,
            output: null,
            errors: [
                {
                    messageId: 'incorrectGroupOrder',
                    data: { name: 'x', group: 'static initialization' },
                    suggestions: [
                        {
                            messageId: 'sortMembers',
                            output: `
            class A {
                static x = 1
                static {
                    console.log('init')
                }
            }
            `,
                        },
                    ],
                },
            ],
        },

        // A suppressed report does not take the fix of the remaining ones with it, but an exempted member is only moved on request
        {
            code: `
            class A {
                foo(): void {}
                // eslint-disable-next-line @rule-tester/member-ordering
                x = 1
                y = 2
            }
            `,
            output: null,
            errors: [
                {
                    messageId: 'incorrectGroupOrder',
                    data: { name: 'y', group: 'public instance method' },
                    suggestions: [
                        {
                            messageId: 'sortExemptMembers',
                            output: `
            class A {
                // eslint-disable-next-line @rule-tester/member-ordering
                x = 1
                y = 2
                foo(): void {}
            }
            `,
                        },
                    ],
                },
            ],
        },

        {
            code: `
            class A {
                foo(): void {}
                x = 1
                bar(): void {}
                // eslint-disable-next-line @rule-tester/member-ordering -- initialised late on purpose
                y = 2
            }
            `,
            output: null,
            errors: [
                {
                    messageId: 'incorrectGroupOrder',
                    data: { name: 'x', group: 'public instance method' },
                    suggestions: [
                        {
                            messageId: 'sortExemptMembers',
                            output: `
            class A {
                x = 1
                // eslint-disable-next-line @rule-tester/member-ordering -- initialised late on purpose
                y = 2
                foo(): void {}
                bar(): void {}
            }
            `,
                        },
                    ],
                },
            ],
        },
    ],
})
