/**
 * ================================
 * IMPORTACIÓN DE DEPENDENCIAS
 * ================================
 */
const express = require("express");
const mysql = require("mysql");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");

/**
 * ================================
 * IMPORTACIÓN DE FUNCIONES DE BD
 * ================================
 */
const {
  validarCuenta,
  mostrar,
  cambiarStatus,
  mostrarReportes,
  modificarUser,
  registrosHistorialReportes,
  cerrarReporte,
  cambiarContrasena
} = require("./consultas");

/**
 * ================================
 * CONFIGURACIÓN INICIAL
 * ================================
 */
const app = express();
const PUERTO = 3000;
const SECRET_KEY = "tu_clave_secreta";

/**
 * ================================
 * MIDDLEWARES
 * ================================
 * - cors(): permite peticiones desde otros dominios
 * - bodyParser: permite leer JSON y datos de formularios
 */
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

/**
 * ================================
 * CONEXIÓN A BASE DE DATOS MYSQL
 * ================================
 */
const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "bdherramentales",
});

// Conectar a la base de datos
connection.connect((err) => {
  if (err) throw err;
  // console.log("Conectado a la base de datos");
});

/**
 * ================================
 * RUTA PRINCIPAL
 * ================================
 */
app.get("/", (req, res) => {
  res.send("Servidor corriendo");
});

/**
 * ================================
 * AUTENTICACIÓN (LOGIN)
 * ================================
 * - Valida usuario y contraseña
 * - Genera un JWT si es correcto
 */
app.post("/login", (req, res) => {
  const { numemp, contrasena } = req.body;

  // Validación de datos
  if (!numemp || !contrasena) {
    return res.status(400).json({
      error: "Número de empleado y contraseña son requeridos",
    });
  }

  validarCuenta(connection, numemp, contrasena, (err, usuario) => {
    if (err) {
      return res.status(401).json(err);
    }

    // Generación del token JWT
    const token = jwt.sign(
      {
        num_emp: usuario.num_emp,
        nombre: usuario.nombre,
        userLevel: usuario.userLevel,
      },
      SECRET_KEY,
      { expiresIn: "2h" }
    );

    // Respuesta exitosa
    res.status(200).json({
      success: true,
      message: "Autenticación exitosa",
      token,
      usuario: {
        num_emp: usuario.num_emp,
        nombre: usuario.nombre,
        userLevel: usuario.userLevel,
      },
    });
  });
});

/**
 * ================================
 * USUARIOS
 * ================================
 */

/**
 * Obtener usuarios filtrados
 */
app.post("/data/usuarios", (req, res) => {
  const { cadena, numemp } = req.body;

  mostrar(connection, cadena, numemp, (result) => {
    res.send(result);
  });
});

/**
 * Modificar datos de usuario
 */
app.post("/data/modificar", (req, res) => {
  const { numemp, nombre, turno, estado, permiso } = req.body;

  if (!numemp) {
    return res.status(400).json({
      success: false,
      message: "Número de empleado no proporcionado",
    });
  }

  modificarUser(
    connection,
    numemp,
    nombre,
    turno,
    estado,
    permiso,
    (result) => {
      res.send(result);
    }
  );
});

/**
 * Cambiar estado (activo/inactivo) del usuario
 */
app.post("/data/cambiarStatus", (req, res) => {
  const { numemp } = req.body;

  if (!numemp) {
    return res.status(400).json({
      success: false,
      message: "Número de empleado no proporcionado",
    });
  }

  cambiarStatus(connection, numemp, (result) => {
    res.send(result);
  });
});

/**
 * Cambiar contraseña
 */
app.post("/data/cambioc", (req, res) => {
  const { numemp, nuevaContrasena } = req.body;

  if (!numemp || !nuevaContrasena) {
    return res.status(400).json({
      success: false,
      message: "Número de empleado y nueva contraseña son requeridos",
    });
  }

  cambiarContrasena(connection, numemp, nuevaContrasena, (result) => {
    res.send(result);
  });
});

/**
 * ================================
 * REPORTES
 * ================================
 */

/**
 * Obtener reportes activos
 */
app.get("/data/reportes", (req, res) => {
  mostrarReportes(connection, (result) => {
    res.send(result);
  });
});

/**
 * Historial de reportes cerrados
 */
app.get("/data/historialreportes", (req, res) => {
  registrosHistorialReportes(connection, (result) => {
    res.send(result);
  });
});

/**
 * Cerrar un reporte
 */
app.post("/data/cerrarReporte", (req, res) => {
  const { id_reporte, solucion, id_htal } = req.body;

  if (!id_reporte || !solucion || !id_htal) {
    return res.status(400).json({
      error: "ID de reporte, solución e ID de herramental son requeridos",
    });
  }

  cerrarReporte(
    connection,
    id_reporte,
    solucion,
    id_htal,
    (result) => {
      res.send(result);
    }
  );
});

/**
 * ================================
 * ESTADÍSTICAS
 * ================================
 */

/**
 * Reportes cerrados por mes
 */
app.get("/data/reportesMensuales", (req, res) => {
  const query = `
    SELECT MONTH(fecha_cierre) AS mes, COUNT(*) AS total
    FROM reportes
    WHERE estado = 0
    GROUP BY MONTH(fecha_cierre)
    ORDER BY mes;
  `;

  connection.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ error: "Error al obtener datos" });
    }
    res.json(results);
  });
});

/**
 * Herramentales usados por día
 */
app.get("/data/htalxdia", (req, res) => {
  const query = `
    SELECT DATE(fecha_entrega) AS dia, COUNT(*) AS total
    FROM registro
    GROUP BY DATE(fecha_entrega)
    ORDER BY dia;
  `;

  connection.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ error: "Error al obtener herramentales" });
    }
    res.json(results);
  });
});

/**
 * Herramentales más usados
 */
app.get("/data/masusados", (req, res) => {
  const query = `
    SELECT id_htal,
           SUM(TIMESTAMPDIFF(HOUR, fecha_prestamo, fecha_entrega)) AS horas_uso
    FROM registro
    WHERE fecha_entrega IS NOT NULL
    GROUP BY id_htal
    ORDER BY horas_uso DESC
    LIMIT 25;
  `;

  connection.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ error: "Error al obtener datos" });
    }
    res.json(results);
  });
});

/**
 * ================================
 * RUTA DE PRUEBA
 * ================================
 */
app.get("/api/saludo", (req, res) => {
  res.json({
    mensaje:
      "Hola desde Node JS, inicio de proyecto y comunicación con el back 🚀",
  });
});

/**
 * ================================
 * INICIAR SERVIDOR
 * ================================
 */
app.listen(PUERTO, () => {
  console.log(`Servidor levantado en el puerto: ${PUERTO}`);
});
