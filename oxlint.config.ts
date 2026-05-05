import { base } from './oxlint/config.ts'

export default {
    ...base,
    ignorePatterns: [...(base.ignorePatterns ?? []), 'oxlint.config.ts'],
}
