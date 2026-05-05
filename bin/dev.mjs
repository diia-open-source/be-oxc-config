#!/usr/bin/env node
import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const tsx = require.resolve('tsx/cli')

const args = process.argv.slice(2)
const entry = args[0] || 'src/index.ts'

const child = spawn(process.execPath, [tsx, '--watch', entry], {
    stdio: 'inherit',
    env: process.env,
})

process.on('SIGINT', () => child.kill('SIGINT'))
process.on('SIGTERM', () => child.kill('SIGTERM'))
child.on('exit', (code) => process.exit(code ?? 1))
