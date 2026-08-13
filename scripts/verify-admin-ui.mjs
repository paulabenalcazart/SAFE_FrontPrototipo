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

function findUnscopedSelectors(cssSource) {
  const source = cssSource.replace(/\/\*[\s\S]*?\*\//g, '')
  const unscoped = []

  const splitSelectorList = (selectorList) => {
    const selectors = []
    let start = 0
    let parentheses = 0
    let brackets = 0
    let quote = ''
    for (let index = 0; index < selectorList.length; index += 1) {
      const character = selectorList[index]
      if (quote) {
        if (character === '\\') index += 1
        else if (character === quote) quote = ''
      } else if (character === '"' || character === "'") quote = character
      else if (character === '(') parentheses += 1
      else if (character === ')') parentheses -= 1
      else if (character === '[') brackets += 1
      else if (character === ']') brackets -= 1
      else if (character === ',' && parentheses === 0 && brackets === 0) {
        selectors.push(selectorList.slice(start, index).trim())
        start = index + 1
      }
    }
    selectors.push(selectorList.slice(start).trim())
    return selectors.filter(Boolean)
  }

  const findBlockEnd = (openIndex, limit) => {
    let depth = 1
    let quote = ''
    for (let index = openIndex + 1; index < limit; index += 1) {
      const character = source[index]
      if (quote) {
        if (character === '\\') index += 1
        else if (character === quote) quote = ''
      } else if (character === '"' || character === "'") quote = character
      else if (character === '{') depth += 1
      else if (character === '}' && --depth === 0) return index
    }
    return limit
  }

  const scanRules = (start, end) => {
    let cursor = start
    while (cursor < end) {
      while (cursor < end && /\s|;/.test(source[cursor])) cursor += 1
      if (cursor >= end || source[cursor] === '}') return
      const preludeStart = cursor
      let parentheses = 0
      let brackets = 0
      let quote = ''
      let boundary = ''
      for (; cursor < end; cursor += 1) {
        const character = source[cursor]
        if (quote) {
          if (character === '\\') cursor += 1
          else if (character === quote) quote = ''
        } else if (character === '"' || character === "'") quote = character
        else if (character === '(') parentheses += 1
        else if (character === ')') parentheses -= 1
        else if (character === '[') brackets += 1
        else if (character === ']') brackets -= 1
        else if (parentheses === 0 && brackets === 0 && (character === '{' || character === ';' || character === '}')) {
          boundary = character
          break
        }
      }
      if (!boundary || boundary === '}') return
      if (boundary === ';') {
        cursor += 1
        continue
      }
      const prelude = source.slice(preludeStart, cursor).trim()
      const blockStart = cursor
      const blockEnd = findBlockEnd(blockStart, end)
      if (/^@(media|supports|container|layer|scope|document)\b/i.test(prelude)) scanRules(blockStart + 1, blockEnd)
      else if (!prelude.startsWith('@')) {
        for (const selector of splitSelectorList(prelude)) {
          if (!/^(?:\.admin-surface\b|\.dark\s+\.admin-surface\b)/.test(selector)) unscoped.push(selector)
        }
      }
      cursor = blockEnd + 1
    }
  }

  scanRules(0, source.length)
  return unscoped
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
const unscopedSelectors = findUnscopedSelectors(css)
expect(unscopedSelectors.length === 0, `Selectores CSS sin alcance administrativo: ${unscopedSelectors.join(', ')}`)
expect(findUnscopedSelectors(`${css}\n.leak { color: red; }`).includes('.leak'), 'El verificador debe detectar un selector normal .leak fuera de .admin-surface')
expect(findUnscopedSelectors('@media (max-width: 10px) { .leak { color: red; } }').includes('.leak'), 'El verificador debe detectar una fuga dentro de @media')
expect(findUnscopedSelectors('@media (max-width: 10px) { .admin-surface .ok { color: blue; } } @keyframes demo { from { opacity: 0; } to { opacity: 1; } }').length === 0, 'El parser de selectores no debe confundir @media o pasos de @keyframes con selectores normales')

const byName = Object.fromEntries(components)
const table = byName['AdminDataTable.tsx'] ?? ''
expect(table.includes("@/portal/components/Pagination"), 'AdminDataTable debe reutilizar Pagination compartida')
expect(/<caption/.test(table), 'AdminDataTable debe incluir caption accesible')
expect(/scope=['\"]col['\"]/.test(table), 'AdminDataTable debe marcar encabezados con scope="col"')
expect(/Acciones/.test(table), 'AdminDataTable debe etiquetar la columna de acciones')
expect(/actionsLabel\.trim\(\)\s*\|\|\s*['"]Acciones['"]/.test(table), 'AdminDataTable debe normalizar una etiqueta de acciones vacía')
expect(/setPage\(1\)/.test(table), 'AdminDataTable debe reiniciar la página al cambiar filas filtradas')

const button = byName['AdminButton.tsx'] ?? ''
expect(/min-h-11|minHeight:\s*44|admin-button/.test(button), 'AdminButton debe expresar el contrato de 44 px')
const tabs = byName['AdminTabs.tsx'] ?? ''
for (const contract of ['role="tablist"', 'role="tab"', 'aria-selected', 'aria-controls', 'role="tabpanel"', 'ArrowLeft', 'ArrowRight', 'Home', 'End']) {
  expect(tabs.includes(contract), `AdminTabs debe incluir ${contract}`)
}
const dialog = byName['AdminDialog.tsx'] ?? ''
const drawer = byName['AdminDrawer.tsx'] ?? ''
const overlayHook = byName['useAdminOverlay.ts'] ?? ''
const overlay = `${dialog}\n${drawer}\n${overlayHook}`
for (const contract of ['acquireBodyScrollLock', 'acquireDialogLayer', 'requestAnimationFrame', 'aria-modal="true"', 'aria-labelledby', 'Escape', 'Tab', 'previousFocusRef', 'previous.focus()']) {
  expect(overlay.includes(contract), `Overlay administrativo debe incluir ${contract}`)
}
expect(/elements\.(?:indexOf|includes)\(activeElement/.test(overlayHook) && /(?:===\s*-1|!elements\.includes)/.test(overlayHook), 'La trampa de foco debe contener Tab y Shift+Tab cuando el foco parte del título o fuera de los controles')
expect(/onCloseRef\s*=\s*useRef/.test(overlayHook) && /onCloseRef\.current\s*=\s*onClose/.test(overlayHook) && /onCloseRef\.current\(\)/.test(overlayHook), 'useAdminOverlay debe invocar el onClose vigente desde una ref')
expect(/\},\s*\[open\]\s*\)/.test(overlayHook), 'La adquisición principal del overlay debe depender solo de open')
expect(/useId\(\)/.test(dialog) && /useId\(\)/.test(drawer), 'AdminDialog y AdminDrawer deben crear IDs de título únicos y estables con useId')
expect(!/localStorage|sessionStorage|react-router-dom/.test(components.map(([, source]) => source).join('\n')), 'Las primitivas administrativas no pueden usar storage ni router')

if (errors.length) {
  console.error('verify:admin falló:')
  for (const error of errors) console.error(`- ${error}`)
  process.exitCode = 1
} else {
  console.log('verify:admin aprobó los contratos de UI administrativa')
}
