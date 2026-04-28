# INSTRUCCIONES DE PRUEBA - HISTORIAL DE PRÉSTAMOS

## Credenciales de Prueba

### Estudiante 1: Juan Perez
- **Email**: juan.perez@fet.edu.co
- **ID**: 1001
- **Carrera**: Ingenieria de Software
- **Semestre**: 3

### Estudiante 2: Maria Gomez
- **Email**: maria.gomez@fet.edu.co
- **ID**: 1002
- **Carrera**: Ingenieria de Alimentos
- **Semestre**: 2

### Estudiante 3: Andres Lopez
- **Email**: andres.lopez@fet.edu.co
- **ID**: 1005
- **Carrera**: Ingenieria Ambiental
- **Semestre**: 4

## Pasos de Prueba

### 1. Historial Visible
- [ ] Loguea como Juan Perez
- [ ] Verifica que aparezca la sección "Historial de préstamos"
- [ ] Debes ver una tabla con columnas: ID, Producto, Cantidad, Fecha, Estado
- [ ] Debes ver la solicitud #16 (Balon de Futbol x4 - Estado: Activo)

### 2. Botón Refrescar
- [ ] Haz clic en el botón "Refrescar" con icono SVG
- [ ] Verifica que el icono rota 180 grados
- [ ] La tabla se actualiza sin cambios (es normal si no hay nuevos datos)

### 3. Crear Nueva Solicitud
- [ ] Rellena el formulario de solicitud:
  - ID Producto: 1
  - Cantidad: 1
  - Nombre: Se auto-llena con "Juan Perez"
- [ ] Haz clic en "Solicitar préstamo"
- [ ] Confirma la solicitud
- [ ] Verifica el mensaje de éxito
- [ ] **El historial debe actualizar automáticamente**
- [ ] Debes ver la nueva solicitud con estado "Pendiente por aprobar" (amarillo)

### 4. Aprobación desde Admin
- [ ] Loguea como usuario del sistema (ej: admin)
- [ ] Ve a la sección de solicitudes pendientes
- [ ] Aprueba la solicitud creada
- [ ] Loguea nuevamente como Juan Perez
- [ ] **Debes recibir una notificación de aprobación**
- [ ] El historial debe mostrar la solicitud con estado "Activo" (verde)

### 5. Prueba Case Insensitive (Opcional)
- [ ] Abre la consola de desarrollador (F12)
- [ ] Ve a la pestaña Network
- [ ] Loguea como Juan Perez
- [ ] Busca la solicitud GET `/api/solicitudes-estudiante`
- [ ] Verifica que el parámetro `responsable=Juan Perez` está siendo enviado
- [ ] Verifica que retorna datos correctamente

## Resultados Esperados

✅ **Debería funcionar**:
- El historial se carga automáticamente al loguear
- Se muestran todas las solicitudes del estudiante
- El botón refrescar actualiza los datos
- Las nuevas solicitudes aparecen inmediatamente
- Se reciben notificaciones cuando se aprueban solicitudes

❌ **Si no funciona**:
1. Verifica que el servidor esté corriendo en puerto 3000
2. Abre la consola (F12) y busca errores
3. Verifica que el email y ID sean correctos
4. Intenta limpiar el localStorage: 
   ```javascript
   // En la consola:
   localStorage.clear();
   sessionStorage.clear();
   // Recarga la página
   ```

## Notas Técnicas

- Las credenciales de estudiante son: **correo como usuario** y **nu_identificacion como contraseña**
- El nombre se obtiene automáticamente de la tabla `usuario` (nombres_apellidos)
- Las solicitudes se guardan como "Solicitud Pendiente" hasta que un admin las aprueba
- El historial se actualiza automáticamente cada 15 segundos (polling)

