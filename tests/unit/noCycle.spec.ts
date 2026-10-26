/* oxlint-disable security/detect-non-literal-fs-filename */
import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { base } from '../../oxlint/config.ts'

const files: Record<string, string> = {
    'package.json': JSON.stringify({ name: 'cycles', type: 'module' }),
    'tsconfig.json': JSON.stringify({
        compilerOptions: { module: 'nodenext', moduleResolution: 'nodenext', paths: { '#*': ['./src/*'] } },
    }),
    'tests/tsconfig.json': JSON.stringify({ extends: '../tsconfig.json', compilerOptions: { paths: { '@tests/*': ['./*'] } } }),
    'src/alias/a.ts': "import { b } from '#alias/b.js'\nexport const a = (): number => b()\n",
    'src/alias/b.ts': "import { a } from '#alias/a.js'\nexport const b = (): number => (typeof a === 'function' ? 1 : 0)\n",
    'src/types/t1.ts': "import type { T2 } from '#types/t2.js'\nexport type T1 = { t2?: T2 }\n",
    'src/types/t2.ts': "import type { T1 } from '#types/t1.js'\nexport type T2 = { t1?: T1 }\n",
    'src/clean/c.ts': "import { d } from './d.js'\nexport const c = (): number => d()\n",
    'src/clean/d.ts': 'export const d = (): number => 1\n',
    'tests/helpers/x.ts': "import { y } from '@tests/helpers/y.js'\nexport const x = (): number => y()\n",
    'tests/helpers/y.ts': "import { x } from '@tests/helpers/x.js'\nexport const y = (): number => (typeof x === 'function' ? 1 : 0)\n",
}

const lint = (): string[] => {
    const dir = mkdtempSync(join(tmpdir(), 'no-cycle-'))
    const config = { plugins: ['import'], categories: { correctness: 'off' }, rules: { 'import/no-cycle': base.rules['import/no-cycle'] } }

    writeFileSync(join(dir, '.oxlintrc.json'), JSON.stringify(config))

    for (const [path, content] of Object.entries(files)) {
        mkdirSync(dirname(join(dir, path)), { recursive: true })
        writeFileSync(join(dir, path), content)
    }

    let output = ''

    try {
        output = execFileSync(join(process.cwd(), 'node_modules', '.bin', 'oxlint'), ['-c', '.oxlintrc.json', '--format=unix', '.'], {
            cwd: dir,
            encoding: 'utf8',
        })
    } catch (err) {
        output = (err as { stdout?: string }).stdout ?? ''
    }

    return output
        .split('\n')
        .filter((line) => line.includes('no-cycle'))
        .map((line) => line.split(':')[0])
        .sort()
}

describe('import/no-cycle', () => {
    it('reports a cycle through a tsconfig path alias in every file on it, and not a type-only one', () => {
        expect(lint()).toEqual(['src/alias/a.ts', 'src/alias/b.ts', 'tests/helpers/x.ts', 'tests/helpers/y.ts'])
    })
})
