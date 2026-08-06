import { FacebookIcon, InstagramIcon, LinkedinIcon, YoutubeIcon } from '@/components/SocialIcons'

const columnas = [
  {
    titulo: 'Producto',
    enlaces: ['¿Cómo funciona?', 'Planes'],
  },
  {
    titulo: 'Empresa',
    enlaces: ['Acerca de', 'Trabaja con SAFE', 'Términos y condiciones', 'Política de privacidad'],
  },
  {
    titulo: 'Soporte',
    enlaces: ['Preguntas frecuentes', 'Contacto'],
  },
]

const ENLACE_PAGE: Record<string, string> = {
  '¿Cómo funciona?': 'como',
  Planes: 'planes',
  'Acerca de': 'acerca',
  'Trabaja con SAFE': 'trabaja',
  Contacto: 'contacto',
  'Términos y condiciones': 'terminos',
  'Política de privacidad': 'privacidad',
}

export function Footer({ onNavigate }: { onNavigate?: (key: string) => void }) {
  return (
    <footer className="relative overflow-hidden bg-navy-900 px-6 pb-6 pt-12 sm:px-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: 'radial-gradient(white 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          maskImage: 'radial-gradient(60% 100% at 50% 0%, black 0%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(60% 100% at 50% 0%, black 0%, transparent 75%)',
        }}
      />

      <div className="relative mx-auto grid max-w-6xl grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <span className="font-display text-xl font-extrabold text-white">SAFE</span>
          <p className="mt-3 max-w-[260px] text-[13px] leading-relaxed text-navy-100/70">
            La plataforma que ayuda a las PYMEs ecuatorianas a gestionar sus finanzas, impuestos y
            trámites legales en un solo lugar.
          </p>
          <div className="mt-4 flex gap-3 text-navy-100/60">
            <a href="#" aria-label="Instagram" className="transition-colors hover:text-white">
              <InstagramIcon className="h-[18px] w-[18px]" />
            </a>
            <a href="#" aria-label="LinkedIn" className="transition-colors hover:text-white">
              <LinkedinIcon className="h-[18px] w-[18px]" />
            </a>
            <a href="#" aria-label="Facebook" className="transition-colors hover:text-white">
              <FacebookIcon className="h-[18px] w-[18px]" />
            </a>
            <a href="#" aria-label="YouTube" className="transition-colors hover:text-white">
              <YoutubeIcon className="h-[18px] w-[18px]" />
            </a>
          </div>
        </div>

        {columnas.map((col) => (
          <div key={col.titulo}>
            <h3 className="text-sm font-semibold text-white">{col.titulo}</h3>
            <ul className="mt-4 space-y-3">
              {col.enlaces.map((enlace) => {
                const pageKey = ENLACE_PAGE[enlace]
                return (
                  <li key={enlace}>
                    <a
                      href="#"
                      onClick={
                        pageKey
                          ? (e) => {
                              e.preventDefault()
                              onNavigate?.(pageKey)
                            }
                          : undefined
                      }
                      className="text-sm text-navy-100/70 transition-colors hover:text-white"
                    >
                      {enlace}
                    </a>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </div>

      <div className="relative mx-auto mt-10 flex max-w-6xl flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-6 text-xs text-navy-100/50">
        <span>© 2026 SAFE. Todos los derechos reservados.</span>
        <span>Samborondón, Ecuador</span>
      </div>
    </footer>
  )
}
