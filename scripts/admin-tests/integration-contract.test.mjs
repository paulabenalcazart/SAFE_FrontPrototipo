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

test('ADMIN boundary and topbar are eagerly loaded (no loading screen) and isolated from PortalData', async () => {
  const [app, boundary, topbar, adminTopbar] = await Promise.all([
    source('src/App.tsx'),
    source('src/portal/admin/AdminDataBoundary.tsx'),
    source('src/portal/components/Topbar.tsx'),
    source('src/portal/admin/components/AdminTopbar.tsx'),
  ])
  const roleBoundary = blockAfter(app, 'function PortalProviderByRole')
  assert.match(roleBoundary, /AdminDataBoundary/)
  assert.doesNotMatch(roleBoundary, /role="status"/)
  assert.doesNotMatch(app, /lazy\(\(\)\s*=>\s*import\(['"]\.\/portal\/admin\/AdminDataBoundary['"]\)/)
  assert.match(app, /import \{ AdminDataBoundary \} from '\.\/portal\/admin\/AdminDataBoundary'/)
  assert.match(boundary, /import '\.\/admin\.css'/)
  assert.match(boundary, /<AdminDataProvider>/)
  assert.match(boundary, /className="admin-surface"/)
  assert.doesNotMatch(boundary, /PortalDataProvider|localStorage|sessionStorage/)
  const adminCase = blockAfter(app, 'function PortalProviderByRole').slice(blockAfter(app, 'function PortalProviderByRole').indexOf("case 'ADMIN'"))
  assert.match(adminCase, /<AdminDataBoundary>/)
  assert.doesNotMatch(adminCase.slice(0, adminCase.indexOf('case undefined')), /PortalDataProvider/)
  assert.match(topbar, /AdminTopbar/)
  assert.match(adminTopbar, /Administración SAFE/)
  assert.match(adminTopbar, /securityAlerts\s*\.filter\(\(item\)\s*=>\s*item\.estado === 'ABIERTA'\)/)
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

test('ADMIN users stay synchronized with valid URL tabs and source registration defaults', async () => {
  const [screen, registration, drawer, review] = await Promise.all([
    source('src/portal/admin/usuarios/AdminUsersScreen.tsx'),
    source('src/portal/admin/usuarios/AdminRegistrationDialog.tsx'),
    source('src/portal/admin/usuarios/AdminUserDetailDrawer.tsx'),
    source('src/portal/admin/usuarios/AdminApplicationReviewDialog.tsx'),
  ])
  assert.match(screen, /import \{ useDeferredValue, useEffect, useMemo, useState \}/)
  assert.match(screen, /const requestedTab = searchParams\.get\('tab'\)/)
  assert.match(screen, /useEffect\(\(\) => \{\s*const nextTab = tabIsValid\(requestedTab\) \? requestedTab : 'companies'/s)
  assert.match(screen, /setTab\(nextTab\)/)
  assert.match(screen, /setSearchParams\(\{ tab: nextTab \}, \{ replace: true \}\)/)
  assert.doesNotMatch(screen, /uniqueValues\(tourRows, '(estado|ciudad)'\)/)

  for (const relation of ['act-001', 'clu-serv', 'str-sas', 'tax-001']) assert.match(registration, new RegExp(`${relation}`))
  for (const label of ['Actividad económica', 'Cluster', 'Estructura societaria', 'Tipo de contribuyente', 'Sí', 'No']) assert.match(registration, new RegExp(label))
  assert.match(registration, /String\(item\.nombre\)/)
  assert.match(registration, /requiredCompanyRelations/)
  assert.match(registration, /isValidAdminEmail/)
  assert.match(registration, /<form[^>]*onSubmit=\{save\}>/)
  assert.match(registration, /checkValidity\(\)/)

  assert.match(drawer, /min-h-11 inline-flex items-center/)
  assert.match(review, /min-h-11 inline-flex items-center/)
  assert.match(review, /reasonRef\.current\?\.focus\(\)/)
})

test('ADMIN content, audit and security routes remain guarded, titled and outside the eight-item navigation', async () => {
  const [app, titles, catalogo] = await Promise.all([
    source('src/App.tsx'), source('src/titulos.ts'), source('src/portal/admin/catalogo.ts'),
  ])
  for (const [path, component, title] of [
    ['alertas-contenido', 'AdminContentScreen', 'Alertas y contenido SAFE'],
    ['incidencias-auditoria', 'AdminAuditScreen', 'Incidencias y auditoría SAFE'],
    ['alertas-seguridad', 'AdminSecurityAlertsScreen', 'Alertas de seguridad SAFE'],
  ]) {
    assert.match(app, new RegExp(component))
    assert.match(app, new RegExp(`path="admin/${path}"`))
    assert.match(app, new RegExp(`<RoleRoute allow=\\{\\['ADMIN'\\]\\}>\\s*<${component} \\/>` , 's'))
    assert.match(titles, new RegExp(`'/app/admin/${path}': '${title}'`))
  }
  assert.equal(Array.from(catalogo.matchAll(/label: '([^']+)'/g)).length, 8)
  assert.doesNotMatch(catalogo, /Alertas de seguridad/)
})

test('ADMIN content supports controlled communications and safe email templates', async () => {
  const [screen, communication, template] = await Promise.all([
    source('src/portal/admin/contenido/AdminContentScreen.tsx'),
    source('src/portal/admin/contenido/AdminCommunicationDialog.tsx'),
    source('src/portal/admin/contenido/AdminEmailTemplateDialog.tsx'),
  ])
  for (const item of [screen, communication, template]) assert.doesNotMatch(item, /Date\.now|new Date|localStorage|sessionStorage|dangerouslySetInnerHTML|replaceAll|style=|fetch\(|BrowserRouter/)
  for (const token of ['communications', 'templates', 'Comunicaciones activas', 'Programadas', 'Publicadas este mes', 'Borradores', 'Avisos', 'Cambios normativos', 'Noticias', 'Tutoriales', 'Banners', 'Correos masivos', 'downloadExcel', 'AdminDataTable', 'AdminTabs', 'AdminDialog']) assert.match(screen, new RegExp(token))
  assert.match(screen, /pageSize=\{7\}/)
  assert.match(screen, /removeEntity\(deleting\.key, deleting\.id\)/)
  assert.match(screen, /Confirmar eliminación/)
  for (const value of ['AVISO', 'CAMBIO_NORMATIVO', 'NOTICIA', 'TUTORIAL', 'BANNER', 'CORREO_MASIVO', 'TODOS', 'EMPRESA', 'COLABORADOR', 'ADMINISTRADOR', 'PORTAL', 'CORREO']) assert.match(communication, new RegExp(value))
  for (const requirement of ['crypto\.randomUUID\(\)', 'AHORA_ADMIN', 'role="alert"', 'checkValidity\(\)', 'PROGRAMADA', 'ACTIVA', 'BORRADOR']) assert.match(communication, new RegExp(requirement))
  assert.doesNotMatch(communication, /status: 'PUBLICADA'/)
  assert.match(communication, /upsertEntity\('communications'/)
  for (const value of ['USUARIO_CREADO', 'OBLIGACION_PROXIMA', 'POSTULACION_APROBADA', 'POSTULACION_RECHAZADA', 'MANTENIMIENTO', 'PAGO_CONFIRMADO', '{{nombre}}', '{{empresa}}', '{{fecha}}', '{{obligacion}}']) assert.match(template, new RegExp(value.replace(/[{}]/g, '\\$&')))
  assert.match(template, /replace\(\/\\{\\{nombre\\}\\}\/g/)
  assert.match(template, /upsertEntity\('emailTemplates'/)
  assert.match(template, /role="alert"/)
})

test('ADMIN audit and security screens filter, export and resolve through central audited mutations', async () => {
  const [audit, incident, security, alert] = await Promise.all([
    source('src/portal/admin/auditoria/AdminAuditScreen.tsx'),
    source('src/portal/admin/auditoria/AdminIncidentDrawer.tsx'),
    source('src/portal/admin/auditoria/AdminSecurityAlertsScreen.tsx'),
    source('src/portal/admin/auditoria/AdminSecurityAlertDrawer.tsx'),
  ])
  for (const item of [audit, incident, security, alert]) assert.doesNotMatch(item, /Date\.now|new Date|localStorage|sessionStorage|dangerouslySetInnerHTML|replaceAll|style=|fetch\(|BrowserRouter|upsertEntity\('audits'/)
  for (const value of ['incidents', 'logs', 'audits', 'Incidencias abiertas', 'Incidencias críticas', 'En proceso', 'Resueltas', 'downloadExcel', 'matchesQuery', 'uniqueValues', 'displayValue', 'pageSize={7}', 'AdminIncidentDrawer', '/app/admin/alertas-seguridad']) assert.match(audit, new RegExp(value.replace(/[{}]/g, '\\$&')))
  assert.match(audit, /titleCase\(row\.tabla_afectada\)/)
  assert.match(audit, /summarizeCambio/)
  assert.match(incident, /patchEntity\('incidents'/)
  assert.match(incident, /AHORA_ADMIN/)
  assert.match(incident, /estado: 'RESUELTA'/)
  for (const value of ['filterSecurity', 'downloadExcel', 'Gravedad', 'Estado', 'Tipo', 'pageSize={7}', 'AdminSecurityAlertDrawer', '/app/admin/incidencias-auditoria']) assert.match(security, new RegExp(value.replace(/[{}]/g, '\\$&')))
  assert.match(alert, /patchEntity\('securityAlerts'/)
  assert.match(alert, /estado: 'RESUELTA'/)
})

test('ADMIN content creates independently of edit selection and validates local fields before native validity', async () => {
  const [screen, communication, template, incident, security] = await Promise.all([
    source('src/portal/admin/contenido/AdminContentScreen.tsx'),
    source('src/portal/admin/contenido/AdminCommunicationDialog.tsx'),
    source('src/portal/admin/contenido/AdminEmailTemplateDialog.tsx'),
    source('src/portal/admin/auditoria/AdminIncidentDrawer.tsx'),
    source('src/portal/admin/auditoria/AdminSecurityAlertDrawer.tsx'),
  ])
  for (const state of ['communicationOpen', 'templateOpen']) assert.match(screen, new RegExp(`\\[${state}, set${state[0].toUpperCase()}${state.slice(1)}\\]`))
  assert.match(screen, /setEditingCommunication\(null\); setCommunicationOpen\(true\)/)
  assert.match(screen, /setEditingTemplate\(null\); setTemplateOpen\(true\)/)
  assert.match(screen, /setEditingCommunication\(row\); setCommunicationOpen\(true\)/)
  assert.match(screen, /setEditingTemplate\(row\); setTemplateOpen\(true\)/)
  assert.match(screen, /open=\{communicationOpen\}/)
  assert.match(screen, /open=\{templateOpen\}/)
  assert.match(communication, /if \(!form\.title\.trim\(\) \|\| !form\.description\.trim\(\)\).*checkValidity/s)
  assert.match(communication, /titleRef\.current\?\.focus\(\)/)
  assert.match(communication, /status: 'ACTIVA'.*'Publicada'|ACTIVA/s)
  assert.match(template, /if \(!form\.name\.trim\(\) \|\| !form\.subject\.trim\(\) \|\| !form\.body\.trim\(\)\).*checkValidity/s)
  assert.match(template, /nameRef\.current\?\.focus\(\)/)
  for (const dialog of [communication, template]) {
    assert.match(dialog, /const savingRef = useRef\(false\)/)
    assert.match(dialog, /savingRef\.current \|\| saving\) return/)
    assert.match(dialog, /savingRef\.current = true/)
    assert.match(dialog, /savingRef\.current = false/)
  }
  for (const drawer of [incident, security]) {
    assert.match(drawer, /const resolvingRef = useRef\(false\)/)
    assert.match(drawer, /resolvingRef\.current = true/)
    assert.match(drawer, /disabled=\{resolving\}/)
  }
})

test('ADMIN resolves tutorials and settings without changing shared role routes or titles', async () => {
  const [app, titles, catalogo, account] = await Promise.all([
    source('src/App.tsx'), source('src/titulos.ts'), source('src/portal/admin/catalogo.ts'), source('src/portal/components/AccountMenu.tsx'),
  ])
  const tutorials = blockAfter(app, 'function TutorialesResolver')
  const settings = blockAfter(app, 'function ConfiguracionResolver')
  assert.match(tutorials, /case 'EMPRESA': return <TutorialesScreen \/>/)
  assert.match(tutorials, /case 'COLABORADOR': return <CollaboratorTutorialsScreen \/>/)
  assert.match(tutorials, /case 'ADMIN': return <AdminTutorialsScreen \/>/)
  assert.match(settings, /case 'EMPRESA': return <ConfiguracionScreen \/>/)
  assert.match(settings, /case 'COLABORADOR': return <CollaboratorSettingsScreen \/>/)
  assert.match(settings, /case 'ADMIN': return <AdminSettingsScreen \/>/)
  assert.match(app, /AdminTutorialsScreen/)
  assert.match(app, /AdminSettingsScreen/)
  assert.match(app, /path="configuracion\/cuenta" element=\{<EditarCuentaScreen \/>\}/)
  assert.match(titles, /'\/app\/tutoriales': 'Video tutoriales SAFE'/)
  assert.match(titles, /'\/app\/configuracion': 'Configuración SAFE'/)
  assert.match(titles, /'\/app\/configuracion\/cuenta': 'Editar cuenta SAFE'/)
  assert.equal(Array.from(catalogo.matchAll(/label: '([^']+)'/g)).length, 8)
  assert.match(account, /\/app\/configuracion\/cuenta/)
})

test('ADMIN tutorial library preserves guarded CRUD, validation and accessible data workflows', async () => {
  const [screen, dialog] = await Promise.all([
    source('src/portal/admin/tutoriales/AdminTutorialsScreen.tsx'), source('src/portal/admin/tutoriales/AdminTutorialDialog.tsx'),
  ])
  for (const token of ['Tutoriales publicados', 'Visualizaciones', 'Audiencias', 'Miniatura', 'Título', 'Categoría', 'Duración', 'Estado', 'Acciones', 'matchesQuery', 'titulo', 'categoria', 'modulo', 'descripcion', 'downloadExcel', 'pageSize={7}', 'upsertEntity', 'AdminDialog', 'Confirmar eliminación']) assert.match(screen, new RegExp(token.replace(/[{}]/g, '\\$&')))
  assert.match(screen, /patchEntity\('tutorials'/)
  assert.match(screen, /removeEntity\('tutorials'/)
  for (const token of ['Título', 'Descripción', 'Módulo', 'Categoría', 'EMPRESA', 'COLABORADOR', 'ADMINISTRADOR', 'TODOS', 'BORRADOR', 'PUBLICADO', 'OCULTO', 'Duración', 'Orden', 'URL', 'Miniatura', 'Generar miniatura automáticamente', 'Notificar', 'crypto.randomUUID()', 'AHORA_ADMIN', 'role="alert"', 'Number.isFinite', 'duracion_segundos', 'orden_visualizacion', 'published_at']) assert.match(dialog, new RegExp(token.replace(/[(){}]/g, '\\$&')))
  assert.match(dialog, /url_video/)
  assert.match(dialog, /javascript:|data:/)
  for (const item of [screen, dialog]) assert.doesNotMatch(item, /Date\.now|new Date|localStorage|sessionStorage|fetch\(|dangerouslySetInnerHTML|replaceAll|style=|BrowserRouter/)
})

test('ADMIN settings keeps identity, security, SMTP and system fields in auditable accessible form', async () => {
  const settings = await source('src/portal/admin/configuracion/AdminSettingsScreen.tsx')
  for (const token of ['Identidad y localización', 'Seguridad', 'Notificaciones', 'Plantillas de correo', 'Información del sistema', 'platformName', 'Español', 'English', 'America/Guayaquil', 'America/Bogota', 'America/Lima', 'strongPasswords', 'twoFactorAdmin', 'sessionMinutes', 'maxFailedAttempts', 'smtpServer', 'sender', 'remindersEnabled', 'emailTemplates', 'pageSize={5}', '/app/admin/alertas-contenido?tab=templates', 'updateSettings', 'role="status"', 'aria-live="polite"', 'URL.createObjectURL', 'URL.revokeObjectURL', 'OPERATIVO']) assert.match(settings, new RegExp(token.replace(/[?{}()]/g, '\\$&')))
  assert.match(settings, /min="5"/)
  assert.match(settings, /min="1"/)
  assert.match(settings, /aria-pressed/)
  assert.match(settings, /min-h-11/)
  assert.match(settings, /role="alert"/)
  assert.match(settings, /replace\(\/_\/g, ' '\)/)
  assert.doesNotMatch(settings, /Date\.now|new Date|localStorage|sessionStorage|fetch\(|FileReader|base64|dangerouslySetInnerHTML|replaceAll|style=|BrowserRouter/)
})

test('ADMIN tutorial mutations are single-flight and never hide a draft', async () => {
  const [screen, dialog] = await Promise.all([
    source('src/portal/admin/tutoriales/AdminTutorialsScreen.tsx'), source('src/portal/admin/tutoriales/AdminTutorialDialog.tsx'),
  ])
  const toggle = blockAfter(screen, 'const toggle =')
  const remove = blockAfter(screen, 'const confirmDelete =')
  const save = blockAfter(dialog, 'const save =')
  const release = blockAfter(screen, 'const releaseSettledMutations =')
  assert.match(toggle, /\['PUBLICADO', 'OCULTO'\]\.includes\(tutorial\.estado\)/)
  assert.match(toggle, /togglingRef\.current\.has\(tutorial\.id\)/)
  assert.match(toggle, /togglingRef\.current\.add\(tutorial\.id\)/)
  assert.match(toggle, /patchEntity\('tutorials', tutorial\.id/)
  assert.doesNotMatch(toggle, /togglingRef\.current\.delete/)
  assert.match(screen, /row\.estado !== 'BORRADOR'/)
  assert.match(remove, /deletingRef\.current/)
  assert.match(remove, /removeEntity\('tutorials', deleting\.id\)/)
  assert.doesNotMatch(remove, /deletingRef\.current = false/)
  assert.match(screen, /useEffect\(\(\) => \{ releaseSettledMutations\(\) \}, \[data\.tutorials, deleting\]\)/)
  assert.match(release, /pendingToggleRef\.current\.get\(id\)/)
  assert.match(release, /item\.estado === expectedState/)
  assert.match(release, /!data\.tutorials\.some\(\(item\) => item\.id === pendingDeleteId\)/)
  assert.match(release, /deletingRef\.current = false/)
  assert.match(screen, /disabled=\{busyAction === row\.id \|\| deletingBusy\}/)
  assert.match(dialog, /const \[saving, setSaving\] = useState\(false\)/)
  assert.match(dialog, /const savingRef = useRef\(false\)/)
  assert.match(save, /savingRef\.current \|\| saving/)
  assert.match(save, /savingRef\.current = true/)
  assert.match(save, /setSaving\(true\)/)
  assert.match(dialog, /disabled=\{saving\}/)
})
