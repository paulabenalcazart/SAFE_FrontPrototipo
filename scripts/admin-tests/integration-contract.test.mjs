import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '../..')

async function source(relativePath) {
  return fs.readFile(path.join(root, relativePath), 'utf8')
}

// Los contratos inspeccionan límites de integración estáticos. Extraer cuerpos por
// delimitadores evita falsos positivos entre cases/funciones vecinas al evolucionar
// el archivo, sin convertir el test en un detector de formato.
function blockAfter(text, marker) {
  const start = text.indexOf(marker)
  assert.notEqual(start, -1, `No se encontró ${marker}`)
  const open = marker.startsWith('function ') ? text.indexOf('{', text.indexOf(')', start) + 1) : text.indexOf('{', start)
  assert.notEqual(open, -1, `No se abrió el bloque de ${marker}`)
  let depth = 0
  for (let index = open; index < text.length; index += 1) {
    if (text[index] === '{') depth += 1
    if (text[index] === '}' && --depth === 0) return text.slice(start, index + 1)
  }
  assert.fail(`Bloque sin cierre para ${marker}`)
}

test('ADMIN is a valid stored role and only the auth session uses storage', async () => {
  const auth = await source('src/auth/AuthContext.tsx')
  assert.match(auth, /AppRole\s*=\s*'EMPRESA'\s*\|\s*'COLABORADOR'\s*\|\s*'ADMIN'/)
  assert.match(auth, /parsed\.role !== 'EMPRESA'.*parsed\.role !== 'COLABORADOR'.*parsed\.role !== 'ADMIN'/s)
  assert.match(auth, /safe\.auth\.user/)
})

test('login and signup have separate role-safe demo flows', async () => {
  const app = await source('src/App.tsx')
  const login = blockAfter(app, 'function loginDemo')
  const signup = blockAfter(app, 'function signupEmpresaDemo')
  assert.match(login, /correoTipeado\.trim\(\)\.toLowerCase\(\)/)
  assert.match(login, /ADMIN_DEMO_EMAIL/)
  assert.match(signup, /login\(usuarioEmpresaDemo\)/)
  assert.match(app, /onCrearCuenta=\{signupEmpresaDemo\}/)
})

test('role resolvers and navigation are explicit for all three roles', async () => {
  const [app, navigation] = await Promise.all([source('src/App.tsx'), source('src/portal/navigation.ts')])
  for (const resolver of ['function DashboardResolver', 'function TutorialesResolver', 'function ConfiguracionResolver']) {
    const body = blockAfter(app, resolver)
    for (const value of ['EMPRESA', 'COLABORADOR', 'ADMIN']) assert.match(body, new RegExp(`case '${value}'`))
  }
  const navResolver = blockAfter(navigation, 'export function navItemsParaRol')
  for (const value of ['EMPRESA', 'COLABORADOR', 'ADMIN']) assert.match(navResolver, new RegExp(`case '${value}'`))
  assert.match(app, /assertNever/)
  assert.match(navigation, /navItemsParaRol/)
})

test('ADMIN boundary and topbar are lazy and isolated from PortalData', async () => {
  const [app, boundary, topbar] = await Promise.all([
    source('src/App.tsx'),
    source('src/portal/admin/AdminDataBoundary.tsx'),
    source('src/portal/components/Topbar.tsx'),
  ])
  const roleBoundary = blockAfter(app, 'function PortalProviderByRole')
  assert.match(roleBoundary, /AdminDataBoundary/)
  assert.match(roleBoundary, /role="status"/)
  assert.match(app.slice(0, app.indexOf('export const NAV_KEY_TO_PATH')), /lazy\(\(\)\s*=>\s*import\(['"]\.\/portal\/admin\/AdminDataBoundary['"]\)/)
  assert.match(boundary, /import '\.\/admin\.css'/)
  assert.match(boundary, /<AdminDataProvider>/)
  assert.match(boundary, /className="admin-surface"/)
  assert.match(topbar, /AdminTopbar/)
})

test('shared mobile drawer meets the role-aware accessible shell contract', async () => {
  const [sidebar, drawer, layout] = await Promise.all([
    source('src/portal/components/Sidebar.tsx'),
    source('src/portal/components/MobileNavigationDrawer.tsx'),
    source('src/portal/PortalLayout.tsx'),
  ])
  assert.match(sidebar, /navItemsParaRol/)
  assert.match(drawer, /role="dialog"/)
  assert.match(drawer, /aria-modal="true"/)
  assert.match(drawer, /acquireBodyScrollLock/)
  assert.match(drawer, /acquireDialogLayer/)
  assert.match(drawer, /onClose/)
  assert.match(layout, /MobileNavigationDrawer/)
})

test('ADMIN account navigation, dashboard and titles use integrated routes', async () => {
  const [account, app, titles, dashboard, activity] = await Promise.all([
    source('src/portal/components/AccountMenu.tsx'),
    source('src/App.tsx'),
    source('src/titulos.ts'),
    source('src/portal/admin/dashboard/AdminDashboardScreen.tsx'),
    source('src/portal/admin/dashboard/AdminRecentActivity.tsx'),
  ])
  assert.match(account, /case 'ADMIN'/)
  const accountSwitch = blockAfter(account, 'switch (user.role)')
  const adminCase = accountSwitch.slice(accountSwitch.indexOf("case 'ADMIN'"), accountSwitch.indexOf("case 'COLABORADOR'"))
  assert.doesNotMatch(adminCase, /Mi plan/)
  assert.match(blockAfter(app, 'function DashboardResolver'), /case 'ADMIN': return <AdminDashboardScreen \/>/)
  for (const title of ['Usuarios SAFE Admin', 'Parámetros normativos SAFE', 'Planes y permisos SAFE', 'Alertas y contenido SAFE', 'Incidencias y auditoría SAFE', 'Alertas de seguridad SAFE']) assert.match(titles, new RegExp(title))
  assert.match(dashboard, /AdminPlatformChart/)
  assert.match(activity, /\/app\/admin\/usuarios\?tab=companies/)
  assert.match(activity, /\/app\/admin\/usuarios\?tab=applications/)
})
