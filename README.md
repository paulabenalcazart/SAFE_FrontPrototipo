# SAFE Frontend

Frontend web de SAFE, una plataforma para la gestión financiera, tributaria y administrativa de empresas ecuatorianas.

## Alcance

- Sitio público, registro, inicio de sesión y recuperación de contraseña.
- Portal privado bajo `/app` para los perfiles Empresa, Colaborador y Administrador.
- Módulos de empresas, finanzas, indicadores, obligaciones, simulador, marketplace, suscripción, configuración y tutoriales.
- Datos locales de demostración y sesión simulada; el proyecto no incluye backend ni integraciones externas.

## Tecnología

- React 18 y TypeScript.
- Vite 5.
- Tailwind CSS 4.
- React Router 6.
- Radix UI y Lucide React.

## Estructura principal

```text
public/          Recursos estáticos
src/auth/        Autenticación y sesión local
src/components/  Sitio público y componentes compartidos
src/portal/      Portal privado y módulos de los tres perfiles
src/lib/         Utilidades comunes
```

## Ejecución

Requiere Node.js 18 o superior.

```bash
npm install
npm run dev
```

Para generar y revisar la versión de producción:

```bash
npm run build
npm run preview
```
