const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { pool, probarConexion } = require('./db');

const app = express();
const PORT = Number(process.env.PORT || 3000);

app.use(cors());
app.use(express.json());

async function obtenerPrestamosActivosPorProducto(conexion, idProducto) {
  const sql = "SELECT GREATEST(COALESCE((SELECT SUM(cantidad) FROM salida_inv WHERE id_producto = ? AND tipo_salida = 'Prestamo'), 0) - COALESCE((SELECT SUM(cantidad) FROM salida_inv WHERE id_producto = ? AND tipo_salida = 'Devolucion'), 0) - COALESCE((SELECT SUM(cantidad) FROM entrada_inv WHERE id_producto = ? AND id_proveedor IS NULL), 0), 0) AS prestamos_activos";
  const [rows] = await conexion.query(sql, [idProducto, idProducto, idProducto]);
  return Number((rows[0] && rows[0].prestamos_activos) || 0);
}

app.get('/api/health', function (req, res) {
  res.json({ ok: true, mensaje: 'API activa' });
});

app.get('/api/db-status', async function (req, res) {
   try {
     await probarConexion();
     res.json({ ok: true, mensaje: 'Conexion a base de datos exitosa' });
   } catch (error) {
     res.status(500).json({ ok: false, mensaje: 'No se pudo conectar a la base de datos', detalle: error.message });
   }
});

app.get('/api/debug/ubicaciones-estructura', async function (req, res) {
  try {
    const [columnas] = await pool.query(`SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'ubicacion' AND TABLE_SCHEMA = DATABASE()`);
    
    if (!columnas.length) {
      return res.status(404).json({ ok: false, mensaje: 'Tabla ubicacion no encontrada en la base de datos' });
    }
    
    const [datos] = await pool.query('SELECT * FROM ubicacion LIMIT 5');
    
    return res.json({ 
      ok: true, 
      estructura: columnas,
      datosEjemplo: datos,
      totalRegistros: datos.length
    });
  } catch (error) {
    return res.status(500).json({ ok: false, mensaje: 'Error consultando ubicacion', detalle: error.message });
  }
});

app.get('/api/debug/tabla-usuario', async function (req, res) {
  try {
    const [columnInfo] = await pool.query("SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'usuario'");
    const [datos] = await pool.query('SELECT correo, nu_identificacion FROM usuario LIMIT 20');
    
    return res.json({
      ok: true,
      estructura: columnInfo,
      primeros_registros: datos
    });
  } catch (error) {
    return res.status(500).json({ ok: false, mensaje: 'Error', detalle: error.message });
  }
});

app.get('/api/categorias', async function (req, res) {
  try {
    const [rows] = await pool.query('SELECT id_categoria, nombre, descripcion FROM categoria ORDER BY id_categoria');
    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ ok: false, mensaje: 'Error consultando categorias', detalle: error.message });
  }
});

app.post('/api/categorias', async function (req, res) {
  try {
    const nombre = String(req.body.nombre || '').trim();
    const descripcion = String(req.body.descripcion || '').trim();

    if (!nombre) {
      return res.status(400).json({ ok: false, mensaje: 'El nombre de la categoria es obligatorio' });
    }

    const [existente] = await pool.query('SELECT id_categoria FROM categoria WHERE LOWER(TRIM(nombre)) = LOWER(TRIM(?)) LIMIT 1', [nombre]);
    if (existente.length) {
      return res.status(409).json({ ok: false, mensaje: 'Esa categoria ya existe' });
    }

    const [resultado] = await pool.query('INSERT INTO categoria (nombre, descripcion) VALUES (?, ?)', [nombre, descripcion]);
    return res.status(201).json({ ok: true, mensaje: 'Categoria registrada', id_categoria: resultado.insertId });
  } catch (error) {
    return res.status(500).json({ ok: false, mensaje: 'Error registrando categoria', detalle: error.message });
  }
});

app.put('/api/categorias/:id', async function (req, res) {
  try {
    const idCategoria = Number(req.params.id);
    const nombre = String(req.body.nombre || '').trim();
    const descripcion = String(req.body.descripcion || '').trim();

    if (!idCategoria || !nombre) {
      return res.status(400).json({ ok: false, mensaje: 'Datos invalidos para editar categoria' });
    }

    const [actual] = await pool.query('SELECT id_categoria FROM categoria WHERE id_categoria = ? LIMIT 1', [idCategoria]);
    if (!actual.length) {
      return res.status(404).json({ ok: false, mensaje: 'Categoria no encontrada' });
    }

    const [duplicada] = await pool.query('SELECT id_categoria FROM categoria WHERE id_categoria <> ? AND LOWER(TRIM(nombre)) = LOWER(TRIM(?)) LIMIT 1', [idCategoria, nombre]);
    if (duplicada.length) {
      return res.status(409).json({ ok: false, mensaje: 'Ya existe otra categoria con ese nombre' });
    }

    await pool.query('UPDATE categoria SET nombre = ?, descripcion = ? WHERE id_categoria = ?', [nombre, descripcion, idCategoria]);
    return res.json({ ok: true, mensaje: 'Categoria actualizada' });
  } catch (error) {
    return res.status(500).json({ ok: false, mensaje: 'Error editando categoria', detalle: error.message });
  }
});

app.delete('/api/categorias/:id', async function (req, res) {
  try {
    const idCategoria = Number(req.params.id);

    if (!idCategoria) {
      return res.status(400).json({ ok: false, mensaje: 'ID de categoria invalido' });
    }

    const [usada] = await pool.query('SELECT COUNT(*) AS total FROM producto WHERE id_categoria = ?', [idCategoria]);
    if (Number(usada[0].total || 0) > 0) {
      return res.status(409).json({ ok: false, mensaje: 'No puedes eliminar una categoria que tiene productos asociados' });
    }

    const [resultado] = await pool.query('DELETE FROM categoria WHERE id_categoria = ?', [idCategoria]);

    if (!resultado.affectedRows) {
      return res.status(404).json({ ok: false, mensaje: 'Categoria no encontrada' });
    }

    return res.json({ ok: true, mensaje: 'Categoria eliminada' });
  } catch (error) {
    return res.status(500).json({ ok: false, mensaje: 'Error eliminando categoria', detalle: error.message });
  }
});

// Rutas para ubicaciones (bodegas)
app.get('/api/ubicaciones', async function (req, res) {
  try {
    const [rows] = await pool.query('SELECT id_ubicacion, nombre, descripcion FROM ubicacion ORDER BY id_ubicacion');
    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ ok: false, mensaje: 'Error consultando ubicaciones', detalle: error.message });
  }
});

app.post('/api/ubicaciones', async function (req, res) {
  try {
    const nombre = String(req.body.nombre || '').trim();
    const descripcion = String(req.body.descripcion || '').trim();

    if (!nombre) {
      return res.status(400).json({ ok: false, mensaje: 'El nombre de la ubicacion es obligatorio' });
    }

    const [existente] = await pool.query('SELECT id_ubicacion FROM ubicacion WHERE LOWER(TRIM(nombre)) = LOWER(TRIM(?)) LIMIT 1', [nombre]);
    if (existente.length) {
      return res.status(409).json({ ok: false, mensaje: 'Esa ubicacion ya existe' });
    }

    const [resultado] = await pool.query('INSERT INTO ubicacion (nombre, descripcion) VALUES (?, ?)', [nombre, descripcion]);
    return res.status(201).json({ ok: true, mensaje: 'Ubicacion registrada', id_ubicacion: resultado.insertId });
  } catch (error) {
    return res.status(500).json({ ok: false, mensaje: 'Error registrando ubicacion', detalle: error.message });
  }
});

app.put('/api/ubicaciones/:id', async function (req, res) {
  try {
    const idUbic = Number(req.params.id);
    const nombre = String(req.body.nombre || '').trim();
    const descripcion = String(req.body.descripcion || '').trim();

    if (!idUbic || !nombre) {
      return res.status(400).json({ ok: false, mensaje: 'Datos invalidos para editar ubicacion' });
    }

    const [actual] = await pool.query('SELECT id_ubicacion FROM ubicacion WHERE id_ubicacion = ? LIMIT 1', [idUbic]);
    if (!actual.length) {
      return res.status(404).json({ ok: false, mensaje: 'Ubicacion no encontrada' });
    }

    const [duplicada] = await pool.query('SELECT id_ubicacion FROM ubicacion WHERE id_ubicacion <> ? AND LOWER(TRIM(nombre)) = LOWER(TRIM(?)) LIMIT 1', [idUbic, nombre]);
    if (duplicada.length) {
      return res.status(409).json({ ok: false, mensaje: 'Ya existe otra ubicacion con ese nombre' });
    }

    await pool.query('UPDATE ubicacion SET nombre = ?, descripcion = ? WHERE id_ubicacion = ?', [nombre, descripcion, idUbic]);
    return res.json({ ok: true, mensaje: 'Ubicacion actualizada' });
  } catch (error) {
    return res.status(500).json({ ok: false, mensaje: 'Error editando ubicacion', detalle: error.message });
  }
});

app.delete('/api/ubicaciones/:id', async function (req, res) {
  try {
    const idUbic = Number(req.params.id);

    if (!idUbic) {
      return res.status(400).json({ ok: false, mensaje: 'ID de ubicacion invalido' });
    }

    const [usada] = await pool.query('SELECT COUNT(*) AS total FROM producto WHERE id_ubicacion = ?', [idUbic]);
    if (Number(usada[0].total || 0) > 0) {
      return res.status(409).json({ ok: false, mensaje: 'No puedes eliminar una ubicacion que tiene productos asociados' });
    }

    const [resultado] = await pool.query('DELETE FROM ubicacion WHERE id_ubicacion = ?', [idUbic]);

    if (!resultado.affectedRows) {
      return res.status(404).json({ ok: false, mensaje: 'Ubicacion no encontrada' });
    }

    return res.json({ ok: true, mensaje: 'Ubicacion eliminada' });
  } catch (error) {
    return res.status(500).json({ ok: false, mensaje: 'Error eliminando ubicacion', detalle: error.message });
  }
});

// Rutas para ubicaciones (bodegas)
app.get('/api/ubicaciones', async function (req, res) {
  try {
    const [rows] = await pool.query('SELECT id_ubicacion, nombre, descripcion FROM ubicacion ORDER BY id_ubicacion');
    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ ok: false, mensaje: 'Error consultando ubicaciones', detalle: error.message });
  }
});

app.post('/api/ubicaciones', async function (req, res) {
  try {
    const nombre = String(req.body.nombre || '').trim();
    const descripcion = String(req.body.descripcion || '').trim();

    if (!nombre) {
      return res.status(400).json({ ok: false, mensaje: 'El nombre de la ubicacion es obligatorio' });
    }

    const [existente] = await pool.query('SELECT id_ubicacion FROM ubicacion WHERE LOWER(TRIM(nombre)) = LOWER(TRIM(?)) LIMIT 1', [nombre]);
    if (existente.length) {
      return res.status(409).json({ ok: false, mensaje: 'Esa ubicacion ya existe' });
    }

    const [resultado] = await pool.query('INSERT INTO ubicacion (nombre, descripcion) VALUES (?, ?)', [nombre, descripcion]);
    return res.status(201).json({ ok: true, mensaje: 'Ubicacion registrada', id_ubicacion: resultado.insertId });
  } catch (error) {
    return res.status(500).json({ ok: false, mensaje: 'Error registrando ubicacion', detalle: error.message });
  }
});

app.put('/api/ubicaciones/:id', async function (req, res) {
  try {
    const idUbicacion = Number(req.params.id);
    const nombre = String(req.body.nombre || '').trim();
    const descripcion = String(req.body.descripcion || '').trim();

    if (!idUbicacion || !nombre) {
      return res.status(400).json({ ok: false, mensaje: 'Datos invalidos para editar ubicacion' });
    }

    const [actual] = await pool.query('SELECT id_ubicacion FROM ubicacion WHERE id_ubicacion = ? LIMIT 1', [idUbicacion]);
    if (!actual.length) {
      return res.status(404).json({ ok: false, mensaje: 'Ubicacion no encontrada' });
    }

    const [duplicada] = await pool.query('SELECT id_ubicacion FROM ubicacion WHERE id_ubicacion <> ? AND LOWER(TRIM(nombre)) = LOWER(TRIM(?)) LIMIT 1', [idUbicacion, nombre]);
    if (duplicada.length) {
      return res.status(409).json({ ok: false, mensaje: 'Ya existe otra ubicacion con ese nombre' });
    }

    await pool.query('UPDATE ubicacion SET nombre = ?, descripcion = ? WHERE id_ubicacion = ?', [nombre, descripcion, idUbicacion]);
    return res.json({ ok: true, mensaje: 'Ubicacion actualizada' });
  } catch (error) {
    return res.status(500).json({ ok: false, mensaje: 'Error editando ubicacion', detalle: error.message });
  }
});

app.delete('/api/ubicaciones/:id', async function (req, res) {
  try {
    const idUbicacion = Number(req.params.id);

    if (!idUbicacion) {
      return res.status(400).json({ ok: false, mensaje: 'ID de ubicacion invalido' });
    }

    const [usada] = await pool.query('SELECT COUNT(*) AS total FROM producto WHERE id_ubicacion = ?', [idUbicacion]);
    if (Number(usada[0].total || 0) > 0) {
      return res.status(409).json({ ok: false, mensaje: 'No puedes eliminar una ubicacion que tiene productos asociados' });
    }

    const [resultado] = await pool.query('DELETE FROM ubicacion WHERE id_ubicacion = ?', [idUbicacion]);

    if (!resultado.affectedRows) {
      return res.status(404).json({ ok: false, mensaje: 'Ubicacion no encontrada' });
    }

    return res.json({ ok: true, mensaje: 'Ubicacion eliminada' });
  } catch (error) {
    return res.status(500).json({ ok: false, mensaje: 'Error eliminando ubicacion', detalle: error.message });
  }
});

app.post('/api/login', async function (req, res) {
  try {
    const usuario = String(req.body.usuario || '').trim();
    const password = String(req.body.password || '').trim();

    if (!usuario || !password) {
      return res.status(400).json({ ok: false, mensaje: 'Usuario y contrasena son obligatorios' });
    }

    const sqlSistema = 'SELECT id_usuario_sistema, nombre, apellido, usuario, rol, correo FROM usuario_sistema WHERE usuario = ? AND contrasena = ? LIMIT 1';
    const [rowsSistema] = await pool.query(sqlSistema, [usuario, password]);

    if (rowsSistema.length) {
      return res.json({
        ok: true,
        usuario: {
          ...rowsSistema[0],
          tipo_usuario: 'sistema'
        }
      });
    }

    const sqlEstudiante = 'SELECT * FROM usuario WHERE correo = ? AND nu_identificacion = ? LIMIT 1';
    const [rowsEstudiante] = await pool.query(sqlEstudiante, [usuario, password]);

    if (!rowsEstudiante.length) {
      return res.status(401).json({ ok: false, mensaje: 'Credenciales invalidas' });
    }

    const estudiante = rowsEstudiante[0];

    return res.json({
      ok: true,
      usuario: {
        id_usuario: estudiante.id_usuario || estudiante.id || estudiante.id_estudiante || null,
        nombres_apellidos: estudiante.nombres_apellidos || '',
        usuario: estudiante.correo || usuario,
        tipo_usuario: 'estudiante',
        correo: estudiante.correo || usuario,
        carrera: estudiante.carrera || '',
        semestre: estudiante.semestre || 0,
        estudiante: estudiante
      }
    });
  } catch (error) {
    return res.status(500).json({ ok: false, mensaje: 'Error en login', detalle: error.message });
  }
});

app.get('/api/inventario', async function (req, res) {
  try {
    const sql = "SELECT p.id_producto, p.numero_item, p.nombre, p.stock_total, p.stock_minimo, p.marca, p.modelo, p.id_categoria, p.id_ubicacion, c.nombre AS categoria, u.nombre AS ubicacion, GREATEST(COALESCE((SELECT SUM(cantidad) FROM salida_inv WHERE id_producto = p.id_producto AND tipo_salida = 'Prestamo'), 0) - COALESCE((SELECT SUM(cantidad) FROM salida_inv WHERE id_producto = p.id_producto AND tipo_salida = 'Devolucion'), 0) - COALESCE((SELECT SUM(cantidad) FROM entrada_inv WHERE id_producto = p.id_producto AND id_proveedor IS NULL), 0), 0) AS prestamos_activos FROM producto p LEFT JOIN categoria c ON p.id_categoria = c.id_categoria LEFT JOIN ubicacion u ON p.id_ubicacion = u.id_ubicacion ORDER BY p.id_producto";
    const [rows] = await pool.query(sql);

    const respuesta = rows.map(function (item) {
      const prestamos = Number(item.prestamos_activos || 0);
      const total = Number(item.stock_total || 0);
      const disponibles = total - prestamos;
      return {
        id_producto: item.id_producto,
        numero_item: item.numero_item,
        nombre: item.nombre,
        marca: item.marca,
        modelo: item.modelo,
        stock_minimo: Number(item.stock_minimo || 0),
        id_categoria: item.id_categoria,
        categoria: item.categoria,
        id_ubicacion: item.id_ubicacion,
        ubicacion: item.ubicacion,
        stock_total: total,
        prestamos_activos: prestamos,
        disponibles: disponibles,
        estado: disponibles <= Number(item.stock_minimo || 0) ? 'Pocas unidades' : 'Disponible'
      };
    });

    return res.json(respuesta);
  } catch (error) {
    return res.status(500).json({ ok: false, mensaje: 'Error consultando inventario', detalle: error.message });
  }
});

app.get('/api/inventario/buscar', async function (req, res) {
  try {
    const q = String(req.query.q || '').trim();
    if (!q) {
      return res.json([]);
    }

    const sql = "SELECT p.id_producto, p.numero_item, p.nombre, p.stock_total, p.stock_minimo, p.marca, p.modelo, p.id_categoria, p.id_ubicacion, c.nombre AS categoria, u.nombre AS ubicacion, GREATEST(COALESCE((SELECT SUM(cantidad) FROM salida_inv WHERE id_producto = p.id_producto AND tipo_salida = 'Prestamo'), 0) - COALESCE((SELECT SUM(cantidad) FROM salida_inv WHERE id_producto = p.id_producto AND tipo_salida = 'Devolucion'), 0) - COALESCE((SELECT SUM(cantidad) FROM entrada_inv WHERE id_producto = p.id_producto AND id_proveedor IS NULL), 0), 0) AS prestamos_activos FROM producto p LEFT JOIN categoria c ON p.id_categoria = c.id_categoria LEFT JOIN ubicacion u ON p.id_ubicacion = u.id_ubicacion WHERE p.nombre LIKE ? OR p.marca LIKE ? OR p.modelo LIKE ? OR c.nombre LIKE ? OR u.nombre LIKE ? OR CAST(p.numero_item AS CHAR) LIKE ? OR CAST(p.id_producto AS CHAR) LIKE ? ORDER BY p.id_producto";
    const like = '%' + q + '%';
    const [rows] = await pool.query(sql, [like, like, like, like, like, like, like]);

    const data = rows.map(function (item) {
      const prestamos = Number(item.prestamos_activos || 0);
      const total = Number(item.stock_total || 0);
      const disponibles = total - prestamos;
      return {
        id_producto: item.id_producto,
        numero_item: item.numero_item,
        nombre: item.nombre,
        marca: item.marca,
        modelo: item.modelo,
        stock_minimo: Number(item.stock_minimo || 0),
        id_categoria: item.id_categoria,
        categoria: item.categoria,
        id_ubicacion: item.id_ubicacion,
        ubicacion: item.ubicacion,
        stock_total: total,
        prestamos_activos: prestamos,
        disponibles: disponibles,
        estado: disponibles <= Number(item.stock_minimo || 0) ? 'Pocas unidades' : 'Disponible'
      };
    });

    return res.json(data);
  } catch (error) {
    return res.status(500).json({ ok: false, mensaje: 'Error buscando inventario', detalle: error.message });
  }
});

app.post('/api/inventario', async function (req, res) {
  const conexion = await pool.getConnection();
  try {
    const numeroItem = Number(req.body.numero_item || 0);
    const nombre = String(req.body.nombre || '').trim();
    const stockTotal = Number(req.body.stock_total || 0);
    const stockMinimo = Number(req.body.stock_minimo || 0);
    const marca = String(req.body.marca || '').trim();
    const modelo = String(req.body.modelo || '').trim();
    const idCategoria = Number(req.body.id_categoria || 0);
    const idUbicacion = Number(req.body.id_ubicacion || 0);

    if (!numeroItem || !nombre || stockTotal < 1 || stockMinimo < 0 || !marca || !modelo || !idCategoria || !idUbicacion) {
      conexion.release();
      return res.status(400).json({ ok: false, mensaje: 'Completa todos los campos del producto' });
    }

    const [duplicado] = await conexion.query(
      'SELECT id_producto FROM producto WHERE numero_item = ? OR (LOWER(TRIM(nombre)) = LOWER(TRIM(?)) AND LOWER(TRIM(marca)) = LOWER(TRIM(?)) AND LOWER(TRIM(modelo)) = LOWER(TRIM(?)) AND id_categoria = ? AND id_ubicacion = ?) LIMIT 1',
      [numeroItem, nombre, marca, modelo, idCategoria, idUbicacion]
    );

    if (duplicado.length) {
      conexion.release();
      return res.status(409).json({ ok: false, mensaje: 'Ese producto ya esta registrado' });
    }

    await conexion.beginTransaction();

    const [categoriaRows] = await conexion.query('SELECT id_categoria FROM categoria WHERE id_categoria = ? LIMIT 1', [idCategoria]);
    if (!categoriaRows.length) {
      await conexion.rollback();
      conexion.release();
      return res.status(400).json({ ok: false, mensaje: 'La categoria seleccionada no existe' });
    }

    const [ubicacionRows] = await conexion.query('SELECT id_ubicacion FROM ubicacion WHERE id_ubicacion = ? LIMIT 1', [idUbicacion]);
    if (!ubicacionRows.length) {
      await conexion.rollback();
      conexion.release();
      return res.status(400).json({ ok: false, mensaje: 'La ubicacion seleccionada no existe' });
    }

    const sqlInsert = 'INSERT INTO producto (numero_item, nombre, stock_total, stock_minimo, marca, modelo, id_categoria, id_ubicacion) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
    const [resultado] = await conexion.query(sqlInsert, [numeroItem, nombre, stockTotal, stockMinimo, marca, modelo, idCategoria, idUbicacion]);

    await conexion.commit();
    conexion.release();

    return res.status(201).json({ ok: true, mensaje: 'Producto registrado', id_producto: resultado.insertId });
  } catch (error) {
    await conexion.rollback();
    conexion.release();
    return res.status(500).json({ ok: false, mensaje: 'Error registrando producto', detalle: error.message });
  }
});

app.put('/api/inventario/:id', async function (req, res) {
  const conexion = await pool.getConnection();
  try {
    const idProducto = Number(req.params.id);
    const numeroItem = Number(req.body.numero_item || 0);
    const nombre = String(req.body.nombre || '').trim();
    const stockTotal = Number(req.body.stock_total || 0);
    const stockMinimo = Number(req.body.stock_minimo || 0);
    const marca = String(req.body.marca || '').trim();
    const modelo = String(req.body.modelo || '').trim();
    const idCategoria = Number(req.body.id_categoria || 0);
    const idUbicacion = Number(req.body.id_ubicacion || 0);

    if (!idProducto || !numeroItem || !nombre || stockTotal < 1 || stockMinimo < 0 || !marca || !modelo || !idCategoria || !idUbicacion) {
      conexion.release();
      return res.status(400).json({ ok: false, mensaje: 'Completa todos los campos del producto' });
    }

    const [duplicado] = await conexion.query(
      'SELECT id_producto FROM producto WHERE id_producto <> ? AND (numero_item = ? OR (LOWER(TRIM(nombre)) = LOWER(TRIM(?)) AND LOWER(TRIM(marca)) = LOWER(TRIM(?)) AND LOWER(TRIM(modelo)) = LOWER(TRIM(?)) AND id_categoria = ? AND id_ubicacion = ?)) LIMIT 1',
      [idProducto, numeroItem, nombre, marca, modelo, idCategoria, idUbicacion]
    );

    if (duplicado.length) {
      conexion.release();
      return res.status(409).json({ ok: false, mensaje: 'Ya existe otro producto con esos datos' });
    }

    await conexion.beginTransaction();

    const [categoriaRows] = await conexion.query('SELECT id_categoria FROM categoria WHERE id_categoria = ? LIMIT 1', [idCategoria]);
    if (!categoriaRows.length) {
      await conexion.rollback();
      conexion.release();
      return res.status(400).json({ ok: false, mensaje: 'La categoria seleccionada no existe' });
    }

    const [ubicacionRows] = await conexion.query('SELECT id_ubicacion FROM ubicacion WHERE id_ubicacion = ? LIMIT 1', [idUbicacion]);
    if (!ubicacionRows.length) {
      await conexion.rollback();
      conexion.release();
      return res.status(400).json({ ok: false, mensaje: 'La ubicacion seleccionada no existe' });
    }

    const sql = 'UPDATE producto SET numero_item = ?, nombre = ?, stock_total = ?, stock_minimo = ?, marca = ?, modelo = ?, id_categoria = ?, id_ubicacion = ? WHERE id_producto = ?';
    const [resultado] = await conexion.query(sql, [numeroItem, nombre, stockTotal, stockMinimo, marca, modelo, idCategoria, idUbicacion, idProducto]);

    await conexion.commit();
    conexion.release();

    if (!resultado.affectedRows) {
      return res.status(404).json({ ok: false, mensaje: 'Producto no encontrado' });
    }

    return res.json({ ok: true, mensaje: 'Producto editado' });
  } catch (error) {
    await conexion.rollback();
    conexion.release();
    return res.status(500).json({ ok: false, mensaje: 'Error editando producto', detalle: error.message });
  }
});

app.delete('/api/inventario/:id', async function (req, res) {
  try {
    const idProducto = Number(req.params.id);
    if (!idProducto) {
      return res.status(400).json({ ok: false, mensaje: 'ID invalido' });
    }

    await pool.query('DELETE FROM entrada_inv WHERE id_producto = ?', [idProducto]);
    await pool.query('DELETE FROM salida_inv WHERE id_producto = ?', [idProducto]);
    const [resultado] = await pool.query('DELETE FROM producto WHERE id_producto = ?', [idProducto]);

    if (!resultado.affectedRows) {
      return res.status(404).json({ ok: false, mensaje: 'Producto no encontrado' });
    }

    return res.json({ ok: true, mensaje: 'Producto eliminado' });
  } catch (error) {
    return res.status(500).json({ ok: false, mensaje: 'Error eliminando producto', detalle: error.message });
  }
});

app.post('/api/prestamos', async function (req, res) {
  try {
    const idProducto = Number(req.body.id_producto || 0);
    const cantidad = Number(req.body.cantidad || 0);
    const responsable = String(req.body.responsable || 'Sistema').trim();

    if (!idProducto || cantidad < 1) {
      return res.status(400).json({ ok: false, mensaje: 'Datos invalidos para prestamo' });
    }

    const [productoRows] = await pool.query('SELECT stock_total FROM producto WHERE id_producto = ? LIMIT 1', [idProducto]);
    if (!productoRows.length) {
      return res.status(404).json({ ok: false, mensaje: 'Producto no encontrado' });
    }

    const sql = "INSERT INTO salida_inv (fecha, cantidad, tipo_salida, id_producto, responsable_entrega) VALUES (CURDATE(), ?, 'Solicitud Pendiente', ?, ?)";
    const [resultado] = await pool.query(sql, [cantidad, idProducto, responsable]);

    return res.status(201).json({
      ok: true,
      mensaje: 'Solicitud de préstamo registrada. Espera a que un administrador la apruebe.',
      id_solicitud: resultado.insertId
    });
  } catch (error) {
    return res.status(500).json({ ok: false, mensaje: 'Error registrando prestamo', detalle: error.message });
  }
});

// Obtener solicitudes de préstamo pendientes
app.get('/api/solicitudes-pendientes', async function (req, res) {
  try {
    const sql = `SELECT 
      si.id_salida, si.fecha, si.cantidad, si.responsable_entrega,
      p.id_producto, p.nombre, p.marca,
      c.nombre AS categoria
    FROM salida_inv si
    JOIN producto p ON si.id_producto = p.id_producto
    LEFT JOIN categoria c ON p.id_categoria = c.id_categoria
    WHERE si.tipo_salida = 'Solicitud Pendiente'
    ORDER BY si.fecha DESC`;
    
    const [rows] = await pool.query(sql);
    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ ok: false, mensaje: 'Error consultando solicitudes', detalle: error.message });
  }
});

app.get('/api/solicitudes-estudiante', async function (req, res) {
  try {
    const responsable = String(req.query.responsable || '').trim();
    const desdeId = Number(req.query.desde_id || 0);

    if (!responsable) {
      return res.status(400).json({ ok: false, mensaje: 'El responsable es obligatorio' });
    }

    let sql = `SELECT si.id_salida, si.fecha, si.cantidad, si.tipo_salida, si.id_producto, p.nombre AS producto
      FROM salida_inv si
      JOIN producto p ON si.id_producto = p.id_producto
      WHERE LOWER(si.responsable_entrega) = LOWER(?)`;
    const params = [responsable];

    if (desdeId > 0) {
      sql += ' AND si.id_salida > ?';
      params.push(desdeId);
    }

    sql += ' ORDER BY si.id_salida DESC LIMIT 50';

    const [rows] = await pool.query(sql, params);
    return res.json({ ok: true, solicitudes: rows });
  } catch (error) {
    return res.status(500).json({ ok: false, mensaje: 'Error consultando solicitudes del estudiante', detalle: error.message });
  }
});

// Aprobar solicitud de préstamo
app.put('/api/solicitudes-pendientes/:id/aprobar', async function (req, res) {
  const conexion = await pool.getConnection();
  try {
    const idSalida = Number(req.params.id);

    if (!idSalida) {
      conexion.release();
      return res.status(400).json({ ok: false, mensaje: 'ID invalido' });
    }

    await conexion.beginTransaction();

    const [solicitudRows] = await conexion.query('SELECT * FROM salida_inv WHERE id_salida = ? AND tipo_salida = ? LIMIT 1', [idSalida, 'Solicitud Pendiente']);
    
    if (!solicitudRows.length) {
      await conexion.rollback();
      conexion.release();
      return res.status(404).json({ ok: false, mensaje: 'Solicitud no encontrada' });
    }

    const solicitud = solicitudRows[0];
    const idProducto = solicitud.id_producto;
    const cantidad = solicitud.cantidad;

    const [productoRows] = await conexion.query('SELECT stock_total FROM producto WHERE id_producto = ? LIMIT 1', [idProducto]);
    if (!productoRows.length) {
      await conexion.rollback();
      conexion.release();
      return res.status(404).json({ ok: false, mensaje: 'Producto no encontrado' });
    }

    const prestamosActivos = await obtenerPrestamosActivosPorProducto(conexion, idProducto);
    const stockTotal = Number(productoRows[0].stock_total || 0);
    const disponibles = stockTotal - prestamosActivos;

    if (cantidad > disponibles) {
      await conexion.rollback();
      conexion.release();
      return res.status(400).json({ ok: false, mensaje: 'No hay unidades suficientes disponibles' });
    }

    await conexion.query('UPDATE salida_inv SET tipo_salida = ? WHERE id_salida = ?', ['Prestamo', idSalida]);

    await conexion.commit();
    conexion.release();

    return res.json({ ok: true, mensaje: 'Solicitud aprobada y registrada como préstamo' });
  } catch (error) {
    await conexion.rollback();
    conexion.release();
    return res.status(500).json({ ok: false, mensaje: 'Error aprobando solicitud', detalle: error.message });
  }
});

// Rechazar solicitud de préstamo
app.put('/api/solicitudes-pendientes/:id/rechazar', async function (req, res) {
  try {
    const idSalida = Number(req.params.id);

    if (!idSalida) {
      return res.status(400).json({ ok: false, mensaje: 'ID invalido' });
    }

    const [solicitudRows] = await pool.query('SELECT * FROM salida_inv WHERE id_salida = ? AND tipo_salida = ? LIMIT 1', [idSalida, 'Solicitud Pendiente']);
    
    if (!solicitudRows.length) {
      return res.status(404).json({ ok: false, mensaje: 'Solicitud no encontrada' });
    }

    await pool.query('DELETE FROM salida_inv WHERE id_salida = ?', [idSalida]);

    return res.json({ ok: true, mensaje: 'Solicitud rechazada y eliminada' });
  } catch (error) {
    return res.status(500).json({ ok: false, mensaje: 'Error rechazando solicitud', detalle: error.message });
  }
});

app.post('/api/devoluciones', async function (req, res) {
  try {
    const idProducto = Number(req.body.id_producto || 0);
    const cantidad = Number(req.body.cantidad || 0);
    const responsable = String(req.body.responsable || 'Sistema').trim();

    if (!idProducto || cantidad < 1) {
      return res.status(400).json({ ok: false, mensaje: 'Datos invalidos para devolucion' });
    }

    const [productoRows] = await pool.query('SELECT id_producto FROM producto WHERE id_producto = ? LIMIT 1', [idProducto]);
    if (!productoRows.length) {
      return res.status(404).json({ ok: false, mensaje: 'Producto no encontrado' });
    }

    const prestamosActivos = await obtenerPrestamosActivosPorProducto(pool, idProducto);

    if (cantidad > prestamosActivos) {
      return res.status(400).json({ ok: false, mensaje: 'No puedes devolver mas de lo prestado' });
    }

    const sql = 'INSERT INTO entrada_inv (fecha, costo, cantidad, id_producto, id_proveedor, empleado_recibe) VALUES (CURDATE(), 0, ?, ?, NULL, ?)';
    await pool.query(sql, [cantidad, idProducto, responsable]);

    return res.status(201).json({ ok: true, mensaje: 'Devolucion registrada en entrada de inventario' });
  } catch (error) {
    return res.status(500).json({ ok: false, mensaje: 'Error registrando devolucion', detalle: error.message });
  }
});

app.use(function (req, res) {
  return res.status(404).json({ ok: false, mensaje: 'Ruta no encontrada' });
});

app.listen(PORT, function () {
  console.log('Servidor iniciado en http://localhost:' + PORT);
});

