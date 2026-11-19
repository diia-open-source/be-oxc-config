// Types for the plain .mjs plugins the specs import; packageCheck.spec.ts also calls create and fix by hand.
declare module '*.mjs' {
    import type { RuleTester } from '@typescript-eslint/rule-tester'

    type Rule = Parameters<RuleTester['run']>[1]
    type ManualContext = { filename: string; options: unknown[]; report(report: { messageId: string }): void }
    type PluginRule = Omit<Rule, 'create'> & {
        create(context: Parameters<Rule['create']>[0] | ManualContext): ReturnType<Rule['create']> & { Program(node: object): void }
    }
    type Manifest = Record<string, unknown>
    type ManifestRule = PluginRule & { fix(data: Manifest, options: Record<string, unknown>, entry?: unknown): Manifest }

    const plugin: { rules: Record<string, PluginRule> }

    export const manifestRules: Record<string, ManifestRule>

    export default plugin
}
