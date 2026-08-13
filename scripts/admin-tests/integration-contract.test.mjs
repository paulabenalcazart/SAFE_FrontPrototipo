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
  const reader = blockAfter(auth, 'function readStoredUser')
  assert.match(auth, /AppRole\s*=\s*'EMPRESA'\s*\|\s*'COLABORADOR'\s*\|\s*'ADMIN'/)
  assert.match(reader, /parsed\.role !== 'EMPRESA'.*parsed\.role !== 'COLABORADOR'.*parsed\.role !== 'ADMIN'/s)
  for (const field of ['nombres', 'apellidos', 'correo', 'telefono', 'pais', 'ciudad', 'iniciales']) {
    assert.match(reader, new RegExp(`esTextoNoVacio\\(parsed\\.${field}\\)`), `readStoredUser debe rechazar ${field} vacío o no string`)
  }
  assert.match(reader, /typeof parsed\.mfaHabilitado !== 'boolean'/)
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
  const [app, boundary, topbar, adminTopbar] = await Promise.all([
    source('src/App.tsx'),
    source('src/portal/admin/AdminDataBoundary.tsx'),
    source('src/portal/components/Topbar.tsx'),
    source('src/portal/admin/components/AdminTopbar.tsx'),
  ])
  const roleBoundary = blockAfter(app, 'function PortalProviderByRole')
  assert.match(roleBoundary, /AdminDataBoundary/)
  assert.match(roleBoundary, /role="status"/)
  assert.match(app.slice(0, app.indexOf('export const NAV_KEY_TO_PATH')), /lazy\(\(\)\s*=>\s*import\(['"]\.\/portal\/admin\/AdminDataBoundary['"]\)/)
  assert.match(boundary, /import '\.\/admin\.css'/)
  assert.match(boundary, /<AdminDataProvider>/)
  assert.match(boundary, /className="admin-surface"/)
  assert.doesNotMatch(boundary, /PortalDataProvider|localStorage|sessionStorage/)
  const adminCase = blockAfter(app, 'function PortalProviderByRole').slice(blockAfter(app, 'function PortalProviderByRole').indexOf("case 'ADMIN'"))
  assert.match(adminCase, /<AdminDataBoundary>/)
  assert.doesNotMatch(adminCase.slice(0, adminCase.indexOf('case undefined')), /PortalDataProvider/)
  assert.match(topbar, /AdminTopbar/)
  assert.match(adminTopbar, /Administración SAFE/)
  assert.match(adminTopbar, /securityAlerts\.filter\(\(item\) => item\.estado === 'ABIERTA'\)/)
  assert.match(adminTopbar, /\/app\/admin\/alertas-seguridad/)
  assert.doesNotMatch(adminTopbar, /usePortalData|CompanySwitcher|obligaciones|notificacionesColaborador/)
})

test('shared mobile drawer meets the role-aware accessible shell contract', async () => {
  const [sidebar, drawer, layout, catalogo] = await Promise.all([
    source('src/portal/components/Sidebar.tsx'),
    source('src/portal/components/MobileNavigationDrawer.tsx'),
    source('src/portal/PortalLayout.tsx'),
    source('src/portal/admin/catalogo.ts'),
  ])
  const effect = blockAfter(drawer, 'useEffect(() =>')
  assert.match(sidebar, /navItemsParaRol/)
  assert.match(drawer, /role="dialog"/)
  assert.match(drawer, /aria-modal="true"/)
  assert.match(effect, /acquireBodyScrollLock/)
  assert.match(effect, /acquireDialogLayer/)
  assert.match(effect, /requestAnimationFrame/)
  assert.match(effect, /layer\.esTope\(\)/)
  assert.match(effect, /event\.key === 'Escape'/)
  assert.match(effect, /event\.key !== 'Tab'/)
  assert.match(effect, /activeIndex === -1/)
  assert.match(effect, /event\.shiftKey\) last\.focus\(\)/)
  assert.match(effect, /else first\.focus\(\)/)
  assert.match(effect, /previousFocus\.current\?\.isConnected/)
  assert.match(effect, /matchMedia\('\(min-width: 1024px\)'\)/)
  assert.match(effect, /addEventListener\('change'/)
  assert.match(effect, /removeEventListener\('change'/)
  assert.match(drawer, /h-11 w-11/)
  assert.match(drawer, /overflow-y-auto overflow-x-hidden/)
  assert.match(drawer, /const navItems = navItemsParaRol\(user\.role\)/)
  const mobileNav = drawer.slice(drawer.indexOf('<nav '), drawer.indexOf('</nav>') + '</nav>'.length)
  assert.match(mobileNav, /<NavLink/)
  assert.match(mobileNav, /onClick=\{onClose\}/)
  const labels = Array.from(catalogo.matchAll(/label: '([^']+)'/g), (match) => match[1])
  assert.deepEqual(labels, ['Dashboard', 'Usuarios', 'Parámetros normativos', 'Planes y permisos', 'Alertas y contenido', 'Incidencias y auditoría', 'Video tutoriales', 'Configuración'])
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

test('ADMIN chart keeps zero-height bars when there is no monthly maximum', async () => {
  const chart = await source('src/portal/admin/dashboard/AdminPlatformChart.tsx')
  assert.match(chart, /max === 0 \? 0/)
})

test('ADMIN user management is integrated through the guarded canonical route', async () => {
  const [app, titles, catalogo, screen, drawer, review, registration] = await Promise.all([
    source('src/App.tsx'), source('src/titulos.ts'), source('src/portal/admin/catalogo.ts'),
    source('src/portal/admin/usuarios/AdminUsersScreen.tsx'),
    source('src/portal/admin/usuarios/AdminUserDetailDrawer.tsx'),
    source('src/portal/admin/usuarios/AdminApplicationReviewDialog.tsx'),
    source('src/portal/admin/usuarios/AdminRegistrationDialog.tsx'),
  ])
  assert.match(app, /AdminUsersScreen/)
  assert.match(app, /path="admin\/usuarios"/)
  assert.match(app, /<RoleRoute allow=\{\['ADMIN'\]\}>\s*<AdminUsersScreen \/>/s)
  assert.match(titles, /'\/app\/admin\/usuarios': 'Usuarios SAFE Admin'/)
  assert.match(catalogo, /label: 'Usuarios', path: '\/app\/admin\/usuarios'/)
  for (const dependency of ['useAdminData', 'useSearchParams', 'useDeferredValue', 'AdminTabs', 'AdminDataTable', 'downloadExcel', 'deriveUserCounts']) assert.match(screen, new RegExp(dependency))
  assert.match(screen, /companies.*collaborators.*applications.*tour/s)
  assert.match(screen, /setSearchParams\(\{ tab \}, \{ replace: true \}\)/)
  assert.match(screen, /Empresas activas/)
  assert.match(screen, /Colaboradores activos/)
  assert.match(screen, /Solicitudes pendientes/)
  assert.doesNotMatch(screen, /gridTemplateColumns|window\.location|localStorage|sessionStorage/)
  assert.match(drawer, /setManagedUserState/)
  assert.match(drawer, /removeManagedCompany/)
  assert.match(drawer, /removeManagedCollaborator/)
  assert.match(drawer, /<AdminDialog/)
  assert.match(review, /reviewApplication\(application\.id, 'APROBADA'\)/)
  assert.match(review, /reason\.trim\(\)/)
  assert.match(review, /role="alert"/)
  assert.match(registration, /crypto\.randomUUID\(\)/)
  assert.match(registration, /AHORA_ADMIN/)
  assert.match(registration, /role="alert"/)
  for (const text of [screen, drawer, review, registration]) assert.doesNotMatch(text, /Date\.now|new Date|#document|javascript:|data:|replaceAll|BrowserRouter|safe\.admin\.react/)
})
