# Directorio de proveedores de Real Montejo

Aplicacion web colaborativa para que los vecinos de Real Montejo inicien sesion, publiquen proveedores de la zona, los califiquen con estrellas y encuentren rapidamente las mejores opciones por categoria.

## Proposito

Este proyecto ayuda a la comunidad a:

- registrar proveedores de confianza recomendados por vecinos
- consultar proveedores por categoria
- dejar resenas y calificaciones con estrellas
- identificar rapidamente a los servicios mejor evaluados

## Funcionalidades principales

- autenticacion con Google
- alta de proveedores por usuarios autenticados
- carga de foto del proveedor desde camara o dispositivo
- imagen predeterminada automatica cuando no se sube foto
- enlace de contacto mediante Google Forms
- resenas con estrellas
- filtros y ordenamiento en el directorio
- navegacion por categorias
- persistencia con MongoDB o respaldo local en JSON

## Tecnologias

- Next.js 16
- React
- TypeScript
- NextAuth
- MongoDB
- Tailwind CSS

## Configuracion local

Instala dependencias:

```bash
npm install
```

Crea tu archivo `.env.local` con variables como estas:

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=tu_secreto

GOOGLE_CLIENT_ID=tu_google_client_id
GOOGLE_CLIENT_SECRET=tu_google_client_secret

MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=directorio-real-montejo
```

## Desarrollo

Levanta el servidor local:

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Validacion

```bash
npm run lint
npm run build
```

## Notas recientes

- la portada se limpio para mostrar solo informacion util para los vecinos
- el formulario de proveedores ya permite tomar una foto o elegir una imagen desde el dispositivo
- si no se sube imagen, el sistema usa una imagen predeterminada
- la seccion de contacto ahora redirige a un Google Form externo
- se eliminaron los datos dummy para dejar el directorio listo para informacion real
- la persistencia normaliza datos repetidos para evitar problemas de renderizado
