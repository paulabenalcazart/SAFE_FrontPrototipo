import { useState } from 'react'
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
import { Footer } from './components/Footer'

type Page = 'inicio' | 'como' | 'planes' | 'acerca' | 'trabaja' | 'postulacion'

const PAGES: Page[] = ['inicio', 'como', 'planes', 'acerca', 'trabaja', 'postulacion']

export default function App() {
  const [page, setPage] = useState<Page>('inicio')

  const handleNavigate = (key: string) => {
    if (!PAGES.includes(key as Page)) return
    setPage(key as Page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const goToPlanes = () => handleNavigate('planes')
  const goToPostulacion = () => handleNavigate('postulacion')

  return (
    <div className="min-h-screen bg-white font-sans text-foreground">
      <Navbar activePage={page} onNavigate={handleNavigate} />
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
      {page === 'postulacion' && <PostulacionPage onVolver={() => handleNavigate('inicio')} />}
      <Footer onNavigate={handleNavigate} />
    </div>
  )
}
