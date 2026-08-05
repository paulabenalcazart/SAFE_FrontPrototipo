import { useState } from 'react'
import { Navbar } from './components/Navbar'
import { Hero } from './components/Hero'
import { ComoFuncionaSection } from './components/ComoFuncionaSection'
import { FeatureHighlightsSection } from './components/FeatureHighlightsSection'
import { ModulesSection } from './components/ModulesSection'
import { PlansSection } from './components/PlansSection'
import { ReasonsSection } from './components/ReasonsSection'
import { FinalCtaSection } from './components/FinalCtaSection'
import { Footer } from './components/Footer'

type Page = 'inicio' | 'como'

export default function App() {
  const [page, setPage] = useState<Page>('inicio')

  const handleNavigate = (key: string) => {
    if (key !== 'inicio' && key !== 'como') return
    setPage(key)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-white font-sans text-foreground">
      <Navbar activePage={page} onNavigate={handleNavigate} />
      {page === 'inicio' ? (
        <>
          <Hero />
          <FeatureHighlightsSection />
          <ModulesSection />
          <PlansSection />
          <ReasonsSection />
          <FinalCtaSection />
        </>
      ) : (
        <>
          <ComoFuncionaSection />
          <FinalCtaSection />
        </>
      )}
      <Footer />
    </div>
  )
}
