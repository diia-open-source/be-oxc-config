import { RuleTester } from '@typescript-eslint/rule-tester'

import plugin from '../../oxlint/plugins/mongooseSchema.mjs'

const ruleTester = new RuleTester()
const filename = '/src/models/user.ts'

// --- schema-timestamps ---

ruleTester.run('schema-timestamps', plugin.rules['schema-timestamps'], {
    valid: [
        // Schema with timestamps: true
        {
            filename,
            code: `const schema = new Schema({ name: String }, { timestamps: true })`,
        },

        // Sub-schema with _id: false — exempt from timestamps
        {
            filename,
            code: `const addressSchema = new Schema({ street: String }, { _id: false })`,
        },

        // Not in /models/ — rule is skipped
        {
            filename: '/src/services/user.ts',
            code: `const schema = new Schema({ name: String })`,
        },

        // mongoose.Schema constructor with timestamps
        {
            filename,
            code: `const schema = new mongoose.Schema({ name: String }, { timestamps: true })`,
        },
    ],

    invalid: [
        // Schema without timestamps
        {
            filename,
            code: `const schema = new Schema({ name: String })`,
            errors: [{ messageId: 'missing' }],
        },

        // Schema with timestamps: false
        {
            filename,
            code: `const schema = new Schema({ name: String }, { timestamps: false })`,
            errors: [{ messageId: 'missing' }],
        },

        // Schema with empty options
        {
            filename,
            code: `const schema = new Schema({ name: String }, {})`,
            errors: [{ messageId: 'missing' }],
        },

        // mongoose.Schema without timestamps
        {
            filename,
            code: `const schema = new mongoose.Schema({ name: String })`,
            errors: [{ messageId: 'missing' }],
        },
    ],
})

// --- sub-schema-id-false ---

ruleTester.run('sub-schema-id-false', plugin.rules['sub-schema-id-false'], {
    valid: [
        // Sub-schema with _id: false
        {
            filename,
            code: `
                const addressSchema = new Schema({ street: String }, { _id: false })
                const userSchema = new Schema({
                    addresses: { type: [addressSchema] }
                }, { timestamps: true })
            `,
        },

        // Schema not used as sub-schema
        {
            filename,
            code: `
                const userSchema = new Schema({ name: String }, { timestamps: true })
            `,
        },

        // Not in /models/ — rule is skipped
        {
            filename: '/src/services/user.ts',
            code: `
                const addressSchema = new Schema({ street: String })
                const userSchema = new Schema({
                    addresses: { type: [addressSchema] }
                }, { timestamps: true })
            `,
        },
    ],

    invalid: [
        // Sub-schema without _id: false
        {
            filename,
            code: `
                const addressSchema = new Schema({ street: String })
                const userSchema = new Schema({
                    addresses: { type: [addressSchema] }
                }, { timestamps: true })
            `,
            errors: [{ messageId: 'missing' }],
        },
    ],
})

// --- status-requires-history ---

ruleTester.run('status-requires-history', plugin.rules['status-requires-history'], {
    valid: [
        // Schema with status and statusHistory
        {
            filename,
            code: `const schema = new Schema({ status: String, statusHistory: Array }, { timestamps: true })`,
        },

        // Schema without status field
        {
            filename,
            code: `const schema = new Schema({ name: String }, { timestamps: true })`,
        },

        // Sub-schema with _id: false — exempt
        {
            filename,
            code: `const schema = new Schema({ status: String }, { _id: false })`,
        },

        // Not in /models/ — rule is skipped
        {
            filename: '/src/services/user.ts',
            code: `const schema = new Schema({ status: String })`,
        },
    ],

    invalid: [
        // Schema with status but no statusHistory
        {
            filename,
            code: `const schema = new Schema({ status: String, name: String }, { timestamps: true })`,
            errors: [{ messageId: 'missing' }],
        },
    ],
})
