# 🚀 INSTALACIÓN Y GUÍA COMPLETA - Sistema Inventario Deportivo FET

**Versión 1.0.0 - Mayo 2026**
**Tiempo estimado de instalación:** 10-15 minutos

---

## 📋 TABLA DE CONTENIDOS

1. [Requisitos Previos](#requisitos-previos)
2. [Instalación Paso a Paso](#instalación-paso-a-paso)
3. [Guía de Uso - Estudiantes](#guía-de-uso---estudiantes)
4. [Guía de Uso - Administradores](#guía-de-uso---administradores)
5. [Generador de Reportes](#generador-de-reportes)
6. [Solución de Problemas](#solución-de-problemas)
7. [Endpoints de API](#endpoints-de-api)

---

---

## ✅ REQUISITOS PREVIOS

Antes de comenzar, asegúrate de tener instalados:

### **1. Node.js (v16 o superior)**
- **Descargar:** https://nodejs.org/ (Versión LTS recomendada)
- **Verificar instalación:**
  ```bash
  node --version
  npm --version
  ```

### **2. MySQL Server (v5.7 o superior)**
- **Descargar:** https://dev.mysql.com/downloads/mysql/
- **Verificar instalación:**
  ```bash
  mysql --version
  ```
- **Credenciales por defecto:**
  - Usuario: `root`
  - Contraseña: `root`

### **3. Navegador Moderno**
- Chrome, Firefox, Edge, Safari (cualquiera reciente)

---

---

## 📥 INSTALACIÓN PASO A PASO

### **PASO 1: Descargar y Preparar Proyecto (2 min)**

```bash
# Navega a la carpeta del proyecto
cd Proyecto_metodologia

# Instala dependencias del backend
cd backend
npm install
cd ..
```

**Esperado:** Se crea carpeta `backend/node_modules`

---

### **PASO 2: Crear Base de Datos (3 min)**

El archivo `BASE_DATOS.sql` contiene todas las tablas necesarias.

#### **OPCIÓN A: MySQL Workbench (RECOMENDADO - Más fácil)**

1. Abre **MySQL Workbench**
2. Conéctate con:
   - Host: `127.0.0.1`
   - Usuario: `root`
   - Contraseña: `root`
3. Ve a: **File** → **Open SQL Script**
4. Selecciona: `BASE_DATOS.sql` (en carpeta del proyecto)
5. Haz clic en el botón ⚡ **Execute** (o Ctrl+Shift+Enter)
6. Verás mensaje: "Query executed successfully"

---

#### **OPCIÓN B: Línea de Comandos (Terminal/CMD)**

```bash
# Windows
mysql -u root -p < BASE_DATOS.sql
# Presiona Enter, ingresa contraseña: root

# Mac/Linux
mysql -u root -p < BASE_DATOS.sql
# Presiona Enter, ingresa contraseña: root
```

---

#### **OPCIÓN C: PHPMyAdmin**

1. Abre navegador: `http://localhost/phpmyadmin`
2. Inicia sesión (root / root)
3. Clic en **"Importar"** (en la barra superior)
4. Clic en **"Seleccionar archivo"**
5. Selecciona `BASE_DATOS.sql`
6. Clic en **"Ejecutar"**

---

### **PASO 3: Configurar Variables de Entorno (2 min)**

#### **Archivo 1: Crear `.env` en la raíz del proyecto**

```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=root
DB_NAME=inventario_fet
DB_PORT=3306
PORT=3000
NODE_ENV=development
```

#### **Archivo 2: Crear `.env` en carpeta `backend/`**

```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=root
DB_NAME=inventario_fet
DB_PORT=3306
PORT=3000
NODE_ENV=development
```

**⚠️ IMPORTANTE:**
- Si tu contraseña MySQL es diferente, cámbiala en ambos archivos
- No compartas estos archivos (contienen credenciales)

---

### **PASO 4: Iniciar Servidor (1 min)**

#### **En Windows:**

```bash
# Opción 1: Hacer doble clic en:
iniciar-backend.bat

# O Opción 2: Desde CMD/PowerShell:
cd backend
npm start
```

#### **En Mac/Linux:**

```bash
cd backend
npm start
```

**Esperado ver:**
```
> inventario-fet-backend@1.0.0 start
> node server.js

Servidor iniciado en http://localhost:3000
```

---

### **PASO 5: Acceder al Sistema (1 min)**

Abre tu navegador en:

```
http://localhost:3000/pagina-login.html
```

**¡Listo! Sistema funcionando** ✅

---

---

## 🔐 CREDENCIALES DE ACCESO

### **Opción 1: Acceder como Administrador**

```
Usuario: admin
Contraseña: admin123
```

**Acceso a:**
- Gestión de inventario
- Solicitudes de préstamo
- Reportes en Excel
- Categorías y ubicaciones

### **Opción 2: Acceder como Estudiante**

```
Correo: juan@ejemplo.com
Identificación: 123456789
```

**O alternativamente:**

```
Correo: maria@ejemplo.com
Identificación: 987654321
```

**Acceso a:**
- Ver perfil
- Solicitar préstamos
- Ver historial de préstamos
- Estado de solicitudes

---

---

## 👨‍🎓 GUÍA DE USO - ESTUDIANTES

### **1. INICIAR SESIÓN**

1. Ve a: `http://localhost:3000/pagina-login.html`
2. Selecciona: "Login como Estudiante"
3. Correo: `juan@ejemplo.com`
4. Identificación: `123456789`
5. Haz clic: "Acceder"

### **2. MI PERFIL**

Verás:
- Tu nombre completo
- Tu correo electrónico
- Tu carrera y semestre
- Información de registro

### **3. SOLICITAR PRÉSTAMO**

**Paso a paso:**

1. En "Buscar producto..." escribe el nombre
   - Ejemplo: "Balón"
   - Presiona Enter

2. Verás lista de productos disponibles con:
   - Nombre del producto
   - Stock disponible
   - Marca y modelo

3. Haz clic en el producto deseado

4. Se abre formulario con:
   - Producto seleccionado
   - Campo cantidad
   - Stock actual visible

5. Ingresa cantidad (máximo: stock disponible)

6. Haz clic: "Solicitar Préstamo"

7. Verás confirmación: "Solicitud enviada"

8. **Listo**: Tu solicitud está en cola de espera

---

### **4. VER HISTORIAL DE PRÉSTAMOS**

Tabla con todas tus solicitudes:

| Columna | Significa |
|---------|-----------|
| **ID** | Número de solicitud |
| **Producto** | Equipo solicitado |
| **Cantidad** | Cuántos solicitaste |
| **Fecha** | Cuándo lo solicitaste |
| **Estado** | Situación actual |

#### **Entender los Estados:**

🟡 **PENDIENTE (Amarillo)**
- Tu solicitud está esperando revisión
- ⏳ Tiempo: 1-2 días hábiles
- Qué hacer: Espera a que administrador la revise

🟢 **APROBADO (Verde)**
- ¡Solicitud aceptada!
- ✅ Puedes retirar el equipo
- Dónde: Consulta con administrador
- Límite: Devuelve dentro del plazo establecido

🔴 **RECHAZADO (Rojo)**
- Lamentablemente fue rechazada
- 💬 Verás el motivo debajo
- Posibles motivos:
  - "No hay stock disponible"
  - "Necesitas cotizar con administrador"
- Qué hacer: Puedes hacer nueva solicitud

---

### **5. REFRESCAR SOLICITUDES**

```
Haz clic: "Refrescar Solicitudes"
Se actualiza tu lista automáticamente
```

### **6. LOGOUT (CERRAR SESIÓN)**

```
Haz clic: "Cerrar Sesión" (arriba a la derecha)
Se cierra tu sesión
```

---

---

## 👨‍💼 GUÍA DE USO - ADMINISTRADORES

### **1. INICIAR SESIÓN**

1. Ve a: `http://localhost:3000/pagina-login.html`
2. Selecciona: "Login como Admin"
3. Usuario: `admin`
4. Contraseña: `admin123`
5. Haz clic: "Acceder"

---

### **2. PANEL DE ADMINISTRACIÓN**

Verás 4 secciones principales:

---

#### **SECCIÓN 1: CATEGORÍAS Y UBICACIONES**

**Botones disponibles:**

1. **Ver Categorías**
   - Lista de tipos de equipo
   - Ejemplo: Balones, Raquetas, Protección, etc

2. **Registrar Categoría**
   - Nombre: *Ejemplo: Accesorios*
   - Descripción: *Ejemplo: Silbatos, cronómetros, conos*
   - Clic: "Guardar"

3. **Ver Ubicaciones**
   - Lista de bodegas/almacenes
   - Dónde guarda cada equipo

4. **Registrar Ubicación**
   - Nombre: *Ejemplo: Bodega Principal*
   - Descripción: *Ejemplo: Almacén central del campus*
   - Clic: "Guardar"

---

#### **SECCIÓN 2: REGISTRAR NUEVO PRODUCTO**

**Formulario con campos:**

| Campo | Ejemplo | Requerido |
|-------|---------|-----------|
| Número de item | 21 | ✅ Sí |
| Nombre del producto | Balón de Fútbol | ✅ Sí |
| Stock total | 10 | ✅ Sí |
| Stock mínimo | 2 | ✅ Sí |
| Marca | Adidas | ✅ Sí |
| Modelo | FIFA2022 | ✅ Sí |
| ID de categoría | 1 | ✅ Sí |
| ID de ubicación | 1 | ✅ Sí |

**Pasos:**
1. Completa todos los campos
2. Verifica que sean correctos
3. Haz clic: "Guardar elemento"
4. Verás confirmación verde

**Nota:** El número de item debe ser ÚNICO

---

#### **SECCIÓN 3: SOLICITUDES DE PRÉSTAMO PENDIENTES**

Tabla con solicitudes sin revisar:

**Columnas:**
- ID Solicitud
- Fecha de solicitud
- Nombre del estudiante
- Producto solicitado
- Cantidad
- Botones de acción

**¿Qué hacer?**

**A) APROBAR SOLICITUD:**

1. Revisa fila de solicitud
2. Verifica stock disponible en inventario
3. Haz clic: botón ✅ **APROBAR**
4. Verás confirmación

**Resultado:**
- Estado cambia a "Aprobado"
- Estudiante lo ve en su historial
- Equipo queda reservado

---

**B) RECHAZAR SOLICITUD:**

1. Haz clic: botón ❌ **RECHAZAR**
2. Se abre modal para escribir motivo
3. **Ingresa motivo obligatorio**, ejemplo:
   - "Stock insuficiente"
   - "Equipo en mantenimiento"
   - "Solicitud duplicada"
4. Haz clic: "Confirmar rechazo"

**Resultado:**
- Estado cambia a "Rechazado"
- Estudiante ve motivo en su historial
- Puede hacer nueva solicitud

---

#### **SECCIÓN 4: INVENTARIO ACTUAL**

Tabla completa con todos los productos:

**Columnas:**
- ID Producto
- Nombre
- Marca
- Stock Total
- Stock Mínimo
- Categoría
- Ubicación
- Préstamos Activos
- Disponibles
- Estado
- Acciones

**¿Qué puedo hacer?**

**A) BUSCAR PRODUCTO:**

```
Campo: "Buscar elemento o categoría"
Escribe: Nombre, marca o modelo
Se filtra automáticamente
```

**B) EDITAR PRODUCTO:**

1. Busca el producto en la tabla
2. Haz clic: **(Editar)**
3. Se abre formulario
4. Modifica campos necesarios
5. Haz clic: "Guardar"

**C) ELIMINAR PRODUCTO:**

1. Busca el producto
2. Haz clic: **(Eliminar)**
3. Confirmación de seguridad
4. Confirma eliminación
5. Producto se elimina completamente

---

### **3. REGISTRAR DEVOLUCIÓN**

**Cuándo:** Cuando estudiante devuelve equipo

**Pasos:**

1. Haz clic: "Registrar devolución" (en panel)
2. Se abre formulario:
   - Selecciona producto
   - Ingresa cantidad devuelta
   - Nombre del responsable
3. Haz clic: "Registrar"

**Sistema valida:**
- Cantidad no puede exceder lo prestado
- Actualiza stock automáticamente

---

---

## 📊 GENERADOR DE REPORTES

### **¿Cómo generar reporte?**

1. En solicitudes, haz clic: **"📊 Ver Reporte Completo"**
2. Sistema procesa datos (2-3 segundos)
3. Se descarga archivo Excel automáticamente

**Nombre del archivo:**
```
Reporte_Inventario_Completo_YYYY-MM-DD.xlsx
Ejemplo: Reporte_Inventario_Completo_2026-05-09.xlsx
```

---

### **¿Qué incluye el Reporte? (6 Hojas)**

#### **Hoja 1: Resumen Ejecutivo**
- Total de productos registrados
- Stock total disponible
- Productos con bajo stock
- Solicitudes por estado
- Tasa de aprobación %
- Fecha de generación

#### **Hoja 2: Solicitudes Detallado**
- Desglose por estado
- Cantidad y porcentaje
- Descripción de estados
- Análisis comparativo

#### **Hoja 3: Top 20 Productos Más Solicitados**
- Ranking de productos
- ID y nombre
- Total de solicitudes
- Cantidad total prestada
- Promedio por solicitud

#### **Hoja 4: Top 20 Estudiantes**
- Ranking de estudiantes
- Nombre del estudiante
- Total solicitudes
- Desglose: Pendientes, Aprobadas, Rechazadas
- Tasa de aprobación individual %

#### **Hoja 5: Préstamos por Período**
- Últimos 30 días
- Fecha y total de préstamos
- Promedio diario
- Totales consolidados

#### **Hoja 6: Notas y Recomendaciones**
- Información sobre bajo stock
- Guía de estados
- Período de datos
- Recomendaciones de acción

---

---

## 🔧 SOLUCIÓN DE PROBLEMAS

### **❌ Error: "Cannot find module 'express'"**

**Solución:**
```bash
cd backend
npm install
npm start
```

---

### **❌ Error: "EADDRINUSE: address already in use :::3000"**

**Causa:** Puerto 3000 está ocupado

**Solución en Windows:**
```bash
netstat -ano | findstr :3000
taskkill /PID [NÚMERO] /F
# Luego reinicia: npm start
```

**Solución en Mac/Linux:**
```bash
lsof -i :3000
kill -9 [PID]
# Luego reinicia: npm start
```

---

### **❌ Error: "Connect ECONNREFUSED 127.0.0.1:3306"**

**Causa:** MySQL no está ejecutándose

**Solución:**
- Windows: Inicia "MySQL80" desde Servicios
- Mac: Usa MySQL Workbench o Sequel Pro
- Linux: `sudo systemctl start mysql`

---

### **❌ Error: "Access denied for user 'root'@'localhost'"**

**Causa:** Contraseña incorrecta

**Solución:**
1. Verifica credenciales en `.env`
2. DB_PASSWORD debe ser tu contraseña MySQL real
3. Actualiza ambos archivos `.env`
4. Reinicia servidor

---

### **❌ No aparecen productos en búsqueda**

**Solución:**
1. Verifica que existan productos creados
2. Recarga página (F5)
3. Intenta búsqueda más general
4. Verifica conexión a BD

---

### **❌ Excel no se descarga**

**Solución:**
1. Desactiva bloqueador de ventanas emergentes
2. Intenta en navegador incógnito
3. Intenta en navegador diferente
4. Verifica servidor está activo

---

### **❌ Imágenes no cargan**

**Solución:**
Verifica que existe carpeta `img/` con:
- fetlogo.jpg
- logofet.png

---

### **❌ Página en blanco o sin estilo**

**Solución:**
```
Presiona: Ctrl+Shift+R (vaciar caché)
O abre en navegador privado
```

---

### **❌ No puedo hacer login**

**Checklist:**
- ✅ Servidor está ejecutándose
- ✅ Base de datos está creada
- ✅ MySQL está activo
- ✅ Credenciales están correctas
- ✅ Caché del navegador está limpio

---

---

## 🌐 ENDPOINTS DE API

### **Autenticación**
```
POST /api/login
Body: { usuario: "admin", password: "admin123" }
```

### **Inventario**
```
GET /api/inventario                    - Listar todos
POST /api/inventario                   - Crear
PUT /api/inventario/:id                - Editar
DELETE /api/inventario/:id             - Eliminar
GET /api/inventario/buscar?q=termo     - Buscar
```

### **Categorías**
```
GET /api/categorias                    - Listar
POST /api/categorias                   - Crear
PUT /api/categorias/:id                - Editar
DELETE /api/categorias/:id             - Eliminar
```

### **Ubicaciones**
```
GET /api/ubicaciones                   - Listar
POST /api/ubicaciones                  - Crear
PUT /api/ubicaciones/:id               - Editar
DELETE /api/ubicaciones/:id            - Eliminar
```

### **Préstamos**
```
POST /api/prestamos                    - Solicitar
GET /api/solicitudes-pendientes        - Ver pendientes
PUT /api/solicitudes-pendientes/:id/aprobar      - Aprobar
PUT /api/solicitudes-pendientes/:id/rechazar    - Rechazar
GET /api/solicitudes-estudiante?responsable=x   - Mi historial
```

### **Devoluciones**
```
POST /api/devoluciones                 - Registrar devolución
```

### **Reportes**
```
GET /api/reporte-sistema               - Datos para Excel
```

### **Verificación**
```
GET /api/health                        - Verificar servidor
```

---

---

## 📱 ACCESO POR DISPOSITIVO

### **En Computadora**
```
http://localhost:3000/pagina-login.html
```

### **En Teléfono (Misma red)**
```
http://[IP_COMPUTADORA]:3000/pagina-login.html
Ejemplo: http://192.168.1.100:3000/pagina-login.html

Para saber tu IP en Windows:
ipconfig
Busca "IPv4 Address"

Para saber tu IP en Mac/Linux:
ifconfig
```

---

---

## ✅ VALIDACIÓN FINAL

Antes de comenzar a usar, verifica:

- ✅ Servidor iniciado sin errores
- ✅ Puedes acceder a http://localhost:3000/pagina-login.html
- ✅ Login funciona con credenciales
- ✅ Puedes crear un producto
- ✅ Puedes hacer una solicitud
- ✅ Puedes aprobar una solicitud
- ✅ Puedes descargar reporte en Excel

Si todo ✅ está verde, **¡Sistema listo para usar!**

---

---

## 📞 SOPORTE RÁPIDO

| Problema | Solución Rápida |
|----------|-----------------|
| No inicializa | npm install → npm start |
| No conecta BD | Revisar .env y credenciales MySQL |
| Puerto ocupado | taskkill /PID [ID] /F |
| Sin internet | Verificar nginx/servidor |
| Excel no descarga | Desactivar bloqueador popups |

---

---

## 📝 ESTRUCTURA DE CARPETAS

```
Proyecto_metodologia/
├── pagina-login.html
├── pagina-estudiantes.html
├── pagina-gestion.html
├── iniciar-backend.bat
├── BASE_DATOS.sql
├── INSTALACION_RAPIDA.md
├── .env
├── js/
│   ├── login.js
│   ├── estudiantes.js
│   └── gestion.js
├── css/
│   ├── style.css
│   ├── pagina-estudiantes.css
│   └── pagina-gestion.css
├── img/
│   ├── fetlogo.jpg
│   └── logofet.png
└── backend/
    ├── server.js
    ├── db.js
    ├── package.json
    ├── .env
    └── node_modules/ (se crea con npm install)
```

---

---

## 🎯 RESUMEN DE INSTALACIÓN

```
1. npm install en backend/               (2 min)
2. Ejecutar BASE_DATOS.sql              (3 min)
3. Crear archivos .env                  (2 min)
4. npm start                             (1 min)
5. http://localhost:3000/               (1 min)
                                         --------
                                    TOTAL: 9 minutos
```

---

**¡LISTO PARA USAR! 🎉**

Si tienes problemas, consulta la sección "Solución de Problemas" arriba.

*Última actualización: 9 de Mayo de 2026*
*Versión: 1.0.0*
*Estado: PRODUCCIÓN*

