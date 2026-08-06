import { useEffect, useState } from 'react'
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

type Page =
  | 'inicio'
  | 'como'
  | 'planes'
  | 'acerca'
  | 'trabaja'
  | 'postulacion'
  | 'login'
  | 'recuperar'
  | 'signup'
  | 'contacto'
  | 'terminos'
  | 'privacidad'

const PAGES: Page[] = [
  'inicio',
  'como',
  'planes',
  'acerca',
  'trabaja',
  'postulacion',
  'login',
  'recuperar',
  'signup',
  'contacto',
  'terminos',
  'privacidad',
]

export default function App() {
  const [page, setPage] = useState<Page>('inicio')

  const handleNavigate = (key: string) => {
    if (!PAGES.includes(key as Page)) return
    setPage(key as Page)
  }

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [page])

  const goToPlanes = () => handleNavigate('planes')
  const goToPostulacion = () => handleNavigate('postulacion')
  const isAuthPage = page === 'login' || page === 'recuperar' || page === 'signup'

  return (
    <div className="min-h-screen bg-white font-sans text-foreground">
      {!isAuthPage && <Navbar activePage={page} onNavigate={handleNavigate} />}
      {page === 'inicio' && (
        <>
          <Hero onVerPlanes={goToPlanes} />
          <div className="view-tint relative">
            <FeatureHighlightsSection />
            <ModulesSection />
            <PlansSection onVerPlanes={goToPlanes} />
            <ReasonsSection />
          </div>
        </>
      )}
      {page === 'como' && <ComoFuncionaSection />}
      {page === 'planes' && <PlanesPage />}
      {page === 'acerca' && <AcercaDePage />}
      {page === 'trabaja' && <TrabajaConSafePage onPostular={goToPostulacion} />}
      {page === 'contacto' && (
        <ContactoPage onIrPrivacidad={() => handleNavigate('privacidad')} />
      )}
      {page === 'terminos' && <TerminosPage />}
      {page === 'privacidad' && <PrivacidadPage />}
      {page === 'postulacion' && (
        <PostulacionPage
          onVolver={() => handleNavigate('inicio')}
          onIrPrivacidad={() => handleNavigate('privacidad')}
        />
      )}
      {page === 'login' && (
        <LoginPage
          onIngresar={() => handleNavigate('inicio')}
          onRecuperar={() => handleNavigate('recuperar')}
          onIrInicio={() => handleNavigate('inicio')}
          onIrCrearCuenta={() => handleNavigate('signup')}
        />
      )}
      {page === 'recuperar' && (
        <ForgotPasswordPage
          onVolver={() => handleNavigate('login')}
          onIrInicio={() => handleNavigate('inicio')}
        />
      )}
      {page === 'signup' && (
        <SignupPage
          onCrearCuenta={() => handleNavigate('inicio')}
          onIrLogin={() => handleNavigate('login')}
          onIrInicio={() => handleNavigate('inicio')}
          onIrTerminos={() => handleNavigate('terminos')}
          onIrPrivacidad={() => handleNavigate('privacidad')}
        />
      )}
      {!isAuthPage && <Footer onNavigate={handleNavigate} />}
    </div>
  )
}
