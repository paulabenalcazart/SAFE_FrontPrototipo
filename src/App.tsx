import { useEffect, type ReactNode } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { Navbar } from './components/Navbar'
import { Hero } from './components/Hero'
import { ComoFuncionaSection } from './components/ComoFuncionaSection'
import { FeatureHighlightsSection } from './components/FeatureHighlightsSection'
import { ModulesSection } from './components/ModulesSection'
import { PlansSection } from './components/PlansSection'
import { PlanesPage } from './components/PlanesPage'
import { AcercaDePage } from './components/AcercaDePage'
import { ReasonsSection } from './components/ReasonsSection'
import { TrabajaConSafePage } from './components/TrabajaConSafePage'
import { PostulacionPage } from './components/PostulacionPage'
import { LoginPage } from './components/LoginPage'
import { ForgotPasswordPage } from './components/ForgotPasswordPage'
import { SignupPage } from './components/SignupPage'
import { ContactoPage } from './components/ContactoPage'
import { TerminosPage } from './components/TerminosPage'
import { PrivacidadPage } from './components/PrivacidadPage'
import { Footer } from './components/Footer'
import { useAuth, type AppRole, type AuthUser } from './auth/AuthContext'
import { RequireAuth } from './auth/RequireAuth'
import { PortalLayout } from './portal/PortalLayout'
import { PortalDataProvider } from './portal/PortalDataContext'
import { DashboardScreen } from './portal/dashboard/DashboardScreen'
import { CollaboratorDashboardScreen } from './portal/colaborador/dashboard/CollaboratorDashboardScreen'
import { EmpresaScreen } from './portal/empresa/EmpresaScreen'
import { EmpresaRegistrarScreen } from './portal/empresa/EmpresaRegistrarScreen'
import { EmpresaEditarScreen } from './portal/empresa/EmpresaEditarScreen'
import { FinancieroScreen } from './portal/financiero/FinancieroScreen'
import { NuevaCargaScreen } from './portal/financiero/NuevaCargaScreen'
import { DetalleRegistroScreen } from './portal/financiero/DetalleRegistroScreen'
import { CompararPeriodosScreen } from './portal/financiero/CompararPeriodosScreen'
import { IndicadoresScreen } from './portal/indicadores/IndicadoresScreen'
import { IndicadoresPrincipalesScreen } from './portal/indicadores/IndicadoresPrincipalesScreen'
import { TodosIndicadoresScreen } from './portal/indicadores/TodosIndicadoresScreen'
import { CompararIndicadoresScreen } from './portal/indicadores/CompararIndicadoresScreen'
import { ObligacionesScreen } from './portal/obligaciones/ObligacionesScreen'
import { DetalleObligacionScreen } from './portal/obligaciones/DetalleObligacionScreen'
import { SimuladorScreen } from './portal/simulador/SimuladorScreen'
import { DetalleSimulacionScreen } from './portal/simulador/DetalleSimulacionScreen'
import { MarketplaceScreen } from './portal/marketplace/MarketplaceScreen'
import { PerfilProfesionalScreen } from './portal/marketplace/PerfilProfesionalScreen'
import { PlanScreen } from './portal/plan/PlanScreen'
import { AdministrarSuscripcionScreen } from './portal/plan/AdministrarSuscripcionScreen'
import { CambiarPlanScreen } from './portal/plan/CambiarPlanScreen'
import { MetodosPagoScreen } from './portal/plan/MetodosPagoScreen'
import { HistorialPagosScreen } from './portal/plan/HistorialPagosScreen'
import { ConfiguracionScreen } from './portal/configuracion/ConfiguracionScreen'
import { EditarCuentaScreen } from './portal/configuracion/EditarCuentaScreen'
import { CollaboratorSettingsScreen } from './portal/colaborador/configuracion/CollaboratorSettingsScreen'
import { TutorialesScreen } from './portal/tutoriales/TutorialesScreen'
import { CollaboratorTutorialsScreen } from './portal/colaborador/tutoriales/CollaboratorTutorialsScreen'
import { PerfilColaboradorScreen } from './portal/colaborador/perfil/PerfilColaboradorScreen'
import { EditarPerfilScreen } from './portal/colaborador/perfil/EditarPerfilScreen'
import { VistaPreviaPerfilScreen } from './portal/colaborador/perfil/VistaPreviaPerfilScreen'
import { TodasLasResenasScreen } from './portal/colaborador/perfil/TodasLasResenasScreen'
import { SolicitudesScreen } from './portal/colaborador/solicitudes/SolicitudesScreen'
import { NotificacionesScreen } from './portal/components/NotificacionesScreen'
import { AlertasScreen } from './portal/components/AlertasScreen'
import { tituloParaRuta } from './titulos'
import { ADMIN_DEMO_EMAIL, ADMIN_DEMO_USER } from './portal/admin/catalogo'
import { assertNever } from './portal/navigation'

import { AdminDataBoundary } from './portal/admin/AdminDataBoundary'
import { AdminDashboardScreen } from './portal/admin/dashboard/AdminDashboardScreen'
import { AdminUsersScreen } from './portal/admin/usuarios/AdminUsersScreen'
import { AdminParametersScreen } from './portal/admin/parametros/AdminParametersScreen'
import { AdminPlansScreen } from './portal/admin/planes/AdminPlansScreen'
import { AdminContentScreen } from './portal/admin/contenido/AdminContentScreen'
import { AdminAuditScreen } from './portal/admin/auditoria/AdminAuditScreen'
import { AdminSecurityAlertsScreen } from './portal/admin/auditoria/AdminSecurityAlertsScreen'
import { AdminTutorialsScreen } from './portal/admin/tutoriales/AdminTutorialsScreen'
import { AdminSettingsScreen } from './portal/admin/configuracion/AdminSettingsScreen'
import { AdminEditAccountScreen } from './portal/admin/configuracion/AdminEditAccountScreen'

export const NAV_KEY_TO_PATH: Record<string, string> = {
  inicio: '/',
  como: '/como-funciona',
  planes: '/planes',
  acerca: '/acerca',
  trabaja: '/trabaja-con-safe',
  postulacion: '/postulacion',
  login: '/login',
  recuperar: '/recuperar',
  signup: '/signup',
  contacto: '/contacto',
  terminos: '/terminos',
  privacidad: '/privacidad',
}

const PATH_TO_NAV_KEY: Record<string, string> = Object.fromEntries(
  Object.entries(NAV_KEY_TO_PATH).map(([key, path]) => [path, key]),
)

const CORREO_COLABORADOR_DEMO = 'maria.lopez@safe-demo.ec'

function DocumentTitle() {
  const location = useLocation()

  useEffect(() => {
    document.title = tituloParaRuta(location.pathname)
  }, [location.pathname])

  return null
}

const usuarioEmpresaDemo: AuthUser = {
  role: 'EMPRESA',
  nombres: 'María Fernanda',
  apellidos: 'Torres',
  correo: 'maria.torres@textilesandina.ec',
  telefono: '+593 99 812 4410',
  pais: 'Ecuador',
  ciudad: 'Quito',
  iniciales: 'MT',
  mfaHabilitado: false,
}

const usuarioColaboradorDemo: AuthUser = {
  role: 'COLABORADOR',
  nombres: 'María Fernanda',
  apellidos: 'López Goncalves',
  correo: CORREO_COLABORADOR_DEMO,
  telefono: '+593 99 920 0113',
  pais: 'Ecuador',
  ciudad: 'Guayaquil',
  iniciales: 'ML',
  mfaHabilitado: false,
  colaboradorId: 'col-mfl',
}

function RoleRoute({ allow, children }: { allow: AppRole[]; children: ReactNode }) {
  const { user } = useAuth()
  if (!user || !allow.includes(user.role)) return <Navigate to="/app/dashboard" replace />
  return <>{children}</>
}

function DashboardResolver() {
  const { user } = useAuth()
  const role = user?.role
  switch (role) {
    case 'EMPRESA': return <DashboardScreen />
    case 'COLABORADOR': return <CollaboratorDashboardScreen />
    case 'ADMIN': return <AdminDashboardScreen />
    case undefined: return null
    default: return assertNever(role)
  }
}

function TutorialesResolver() {
  const { user } = useAuth()
  const role = user?.role
  switch (role) {
    case 'EMPRESA': return <TutorialesScreen />
    case 'COLABORADOR': return <CollaboratorTutorialsScreen />
    case 'ADMIN': return <AdminTutorialsScreen />
    case undefined: return null
    default: return assertNever(role)
  }
}

function ConfiguracionResolver() {
  const { user } = useAuth()
  const role = user?.role
  switch (role) {
    case 'EMPRESA': return <ConfiguracionScreen />
    case 'COLABORADOR': return <CollaboratorSettingsScreen />
    case 'ADMIN': return <AdminSettingsScreen />
    case undefined: return null
    default: return assertNever(role)
  }
}

function EditarCuentaResolver() {
  const { user } = useAuth()
  return user?.role === 'ADMIN' ? <AdminEditAccountScreen /> : <EditarCuentaScreen />
}

function PortalProviderByRole({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const role = user?.role
  switch (role) {
    case 'EMPRESA':
    case 'COLABORADOR':
      return <PortalDataProvider>{children}</PortalDataProvider>
    case 'ADMIN':
      return <AdminDataBoundary>{children}</AdminDataBoundary>
    case undefined:
      return null
    default:
      return assertNever(role)
  }
}

function PublicLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { login } = useAuth()
  const activePage = PATH_TO_NAV_KEY[location.pathname] ?? 'inicio'
  const isAuthPage = activePage === 'login' || activePage === 'recuperar' || activePage === 'signup'

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  const handleNavigate = (key: string) => {
    const path = NAV_KEY_TO_PATH[key]
    if (path) navigate(path)
  }

  const goToPlanes = () => handleNavigate('planes')
  const goToPostulacion = () => handleNavigate('postulacion')

  function loginDemo(correoTipeado: string) {
    const correoNormalizado = correoTipeado.trim().toLowerCase()
    if (correoNormalizado === ADMIN_DEMO_EMAIL) login(ADMIN_DEMO_USER)
    else if (correoNormalizado === CORREO_COLABORADOR_DEMO) login(usuarioColaboradorDemo)
    else login(usuarioEmpresaDemo)
    navigate('/app/dashboard')
  }

  function signupEmpresaDemo(_correoTipeado: string) {
    login(usuarioEmpresaDemo)
    navigate('/app/dashboard')
  }

  return (
    <div className="min-h-screen bg-white font-sans text-foreground">
      {!isAuthPage && <Navbar activePage={activePage} onNavigate={handleNavigate} />}
      <Routes>
        <Route
          path="/"
          element={
            <>
              <Hero onVerPlanes={goToPlanes} />
              <div className="view-tint relative">
                <FeatureHighlightsSection />
                <ModulesSection />
                <PlansSection onVerPlanes={goToPlanes} />
                <ReasonsSection />
              </div>
            </>
          }
        />
        <Route path="/como-funciona" element={<ComoFuncionaSection />} />
        <Route path="/planes" element={<PlanesPage />} />
        <Route path="/acerca" element={<AcercaDePage />} />
        <Route path="/trabaja-con-safe" element={<TrabajaConSafePage onPostular={goToPostulacion} />} />
        <Route
          path="/postulacion"
          element={
            <PostulacionPage
              onVolver={() => handleNavigate('inicio')}
              onIrPrivacidad={() => handleNavigate('privacidad')}
            />
          }
        />
        <Route
          path="/contacto"
          element={<ContactoPage onIrPrivacidad={() => handleNavigate('privacidad')} />}
        />
        <Route path="/terminos" element={<TerminosPage />} />
        <Route path="/privacidad" element={<PrivacidadPage />} />
        <Route
          path="/login"
          element={
            <LoginPage
              onIngresar={loginDemo}
              onRecuperar={() => handleNavigate('recuperar')}
              onIrInicio={() => handleNavigate('inicio')}
              onIrCrearCuenta={() => handleNavigate('signup')}
            />
          }
        />
        <Route
          path="/recuperar"
          element={
            <ForgotPasswordPage
              onVolver={() => handleNavigate('login')}
              onIrInicio={() => handleNavigate('inicio')}
            />
          }
        />
        <Route
          path="/signup"
          element={
            <SignupPage
              onCrearCuenta={signupEmpresaDemo}
              onIrLogin={() => handleNavigate('login')}
              onIrInicio={() => handleNavigate('inicio')}
              onIrTerminos={() => handleNavigate('terminos')}
              onIrPrivacidad={() => handleNavigate('privacidad')}
            />
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {!isAuthPage && <Footer onNavigate={handleNavigate} />}
    </div>
  )
}

export default function App() {
  return (
    <>
      <DocumentTitle />
      <Routes>
      <Route
        path="/app"
        element={
          <RequireAuth>
            <PortalProviderByRole>
              <PortalLayout />
            </PortalProviderByRole>
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<DashboardResolver />} />
        <Route
          path="admin/usuarios"
          element={
            <RoleRoute allow={['ADMIN']}>
              <AdminUsersScreen />
            </RoleRoute>
          }
        />
        <Route path="admin/parametros" element={<RoleRoute allow={['ADMIN']}><AdminParametersScreen /></RoleRoute>} />
        <Route path="admin/planes-permisos" element={<RoleRoute allow={['ADMIN']}><AdminPlansScreen /></RoleRoute>} />
        <Route path="admin/alertas-contenido" element={<RoleRoute allow={['ADMIN']}><AdminContentScreen /></RoleRoute>} />
        <Route path="admin/incidencias-auditoria" element={<RoleRoute allow={['ADMIN']}><AdminAuditScreen /></RoleRoute>} />
        <Route path="admin/alertas-seguridad" element={<RoleRoute allow={['ADMIN']}><AdminSecurityAlertsScreen /></RoleRoute>} />
        <Route
          path="perfil"
          element={
            <RoleRoute allow={['COLABORADOR']}>
              <PerfilColaboradorScreen />
            </RoleRoute>
          }
        />
        <Route
          path="perfil/editar"
          element={
            <RoleRoute allow={['COLABORADOR']}>
              <EditarPerfilScreen />
            </RoleRoute>
          }
        />
        <Route
          path="perfil/vista-previa"
          element={
            <RoleRoute allow={['COLABORADOR']}>
              <VistaPreviaPerfilScreen />
            </RoleRoute>
          }
        />
        <Route
          path="perfil/resenas"
          element={
            <RoleRoute allow={['COLABORADOR']}>
              <TodasLasResenasScreen />
            </RoleRoute>
          }
        />
        <Route
          path="solicitudes"
          element={
            <RoleRoute allow={['COLABORADOR']}>
              <SolicitudesScreen />
            </RoleRoute>
          }
        />
        <Route
          path="solicitudes/:solicitudId"
          element={
            <RoleRoute allow={['COLABORADOR']}>
              <SolicitudesScreen />
            </RoleRoute>
          }
        />
        <Route
          path="notificaciones"
          element={
            <RoleRoute allow={['EMPRESA', 'COLABORADOR']}>
              <NotificacionesScreen />
            </RoleRoute>
          }
        />
        <Route
          path="alertas"
          element={
            <RoleRoute allow={['EMPRESA']}>
              <AlertasScreen />
            </RoleRoute>
          }
        />
        <Route
          path="empresa"
          element={
            <RoleRoute allow={['EMPRESA']}>
              <EmpresaScreen />
            </RoleRoute>
          }
        />
        <Route
          path="empresa/registrar"
          element={
            <RoleRoute allow={['EMPRESA']}>
              <EmpresaRegistrarScreen />
            </RoleRoute>
          }
        />
        <Route
          path="empresa/editar"
          element={
            <RoleRoute allow={['EMPRESA']}>
              <EmpresaEditarScreen />
            </RoleRoute>
          }
        />
        <Route
          path="financiero"
          element={
            <RoleRoute allow={['EMPRESA']}>
              <FinancieroScreen />
            </RoleRoute>
          }
        />
        <Route
          path="financiero/nuevo"
          element={
            <RoleRoute allow={['EMPRESA']}>
              <NuevaCargaScreen />
            </RoleRoute>
          }
        />
        <Route
          path="financiero/comparar"
          element={
            <RoleRoute allow={['EMPRESA']}>
              <CompararPeriodosScreen />
            </RoleRoute>
          }
        />
        <Route
          path="financiero/:id/editar"
          element={
            <RoleRoute allow={['EMPRESA']}>
              <NuevaCargaScreen />
            </RoleRoute>
          }
        />
        <Route
          path="financiero/:id"
          element={
            <RoleRoute allow={['EMPRESA']}>
              <DetalleRegistroScreen />
            </RoleRoute>
          }
        />
        <Route
          path="indicadores"
          element={
            <RoleRoute allow={['EMPRESA']}>
              <IndicadoresScreen />
            </RoleRoute>
          }
        />
        <Route
          path="indicadores/principales"
          element={
            <RoleRoute allow={['EMPRESA']}>
              <IndicadoresPrincipalesScreen />
            </RoleRoute>
          }
        />
        <Route
          path="indicadores/todos"
          element={
            <RoleRoute allow={['EMPRESA']}>
              <TodosIndicadoresScreen />
            </RoleRoute>
          }
        />
        <Route
          path="indicadores/comparar"
          element={
            <RoleRoute allow={['EMPRESA']}>
              <CompararIndicadoresScreen />
            </RoleRoute>
          }
        />
        <Route
          path="obligaciones"
          element={
            <RoleRoute allow={['EMPRESA']}>
              <ObligacionesScreen />
            </RoleRoute>
          }
        />
        <Route
          path="obligaciones/:id"
          element={
            <RoleRoute allow={['EMPRESA']}>
              <DetalleObligacionScreen />
            </RoleRoute>
          }
        />
        <Route
          path="simulador"
          element={
            <RoleRoute allow={['EMPRESA']}>
              <SimuladorScreen />
            </RoleRoute>
          }
        />
        <Route
          path="simulador/:id"
          element={
            <RoleRoute allow={['EMPRESA']}>
              <DetalleSimulacionScreen />
            </RoleRoute>
          }
        />
        <Route
          path="marketplace"
          element={
            <RoleRoute allow={['EMPRESA']}>
              <MarketplaceScreen />
            </RoleRoute>
          }
        />
        <Route
          path="marketplace/:id"
          element={
            <RoleRoute allow={['EMPRESA']}>
              <PerfilProfesionalScreen />
            </RoleRoute>
          }
        />
        <Route
          path="plan"
          element={
            <RoleRoute allow={['EMPRESA']}>
              <PlanScreen />
            </RoleRoute>
          }
        />
        <Route
          path="plan/suscripcion"
          element={
            <RoleRoute allow={['EMPRESA']}>
              <AdministrarSuscripcionScreen />
            </RoleRoute>
          }
        />
        <Route
          path="plan/cambiar"
          element={
            <RoleRoute allow={['EMPRESA']}>
              <CambiarPlanScreen />
            </RoleRoute>
          }
        />
        <Route
          path="plan/metodos-pago"
          element={
            <RoleRoute allow={['EMPRESA']}>
              <MetodosPagoScreen />
            </RoleRoute>
          }
        />
        <Route
          path="plan/historial-pagos"
          element={
            <RoleRoute allow={['EMPRESA']}>
              <HistorialPagosScreen />
            </RoleRoute>
          }
        />
        <Route path="configuracion" element={<ConfiguracionResolver />} />
        <Route path="configuracion/cuenta" element={<EditarCuentaResolver />} />
        <Route path="tutoriales" element={<TutorialesResolver />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Route>
      <Route path="/*" element={<PublicLayout />} />
      </Routes>
    </>
  )
}
