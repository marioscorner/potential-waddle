# My Digital Canvas - Portfolio Personal

Portfolio personal desarrollado con React, TypeScript y Tailwind CSS.

## 🚀 Tecnologías

Este proyecto está construido con:

- **Vite** - Build tool y servidor de desarrollo
- **React 19** - Biblioteca de UI
- **TypeScript** - Tipado estático
- **Tailwind CSS** - Framework CSS utility-first
- **shadcn/ui** - Componentes UI
- **React Router** - Enrutamiento

## 📦 Instalación

Requisitos: Node.js y npm instalados - [instalar con nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

```sh
# Paso 1: Clonar el repositorio
git clone <YOUR_GIT_URL>

# Paso 2: Navegar al directorio del proyecto
cd my-digital-canvas

# Paso 3: Instalar las dependencias
npm install

# Paso 4: Iniciar el servidor de desarrollo
npm run dev
```

## 🛠️ Scripts disponibles

- `npm run dev` - Inicia el servidor de desarrollo
- `npm run build` - Construye la aplicación para producción
- `npm run preview` - Previsualiza la build de producción
- `npm run lint` - Ejecuta el linter

## 🐳 Despliegue con Docker

El proyecto está dockerizado y listo para desplegarse en un VPS.

### Desarrollo local con Docker

```sh
# Construir la imagen
docker build -t my-digital-canvas .

# Ejecutar el contenedor
docker run -p 80:80 my-digital-canvas
```

### Despliegue en producción

#### Opción 1: Despliegue Automático con GitHub Actions (Recomendado) 🚀

El proyecto está configurado para desplegarse automáticamente cada vez que hagas `git push` a la rama `main`.

**Configuración inicial:**
1. Sube tu código a GitHub
2. Configura los secrets en GitHub: `SSH_PRIVATE_KEY`, `SSH_USER`, `SSH_HOST`
3. ¡Listo! Cada push desplegará automáticamente

Ver la [guía completa de despliegue con GitHub](./DEPLOY_GITHUB.md).

#### Opción 2: Despliegue Manual

```sh
# Con Docker Compose
docker-compose up -d --build
```

Para más detalles sobre el despliegue, consulta [DEPLOY.md](./DEPLOY.md) o [DEPLOY_GITHUB.md](./DEPLOY_GITHUB.md).

## 📁 Estructura del proyecto

```
src/
├── components/       # Componentes React
│   ├── portfolio/   # Componentes del portfolio
│   └── ui/          # Componentes UI (shadcn/ui)
├── contexts/         # Contextos de React
├── hooks/            # Custom hooks
├── lib/              # Utilidades y configuraciones
├── pages/            # Páginas de la aplicación
└── assets/           # Recursos estáticos
```

## ✨ Características

- 🌓 Modo oscuro/claro
- 🌍 Soporte multiidioma (Español/Inglés)
- 📱 Diseño responsive
- 🎨 UI moderna con animaciones
- 🎵 Integración con Spotify
- 📄 Descarga de CV según idioma

## 📝 Licencia

Este proyecto es de uso personal.
