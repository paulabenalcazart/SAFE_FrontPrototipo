import { LegalPageLayout, LegalSection } from '@/components/LegalPageLayout'

export function PrivacidadPage() {
  return (
    <LegalPageLayout
      titulo="Política de Privacidad"
      actualizado="5 de agosto de 2026"
      intro="En SAFE protegemos la información de nuestros usuarios y de sus empresas. Esta Política describe qué datos recopilamos, para qué los usamos y cuáles son tus derechos, en cumplimiento con la Ley Orgánica de Protección de Datos Personales (LOPDP) del Ecuador."
    >
      <LegalSection titulo="1. Responsable del tratamiento">
        <p>
          SAFE es el responsable del tratamiento de los datos personales que recopila a través de
          la Plataforma. Para cualquier consulta relacionada con esta Política o con el tratamiento
          de tus datos, puedes escribirnos a{' '}
          <a href="mailto:contacto@safe.ec" className="font-semibold text-navy-500 hover:underline">
            contacto@safe.ec
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection titulo="2. Datos que recopilamos">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            <span className="font-semibold text-ink-900">Datos de identificación:</span> nombres,
            apellidos, correo electrónico, teléfono y, en el caso de profesionales, hoja de vida y
            documentos de validación profesional.
          </li>
          <li>
            <span className="font-semibold text-ink-900">Datos de la empresa:</span> razón social,
            RUC, régimen tributario y demás información necesaria para el seguimiento financiero y
            de obligaciones ante el SRI.
          </li>
          <li>
            <span className="font-semibold text-ink-900">Datos financieros y contables:</span> la
            información que ingresas o cargas para generar reportes, indicadores y simulaciones
            dentro de la Plataforma.
          </li>
          <li>
            <span className="font-semibold text-ink-900">Datos de uso:</span> registros de acceso,
            interacciones dentro de la Plataforma y datos técnicos del dispositivo/navegador.
          </li>
        </ul>
      </LegalSection>

      <LegalSection titulo="3. Finalidades del tratamiento">
        <p>Utilizamos tus datos personales para:</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Crear y administrar tu cuenta y la de tu empresa dentro de la Plataforma.</li>
          <li>
            Procesar y mostrar tu información financiera, tributaria y de cumplimiento de forma
            organizada.
          </li>
          <li>Conectar a tu empresa con profesionales del Marketplace de SAFE.</li>
          <li>Gestionar pagos, planes de suscripción y facturación.</li>
          <li>
            Enviarte comunicaciones relacionadas con el servicio, alertas de fechas del SRI y, si
            lo autorizas, comunicaciones de valor o novedades del producto.
          </li>
          <li>Cumplir con obligaciones legales y atender requerimientos de autoridades competentes.</li>
        </ul>
      </LegalSection>

      <LegalSection titulo="4. Base legal y consentimiento">
        <p>
          El tratamiento de tus datos se basa en tu consentimiento libre, específico, informado e
          inequívoco, otorgado al crear tu cuenta o al enviarnos información a través de nuestros
          formularios (por ejemplo, en Contacto, Crear cuenta o Trabaja con SAFE), así como en la
          necesidad de ejecutar el contrato de servicio que aceptas al usar SAFE y en el
          cumplimiento de obligaciones legales aplicables.
        </p>
      </LegalSection>

      <LegalSection id="tratamiento-datos" titulo="5. Tratamiento de Datos Personales">
        <p>
          De conformidad con la Ley Orgánica de Protección de Datos Personales (LOPDP) del
          Ecuador, informamos que tus datos personales serán tratados de forma lícita, leal,
          transparente y proporcional a las finalidades descritas en esta Política. En particular:
        </p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            Solo recopilamos los datos estrictamente necesarios para prestarte el servicio
            (principio de minimización de datos).
          </li>
          <li>
            No compartimos tus datos personales con terceros con fines comerciales o publicitarios
            sin tu autorización expresa.
          </li>
          <li>
            Cuando compartimos información con encargados de tratamiento (por ejemplo, proveedores
            de hosting, pasarelas de pago o herramientas de correo electrónico), exigimos que
            cumplan con estándares de seguridad y confidencialidad equivalentes a los nuestros.
          </li>
          <li>
            Los profesionales del Marketplace solo acceden a la información de tu empresa que sea
            necesaria para prestar el servicio contratado, y únicamente mientras dure dicha
            relación.
          </li>
        </ul>
        <p>Como titular de tus datos personales, tienes derecho a:</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            <span className="font-semibold text-ink-900">Acceso:</span> conocer qué datos tuyos
            almacenamos.
          </li>
          <li>
            <span className="font-semibold text-ink-900">Rectificación y actualización:</span>{' '}
            corregir datos inexactos o desactualizados.
          </li>
          <li>
            <span className="font-semibold text-ink-900">Eliminación o cancelación:</span>{' '}
            solicitar la eliminación de tus datos cuando ya no sean necesarios para las finalidades
            que los originaron.
          </li>
          <li>
            <span className="font-semibold text-ink-900">Oposición:</span> oponerte a un
            tratamiento específico de tus datos.
          </li>
          <li>
            <span className="font-semibold text-ink-900">Portabilidad:</span> solicitar una copia
            de tus datos en un formato estructurado y de uso común.
          </li>
          <li>
            <span className="font-semibold text-ink-900">Revocar tu consentimiento</span> en
            cualquier momento, sin que esto afecte la licitud del tratamiento previo a la
            revocatoria.
          </li>
        </ul>
        <p>
          Puedes ejercer estos derechos escribiendo a{' '}
          <a href="mailto:contacto@safe.ec" className="font-semibold text-navy-500 hover:underline">
            contacto@safe.ec
          </a>
          . Responderemos tu solicitud dentro de los plazos establecidos por la LOPDP.
        </p>
      </LegalSection>

      <LegalSection titulo="6. Plazo de conservación">
        <p>
          Conservamos tus datos personales mientras tu cuenta permanezca activa y durante el
          tiempo adicional necesario para cumplir obligaciones legales, contables o tributarias.
          Una vez cumplidas dichas finalidades, tus datos serán eliminados o anonimizados de forma
          segura.
        </p>
      </LegalSection>

      <LegalSection titulo="7. Seguridad de la información">
        <p>
          Aplicamos medidas técnicas y organizativas razonables (control de accesos, cifrado en
          tránsito y buenas prácticas de desarrollo) para proteger tus datos frente a accesos no
          autorizados, pérdida o alteración. Ningún sistema es completamente infalible; ante
          cualquier incidente de seguridad que afecte tus datos, te notificaremos conforme a lo
          exigido por la ley.
        </p>
      </LegalSection>

      <LegalSection titulo="8. Menores de edad">
        <p>
          SAFE está dirigido a empresas y profesionales mayores de edad. No recopilamos
          intencionalmente datos personales de menores de edad.
        </p>
      </LegalSection>

      <LegalSection titulo="9. Cambios a esta Política">
        <p>
          Podemos actualizar esta Política de Privacidad para reflejar cambios en nuestras
          prácticas o en la normativa aplicable. Publicaremos cualquier cambio en esta misma página
          junto con la fecha de actualización.
        </p>
      </LegalSection>

      <LegalSection titulo="10. Contacto">
        <p>
          Para consultas, solicitudes o reclamos relacionados con el tratamiento de tus datos
          personales, contáctanos en{' '}
          <a href="mailto:contacto@safe.ec" className="font-semibold text-navy-500 hover:underline">
            contacto@safe.ec
          </a>{' '}
          o a través de nuestra sección de{' '}
          <span className="font-semibold text-navy-900">Contacto</span>.
        </p>
      </LegalSection>
    </LegalPageLayout>
  )
}
