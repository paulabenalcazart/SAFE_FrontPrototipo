import { useEffect } from 'react'
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
import { useAuth } from './auth/AuthContext'
import { RequireAuth } from './auth/RequireAuth'
import { PortalLayout } from './portal/PortalLayout'
import { PortalDataProvider } from './portal/PortalDataContext'
import { DashboardScreen } from './portal/dashboard/DashboardScreen'
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
              onIngresar={() => {
                login({ nombre: 'María Fernanda Torres', correo: 'maria.torres@textilesandina.ec', iniciales: 'MT' })
                navigate('/app/dashboard')
              }}
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
              onCrearCuenta={() => {
                login({ nombre: 'María Fernanda Torres', correo: 'maria.torres@textilesandina.ec', iniciales: 'MT' })
                navigate('/app/dashboard')
              }}
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
    <Routes>
      <Route
        path="/app"
        element={
          <RequireAuth>
            <PortalDataProvider>
              <PortalLayout />
            </PortalDataProvider>
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<DashboardScreen />} />
        <Route path="empresa" element={<EmpresaScreen />} />
        <Route path="empresa/registrar" element={<EmpresaRegistrarScreen />} />
        <Route path="empresa/editar" element={<EmpresaEditarScreen />} />
        <Route path="financiero" element={<FinancieroScreen />} />
        <Route path="financiero/nuevo" element={<NuevaCargaScreen />} />
        <Route path="financiero/comparar" element={<CompararPeriodosScreen />} />
        <Route path="financiero/:id/editar" element={<NuevaCargaScreen />} />
        <Route path="financiero/:id" element={<DetalleRegistroScreen />} />
        <Route path="indicadores" element={<IndicadoresScreen />} />
        <Route path="indicadores/principales" element={<IndicadoresPrincipalesScreen />} />
        <Route path="indicadores/todos" element={<TodosIndicadoresScreen />} />
        <Route path="indicadores/comparar" element={<CompararIndicadoresScreen />} />
        <Route path="obligaciones" element={<ObligacionesScreen />} />
        <Route path="obligaciones/:id" element={<DetalleObligacionScreen />} />
        <Route path="simulador" element={<SimuladorScreen />} />
        <Route path="simulador/:id" element={<DetalleSimulacionScreen />} />
        <Route path="marketplace" element={<MarketplaceScreen />} />
        <Route path="marketplace/:id" element={<PerfilProfesionalScreen />} />
        <Route path="plan" element={<PlanScreen />} />
        <Route path="plan/suscripcion" element={<AdministrarSuscripcionScreen />} />
        <Route path="plan/cambiar" element={<CambiarPlanScreen />} />
        <Route path="plan/metodos-pago" element={<MetodosPagoScreen />} />
        <Route path="plan/historial-pagos" element={<HistorialPagosScreen />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Route>
      <Route path="/*" element={<PublicLayout />} />
    </Routes>
  )
}
