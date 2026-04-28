require('dotenv').config();
const mysql = require('mysql2/promise');

async function main() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'inventario_db'
  });

  const responsable = 'PruebaQA';

  await pool.query('DELETE FROM entrada_inv WHERE empleado_recibe = ?', [responsable]);
  await pool.query("DELETE FROM salida_inv WHERE tipo_salida = 'Devolucion' AND responsable_entrega = ?", [responsable]);

  let idProducto = Number(process.argv[2] || 0);

  if (!idProducto) {
    const sqlProducto = "SELECT p.id_producto, GREATEST(COALESCE((SELECT SUM(cantidad) FROM salida_inv WHERE id_producto = p.id_producto AND tipo_salida = 'Prestamo'), 0) - COALESCE((SELECT SUM(cantidad) FROM salida_inv WHERE id_producto = p.id_producto AND tipo_salida = 'Devolucion'), 0) - COALESCE((SELECT SUM(cantidad) FROM entrada_inv WHERE id_producto = p.id_producto AND id_proveedor IS NULL), 0), 0) AS activos FROM producto p HAVING activos > 0 ORDER BY activos DESC, p.id_producto LIMIT 1";
    const [productos] = await pool.query(sqlProducto);

    if (!productos.length) {
      console.error('No hay productos con prestamos activos para ejecutar la prueba de devolucion.');
      await pool.end();
      process.exit(1);
    }

    idProducto = Number(productos[0].id_producto);
  }

  const [antesEntrada] = await pool.query(
    'SELECT COUNT(*) AS total FROM entrada_inv WHERE id_producto = ? AND empleado_recibe = ?',
    [idProducto, responsable]
  );

  const [antesSalida] = await pool.query(
    "SELECT COUNT(*) AS total FROM salida_inv WHERE id_producto = ? AND tipo_salida = 'Devolucion' AND responsable_entrega = ?",
    [idProducto, responsable]
  );

  const respuesta = await fetch('http://localhost:3000/api/devoluciones', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id_producto: idProducto, cantidad: 1, responsable: responsable })
  });

  const data = await respuesta.json();

  const [despuesEntrada] = await pool.query(
    'SELECT COUNT(*) AS total FROM entrada_inv WHERE id_producto = ? AND empleado_recibe = ?',
    [idProducto, responsable]
  );

  const [despuesSalida] = await pool.query(
    "SELECT COUNT(*) AS total FROM salida_inv WHERE id_producto = ? AND tipo_salida = 'Devolucion' AND responsable_entrega = ?",
    [idProducto, responsable]
  );

  console.log('POST /api/devoluciones ->', respuesta.status, JSON.stringify(data));
  console.log('id_producto de prueba ->', idProducto);
  console.log('entrada_inv QA antes/despues ->', antesEntrada[0].total, despuesEntrada[0].total);
  console.log('salida_inv devolucion QA antes/despues ->', antesSalida[0].total, despuesSalida[0].total);

  await pool.query('DELETE FROM entrada_inv WHERE id_producto = ? AND empleado_recibe = ?', [idProducto, responsable]);
  await pool.query("DELETE FROM salida_inv WHERE id_producto = ? AND tipo_salida = 'Devolucion' AND responsable_entrega = ?", [idProducto, responsable]);
  await pool.end();

  if (!respuesta.ok) {
    process.exit(1);
  }

  if (despuesEntrada[0].total !== antesEntrada[0].total + 1) {
    console.error('Fallo: no se registro devolucion en entrada_inv');
    process.exit(1);
  }

  if (despuesSalida[0].total !== antesSalida[0].total) {
    console.error('Fallo: se registro devolucion en salida_inv y no deberia');
    process.exit(1);
  }
}

main().catch(function (error) {
  console.error(error);
  process.exit(1);
});

