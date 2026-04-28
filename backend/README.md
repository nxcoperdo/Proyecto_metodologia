# Backend Inventario FET

Este backend conecta la interfaz web con `inventario_db` (MySQL/MariaDB).

## 1) Requisitos

- Node.js 18+
- MySQL o MariaDB encendido
- Base importada desde `BD_inventarioFET.sql`

## 2) Arranque facil (recomendado)

### Opcion A: doble clic

1. Desde la raiz del proyecto, ejecuta `iniciar-backend.bat`.
2. La primera vez, crea `.env` automaticamente desde `.env.example`.
3. Si hace falta, instala dependencias y luego inicia el servidor.

### Opcion B: PowerShell

```powershell
cd C:\Users\ASUS\IdeaProjects\Proyecto_metodologia\backend
powershell -ExecutionPolicy Bypass -File .\start-backend.ps1
```

## 3) Si no conecta con la base de datos

Revisa `backend/.env` y confirma estos datos:

- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME=inventario_db`

## 4) Probar rapido

Con el backend arriba:

```powershell
cd C:\Users\ASUS\IdeaProjects\Proyecto_metodologia\backend
npm run smoke
npm run test:devolucion
```

Tambien puedes abrir:

- `http://localhost:3000/api/health`
- `http://localhost:3000/api/db-status`

## 5) Endpoints principales

- `GET /api/health`
- `GET /api/db-status`
- `POST /api/login`
- `GET /api/inventario`
- `GET /api/inventario/buscar?q=texto`
- `POST /api/inventario`
- `PUT /api/inventario/:id`
- `DELETE /api/inventario/:id`
- `POST /api/prestamos`
- `POST /api/devoluciones`

Nota: `POST /api/devoluciones` ahora guarda la devolucion en la tabla `entrada_inv`.

## 6) Credencial de prueba segun tu BD

- Usuario: `admin`
- Contrasena: `Admin123`

