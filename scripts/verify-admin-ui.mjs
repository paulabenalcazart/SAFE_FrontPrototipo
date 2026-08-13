import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const requiredFiles = [
  'src/portal/admin/admin.css',
  'src/portal/admin/components/data/AdminDataTable.tsx',
  'src/portal/admin/components/data/AdminFilterBar.tsx',
  'src/portal/admin/components/data/AdminSelectFilter.tsx',
  'src/portal/admin/components/ui/AdminButton.tsx',
  'src/portal/admin/components/ui/AdminCard.tsx',
  'src/portal/admin/components/ui/AdminDialog.tsx',
  'src/portal/admin/components/ui/AdminDrawer.tsx',
  'src/portal/admin/components/ui/AdminEmptyState.tsx',
  'src/portal/admin/components/ui/AdminKpiCard.tsx',
  'src/portal/admin/components/ui/AdminPageHeader.tsx',
  'src/portal/admin/components/ui/AdminStatusBadge.tsx',
  'src/portal/admin/components/ui/AdminTabs.tsx',
  'src/portal/admin/components/ui/useAdminOverlay.ts',
]

const expectedExports = {
  'AdminDataTable.tsx': 'AdminDataTable',
  'AdminFilterBar.tsx': 'AdminFilterBar',
  'AdminSelectFilter.tsx': 'AdminSelectFilter',
  'AdminButton.tsx': 'AdminButton',
  'AdminCard.tsx': 'AdminCard',
  'AdminDialog.tsx': 'AdminDialog',
  'AdminDrawer.tsx': 'AdminDrawer',
  'AdminEmptyState.tsx': 'AdminEmptyState',
  'AdminKpiCard.tsx': 'AdminKpiCard',
  'AdminPageHeader.tsx': 'AdminPageHeader',
  'AdminStatusBadge.tsx': 'AdminStatusBadge',
  'AdminTabs.tsx': 'AdminTabs',
  'useAdminOverlay.ts': 'useAdminOverlay',
}

const errors = []
const read = async (relativePath) => {
  try {
    return await fs.readFile(path.join(root, relativePath), 'utf8')
  } catch {
    errors.push(`Falta ${relativePath}`)
    return ''
  }
}
const expect = (condition, message) => {
  if (!condition) errors.push(message)
}

for (const file of requiredFiles) await read(file)

const components = await Promise.all(
  Object.entries(expectedExports).map(async ([file, exported]) => [file, await read(`src/portal/admin/components/${file === 'AdminDataTable.tsx' || file === 'AdminFilterBar.tsx' || file === 'AdminSelectFilter.tsx' ? 'data' : 'ui'}/${file}`)]),
)
components.push(['useAdminOverlay.ts', await read('src/portal/admin/components/ui/useAdminOverlay.ts')])
for (const [file, source] of components) {
  const exported = expectedExports[file]
  expect(new RegExp(`export\\s+(?:const|function|interface|type|\\{[^}]*\\b${exported}\\b)[\\s\\S]*\\b${exported}\\b`).test(source) || source.includes(`export function ${exported}`) || source.includes(`export const ${exported}`), `${file} debe exportar ${exported}`)
}

const css = await read('src/portal/admin/admin.css')
expect(/^\.admin-surface\s*\{/m.test(css), 'admin.css debe declarar la raíz .admin-surface')
expect(!/@import|@keyframes|\banimation\s*:|\b:root\b|\bhtml\b|\bbody\b|(^|\n)\s*\*/m.test(css), 'admin.css contiene una regla global o movimiento prohibido')
for (const selector of css.matchAll(/(^|\}|\{)\s*(\.admin-surface[^{}]*|\.dark\s+\.admin-surface[^{}]*)\{/gm)) {
  const value = selector[2].trim()
  if (!value.split(',').every((part) => /^\.admin-surface\b|^\.dark\s+\.admin-surface\b/.test(part.trim()))) errors.push(`Selector CSS sin alcance administrativo: ${value}`)
}

const byName = Object.fromEntries(components)
const table = byName['AdminDataTable.tsx'] ?? ''
expect(table.includes("@/portal/components/Pagination"), 'AdminDataTable debe reutilizar Pagination compartida')
expect(/<caption/.test(table), 'AdminDataTable debe incluir caption accesible')
expect(/scope=['\"]col['\"]/.test(table), 'AdminDataTable debe marcar encabezados con scope="col"')
expect(/Acciones/.test(table), 'AdminDataTable debe etiquetar la columna de acciones')
expect(/setPage\(1\)/.test(table), 'AdminDataTable debe reiniciar la página al cambiar filas filtradas')

const button = byName['AdminButton.tsx'] ?? ''
expect(/min-h-11|minHeight:\s*44|admin-button/.test(button), 'AdminButton debe expresar el contrato de 44 px')
const tabs = byName['AdminTabs.tsx'] ?? ''
for (const contract of ['role="tablist"', 'role="tab"', 'aria-selected', 'aria-controls', 'role="tabpanel"', 'ArrowLeft', 'ArrowRight', 'Home', 'End']) {
  expect(tabs.includes(contract), `AdminTabs debe incluir ${contract}`)
}
const overlay = `${byName['AdminDialog.tsx'] ?? ''}\n${byName['AdminDrawer.tsx'] ?? ''}\n${byName['useAdminOverlay.ts'] ?? ''}`
for (const contract of ['acquireBodyScrollLock', 'acquireDialogLayer', 'requestAnimationFrame', 'aria-modal="true"', 'aria-labelledby', 'Escape', 'Tab', 'previousFocusRef', 'previous.focus()']) {
  expect(overlay.includes(contract), `Overlay administrativo debe incluir ${contract}`)
}
expect(!/localStorage|sessionStorage|react-router-dom/.test(components.map(([, source]) => source).join('\n')), 'Las primitivas administrativas no pueden usar storage ni router')

if (errors.length) {
  console.error('verify:admin falló:')
  for (const error of errors) console.error(`- ${error}`)
  process.exitCode = 1
} else {
  console.log('verify:admin aprobó los contratos de UI administrativa')
}
