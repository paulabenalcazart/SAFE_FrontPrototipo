import { LegalPageLayout, LegalSection } from '@/components/LegalPageLayout'

export function TerminosPage() {
  return (
    <LegalPageLayout
      titulo="Términos y Condiciones"
      actualizado="5 de agosto de 2026"
      intro="Estos Términos y Condiciones regulan el acceso y uso de la plataforma SAFE. Al crear una cuenta o utilizar nuestros servicios, aceptas los términos descritos a continuación."
    >
      <LegalSection titulo="1. Aceptación de los términos">
        <p>
          Al registrarte, acceder o utilizar SAFE (en adelante, "la Plataforma") aceptas quedar
          vinculado por estos Términos y Condiciones y por nuestra Política de Privacidad. Si no
          estás de acuerdo con alguno de estos términos, no debes utilizar la Plataforma.
        </p>
      </LegalSection>

      <LegalSection titulo="2. Descripción del servicio">
        <p>
          SAFE es una plataforma que centraliza información financiera, contable y tributaria de
          pequeñas y medianas empresas (PYMEs) ecuatorianas, incluyendo el seguimiento de
          obligaciones ante el Servicio de Rentas Internas (SRI), reportes financieros,
          simuladores tributarios y un directorio de profesionales contables y legales.
        </p>
        <p>
          SAFE no es una firma de contabilidad, auditoría o asesoría legal, y la información
          generada dentro de la Plataforma tiene fines organizativos e informativos. Las
          declaraciones, cálculos y trámites ante entidades públicas siguen siendo
          responsabilidad de la empresa usuaria y/o del profesional contratado a través del
          Marketplace.
        </p>
      </LegalSection>

      <LegalSection titulo="3. Cuentas de usuario">
        <p>
          Para usar SAFE debes crear una cuenta con información verídica, completa y actualizada.
          Eres responsable de mantener la confidencialidad de tu contraseña y de toda actividad
          realizada bajo tu cuenta. Debes notificarnos de inmediato ante cualquier uso no
          autorizado.
        </p>
        <p>
          Las cuentas de tipo "Empresa" pueden invitar colaboradores y asignarles roles y permisos
          dentro de su organización; la empresa es responsable de gestionar dichos accesos.
        </p>
      </LegalSection>

      <LegalSection titulo="4. Planes, precios y facturación">
        <p>
          SAFE ofrece distintos planes de suscripción, cuyos precios y características se
          detallan en la sección de Planes de la Plataforma. Los pagos se procesan de forma
          recurrente según la periodicidad contratada. Los precios pueden actualizarse; te
          notificaremos con anticipación razonable ante cualquier cambio que afecte tu plan
          activo.
        </p>
      </LegalSection>

      <LegalSection titulo="5. Profesionales del Marketplace">
        <p>
          Los contadores, abogados y asesores que se postulan a través de "Trabaja con SAFE" pasan
          por un proceso de validación antes de ser publicados en el Marketplace. SAFE actúa como
          intermediario tecnológico; la relación de servicio profesional se establece directamente
          entre la empresa usuaria y el profesional seleccionado.
        </p>
      </LegalSection>

      <LegalSection titulo="6. Uso aceptable">
        <p>Al utilizar SAFE te comprometes a no:</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Utilizar la Plataforma para fines ilícitos o fraudulentos.</li>
          <li>Intentar acceder sin autorización a cuentas, sistemas o datos de terceros.</li>
          <li>Cargar información falsa, difamatoria o que infrinja derechos de terceros.</li>
          <li>
            Realizar ingeniería inversa, copiar o distribuir el software de la Plataforma sin
            autorización expresa.
          </li>
        </ul>
      </LegalSection>

      <LegalSection titulo="7. Propiedad intelectual">
        <p>
          El software, la marca SAFE, el diseño de la interfaz y los contenidos propios de la
          Plataforma son propiedad de SAFE o de sus licenciantes. Los datos que ingreses (registros
          financieros, documentos, información de tu empresa) siguen siendo de tu propiedad; SAFE
          únicamente los procesa para prestarte el servicio.
        </p>
      </LegalSection>

      <LegalSection titulo="8. Limitación de responsabilidad">
        <p>
          SAFE pone a tu disposición herramientas de organización y simulación financiera, pero no
          garantiza la exactitud absoluta de cálculos automatizados frente a cambios normativos del
          SRI u otras entidades. En la máxima medida permitida por la ley, SAFE no será responsable
          por daños indirectos, pérdida de datos o perjuicios derivados del uso o la imposibilidad
          de uso de la Plataforma.
        </p>
      </LegalSection>

      <LegalSection titulo="9. Suspensión y terminación">
        <p>
          Podemos suspender o cancelar tu cuenta si incumples estos Términos, por inactividad
          prolongada, o por requerimiento legal. Puedes cancelar tu cuenta en cualquier momento
          desde la configuración de tu perfil.
        </p>
      </LegalSection>

      <LegalSection titulo="10. Modificaciones a los términos">
        <p>
          Podemos actualizar estos Términos periódicamente. Publicaremos la versión vigente en esta
          página junto con la fecha de última actualización. El uso continuado de la Plataforma
          después de una modificación implica la aceptación de los nuevos términos.
        </p>
      </LegalSection>

      <LegalSection titulo="11. Ley aplicable y jurisdicción">
        <p>
          Estos Términos se rigen por las leyes de la República del Ecuador. Cualquier controversia
          derivada de su interpretación o cumplimiento se someterá a los jueces competentes del
          Ecuador, sin perjuicio de mecanismos de solución directa o mediación que las partes
          acuerden previamente.
        </p>
      </LegalSection>

      <LegalSection titulo="12. Contacto">
        <p>
          Si tienes preguntas sobre estos Términos y Condiciones, escríbenos a{' '}
          <a href="mailto:contacto@safe.ec" className="font-semibold text-navy-500 hover:underline">
            contacto@safe.ec
          </a>{' '}
          o visita nuestra sección de{' '}
          <span className="font-semibold text-navy-900">Contacto</span>.
        </p>
      </LegalSection>
    </LegalPageLayout>
  )
}
