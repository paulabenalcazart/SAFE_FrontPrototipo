import { Globe, Mail, MessageCircle } from 'lucide-react'

const columnas = [
  {
    titulo: 'Producto',
    enlaces: ['¿Cómo funciona?', 'Planes'],
  },
  {
    titulo: 'Empresa',
    enlaces: ['Acerca de', 'Trabaja con SAFE'],
  },
  {
    titulo: 'Soporte',
    enlaces: ['Preguntas frecuentes', 'Contacto'],
  },
]

export function Footer() {
  return (
    <footer className="border-t border-line bg-white px-6 pb-6 pt-12 sm:px-8">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <span className="font-display text-xl font-extrabold text-navy-900">SAFE</span>
          <p className="mt-3 max-w-[260px] text-[13px] leading-relaxed text-ink-700">
            La plataforma que ayuda a las PYMEs ecuatorianas a gestionar sus finanzas, impuestos y
            trámites legales en un solo lugar.
          </p>
          <div className="mt-4 flex gap-3 text-ink-500">
            <a href="#" aria-label="Sitio web" className="transition-colors hover:text-navy-700">
              <Globe className="h-[18px] w-[18px]" />
            </a>
            <a href="#" aria-label="Correo" className="transition-colors hover:text-navy-700">
              <Mail className="h-[18px] w-[18px]" />
            </a>
            <a href="#" aria-label="Chat" className="transition-colors hover:text-navy-700">
              <MessageCircle className="h-[18px] w-[18px]" />
            </a>
          </div>
        </div>

        {columnas.map((col) => (
          <div key={col.titulo}>
            <h3 className="text-sm font-semibold text-ink-900">{col.titulo}</h3>
            <ul className="mt-4 space-y-3">
              {col.enlaces.map((enlace) => (
                <li key={enlace}>
                  <a
                    href="#"
                    className="text-sm text-ink-700 transition-colors hover:text-navy-700"
                  >
                    {enlace}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mx-auto mt-10 flex max-w-6xl flex-wrap items-center justify-between gap-2 border-t border-line pt-6 text-xs text-ink-500">
        <span>© 2026 SAFE. Todos los derechos reservados.</span>
        <span>Quito, Ecuador</span>
      </div>
    </footer>
  )
}
