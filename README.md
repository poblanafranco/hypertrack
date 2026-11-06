# HyperTrack

Plataforma web para planificar rutinas de gimnasio, registrar entrenamientos y visualizar el progreso. Arquitectura completa: **React (frontend)** + **API REST propia en Node/Express (backend)** + **PostgreSQL** administrado con **Prisma**.

```
┌────────────┐   /api (mismo origen)   ┌────────────┐      SQL      ┌────────────┐
│  Frontend  │ ──────────────────────► │  Backend   │ ─────────────►│ PostgreSQL │
│ React+Vite │ ◄────────────────────── │Node/Express│◄──────────────│  (Prisma)  │
└────────────┘  (nginx o proxy de Vite)└─────┬──────┘                └────────────┘
                                             ▼
                                     API externa: wger.de
```

El navegador **siempre** llama a `/api` en el mismo origen. En Docker lo redirige nginx y en desarrollo lo redirige Vite, así que no hay CORS ni URLs/puertos que sincronizar en el frontend.

---

## Cómo correrla

Necesitas **Docker Desktop** (opción A) o **Node 20+** y Docker para la base (opción B). Elige **una sola** opción a la vez: las dos usan los mismos puertos.

### Opción A — Todo en Docker (la más simple)

1. Abre **Docker Desktop** y espera a que diga *Running*.
2. **Cierra todo lo que tengas corriendo** de esta app (`Ctrl+C` en cada terminal donde hayas hecho `npm run dev`). Si no, los puertos 4000/5173 estarán ocupados.
3. En la carpeta raíz del proyecto (donde está `docker-compose.yml`):

   ```powershell
   docker compose down -v
   docker compose up --build
   ```

   > `down -v` borra los datos de la base. Es lo correcto la primera vez o si algo quedó a medias; omite `-v` cuando ya tengas datos que quieras conservar.

4. Espera a ver `Base de datos conectada correctamente.` y abre **http://localhost:5173**.

Para apagar: `Ctrl+C` y luego `docker compose down`.

### Opción B — Desarrollo (recarga automática)

```powershell
# 1) Solo la base de datos, en Docker (queda en localhost:5433)
docker compose up -d db

# 2) Backend (terminal 1)
cd backend
npm install
npm run dev        # aplica las migraciones solo y arranca en http://localhost:4000

# 3) Frontend (terminal 2)
cd frontend
npm install
npm run dev        # http://localhost:5173
```

`backend/.env` ya viene listo para este modo. Si no existe, copia `backend/.env.example`. El frontend no necesita `.env`.

### Puertos

| Servicio | Puerto en tu PC | Nota |
|---|---|---|
| Frontend | 5173 | Único que usas en el navegador |
| Backend (API) | 4000 | `http://localhost:4000/api/health/db` para comprobarlo |
| PostgreSQL (Docker) | **5433** | A propósito no es 5432, para no chocar con un PostgreSQL instalado en Windows |

Se pueden cambiar con variables: `FRONTEND_PORT`, `BACKEND_PORT`, `DB_PORT` (ej. en PowerShell: `$env:FRONTEND_PORT=8080; docker compose up`).

---

## Solución de problemas

| Síntoma | Causa | Solución |
|---|---|---|
| `ports are not available … Only one usage of each socket address` | Otro proceso ya usa ese puerto (un `npm run dev` abierto, o dos `docker compose up`) | `netstat -ano \| findstr :4000` → `taskkill /PID <número> /F`. Usa una sola opción (A o B) |
| `Authentication failed against database server at localhost` | Casi siempre hay **otro PostgreSQL** (el de Windows) en el puerto 5432 y Prisma se conecta a ese | Usa el puerto **5433** en `DATABASE_URL` (ya es el valor por defecto). Verifica con `netstat -ano \| findstr :5433` |
| Igual, pero sin PostgreSQL de Windows | Cambiaste el usuario/contraseña del compose y el volumen viejo conserva los anteriores | `docker compose down -v` y vuelve a levantar |
| `ERR_CONNECTION_REFUSED` / «El backend no responde» | El backend está apagado o falló al arrancar | Mira la terminal del backend: ahí se explica el motivo |
| `Environment variable not found: DATABASE_URL` | Falta `backend/.env` | Copia `backend/.env.example` a `backend/.env` |
| Se ve una pantalla vieja o rutas raras en `localhost:5173` | Otro proyecto dejó un *service worker* (workbox) en ese puerto | La app lo elimina sola al cargar; recarga con `Ctrl+Shift+R`. Manual: DevTools → Application → Service Workers → *Unregister* |
| `EPERM … query_engine` al hacer `prisma generate` en Windows | El backend (nodemon) tiene bloqueado el motor | Detén el backend, corre el comando y vuélvelo a iniciar |
| «Tu sesión expiró» tras reiniciar la base | El usuario del token ya no existe | Es lo esperado: inicia sesión o crea la cuenta de nuevo |

---

## Manejo de errores

- **Backend:** un solo middleware (`src/middleware/errorHandler.js`) responde siempre `{ error, code, details? }`. La base caída o sin migrar devuelve `503`; JSON roto `400`; duplicados `409`; sin ruta `404`. Nunca se filtran rutas de archivos, SQL ni mensajes internos al cliente; el detalle y la causa probable salen en la terminal del backend. Toda entrada se valida con `express-validator`.
- **Arranque:** el backend verifica la base al iniciar y explica cómo arreglarla; avisa si el puerto está ocupado; cierra limpio con `Ctrl+C`.
- **Frontend:** mensajes claros para red caída, timeout, validación por campo y sesión vencida; pantallas con botón **Reintentar**; avisos (toasts) y diálogos de confirmación en lugar de `alert/confirm`; un `ErrorBoundary` como red de seguridad. Si el backend está caído al recargar, **no** se cierra la sesión.

## Variables de entorno

| Variable | Dónde | Descripción |
|---|---|---|
| `DATABASE_URL` | backend | Cadena de conexión a PostgreSQL |
| `JWT_SECRET` | backend | Secreto para firmar los tokens (obligatorio en producción) |
| `PORT` | backend | Puerto de la API (4000 por defecto) |
| `CORS_ORIGIN` | backend | Orígenes permitidos, separados por coma |
| `VITE_PROXY_TARGET` | frontend (dev) | Dónde está el backend si no es `http://localhost:4000` |
| `VITE_API_URL` | frontend (opcional) | Solo si la API vive en otro dominio y no hay proxy |

Los `.env` reales están en `.gitignore`; se distribuyen como `.env.example`. El `.env` incluido en el zip contiene únicamente valores de desarrollo local.

## Manual de usuario (breve)

1. **Crear cuenta** con nombre, correo y contraseña (mín. 6 caracteres).
2. **Mi rutina:** agrega ejercicios por día y grupo muscular; el campo «Ejercicio» sugiere nombres de la API externa (wger.de) con un catálogo local de respaldo. Puedes archivarlos y restaurarlos.
3. **Registrar:** crea una sesión con fecha y varios ejercicios (peso y repeticiones).
4. **Historial:** consulta, expande el detalle de cada set o elimina sesiones.
5. **Dashboard:** fuerza estimada (1RM, fórmula de Epley), volumen semanal por músculo, estado de recuperación y sugerencias de sobrecarga progresiva.
6. **Ajustes:** exporta a Excel, importa un Excel con el mismo formato (se valida fila por fila y no se guarda nada si hay errores), elimina todos tus registros o cierra sesión.

## Pruebas automatizadas

```bash
cd backend
npm test        # necesita la base levantada (docker compose up -d db) y las migraciones aplicadas
```

21 pruebas de integración (Jest + Supertest) sobre salud, errores generales, autenticación, rutina y entrenamientos (incluida la validación de datos), contra la base real de `DATABASE_URL`.

## CI/CD

`.github/workflows/ci.yml` corre en cada `push`: levanta PostgreSQL, aplica migraciones, ejecuta las pruebas del backend y compila el frontend. Despliegue recomendado: **Vercel** (frontend) y **Railway/Render** (backend + base de datos).

## Seguridad

- Contraseñas con bcrypt; JWT en cada endpoint protegido (y se verifica que el usuario siga existiendo).
- Validación de todas las entradas; el correo se normaliza a minúsculas; el login no revela si el correo existe.
- Secretos solo por variables de entorno. En producción sirve todo detrás de HTTPS.

## Estructura

```
hypertrack/
├── backend/            # API REST (Express + Prisma)
│   ├── prisma/         # Esquema y migraciones
│   ├── src/            # controllers, routes, middleware, lib
│   └── tests/          # Jest + Supertest
├── frontend/           # React + Vite + Tailwind + lucide-react (iconos)
│   └── src/            # pages, components, hooks, utils
├── docker-compose.yml
└── .github/workflows/ci.yml
```
