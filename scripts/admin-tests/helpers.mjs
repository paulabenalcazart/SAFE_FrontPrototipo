import fs from 'node:fs/promises'
import path from 'node:path'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'

const require = createRequire(import.meta.url)
const ts = require('typescript')
const root = path.resolve(import.meta.dirname, '../..')

export async function importTs(relativePath) {
  const absolute = path.resolve(root, relativePath)
  const source = await fs.readFile(absolute, 'utf8')
  const result = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2020 },
  })
  const temporary = path.resolve(root, `.tmp-admin-${path.basename(relativePath).replace(/\W/g, '-')}.mjs`)
  await fs.writeFile(temporary, result.outputText)
  try {
    return await import(`${pathToFileURL(temporary).href}?v=${Date.now()}`)
  } finally {
    await fs.rm(temporary, { force: true })
  }
}
