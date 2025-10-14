const express = require("express");  
const app = express();
const puerto=3000;
const mysql=require("mysql");
const {validarCuenta,mostrar,cambiarStatus,mostrarReportes, modificarUser, registrosHistorialReportes ,cerrarReporte, cambiarContrasena}=require("./consultas");
const cors=require('cors');
const jwt = require('jsonwebtoken');
const SECRET_KEY = "tu_clave_secreta";
const bodyparse=require("body-parser");


app.use(cors());
app.use(bodyparse.json());
app.use(bodyparse.urlencoded({extended:false}));

const connection =mysql.createConnection({
    host:"localhost",
    user:"root",
    password:"",
    database:"bdherramentales",
});

connection.connect((err)=>{
    if(err) throw err;
    //console.log("Conectado a la base de datos");
})
app.get("/",(req,res)=>{
    res.send("Servidor corriendo");
})

app.post('/login', (req, res) => {
    const { numemp, contrasena } = req.body;

    if (!numemp || !contrasena) {
        return res.status(400).json({ error: "Número de empleado y contraseña son requeridos" });
    }

    //console.log("Intento de login para:", numemp);

    validarCuenta(connection, numemp, contrasena, (err, usuario) => {
        if (err) {
            //console.error("Error en autenticación:", err.error);
            return res.status(401).json(err); // 401 Unauthorized
        }

        //console.log("Login exitoso para:", usuario);

        // ✅ Generar JWT con datos básicos del usuario
        const token = jwt.sign(
            {
                num_emp: usuario.num_emp,
                nombre: usuario.nombre,
                userLevel: usuario.userLevel
            },
            SECRET_KEY,
            { expiresIn: '2h' } // expira en 2 horas
        );
        // ✅ Respuesta con token y usuario
        res.status(200).json({
            success: true,
            message: "Autenticación exitosa",
            token,  
            usuario: {
                num_emp: usuario.num_emp,
                nombre: usuario.nombre,
                userLevel: usuario.userLevel
                
            }
        });
    });
});

app.post("/data/usuarios", (req, res) => {
    const cadena = req.body.cadena;
    const numemp = req.body.numemp;
    mostrar(connection, cadena, numemp, (result) => {
        res.send(result);
    });
});

app.post("/data/modificar", (req, res) => {
    const numemp = req.body.numemp;
    const nombre = req.body.nombre;
    const turno = req.body.turno;
    const estado = req.body.estado;
    const tipo_cuenta = req.body.permiso;

    if (!numemp) {
        return res.status(400).json({ 
            success: false, 
            message: "Número de empleado no proporcionado" 
        });
    }

    modificarUser(connection, numemp, nombre, turno, estado, tipo_cuenta, (result) => {
        res.send(result);
    });
});

app.get("/data/reportes", (req, res) => {
    mostrarReportes(connection, (result) => {
        res.send(result);
    });
});

app.get("/data/historialreportes", (req, res) => {
    registrosHistorialReportes(connection, (result) => {
        res.send(result);
    });
});

app.post("/data/cerrarReporte", (req, res) => {
    const { id_reporte, solucion, id_htal } = req.body;
    //console.log("Cerrando reporte:", id_htal , id_reporte, solucion);
    if (!id_reporte || !solucion || !id_htal) {
        //console.log("Datos incompletos para cerrar reporte");
        return res.status(400).json({ error: "ID de reporte, solución e ID de herramental son requeridos" });
    }
    cerrarReporte(connection, id_reporte, solucion, id_htal, (result) => {
        res.send(result);
    });
});

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
      //console.error("Error en consulta:", err);
      return res.status(500).json({ error: "Error al obtener datos" });
    }

    // Devolver como JSON
    res.json(results);
  });
});

app.get('/data/htalxdia', (req, res) => {
  const query = `
    SELECT DATE(fecha_entrega) AS dia, COUNT(*) AS total
    FROM registro
    WHERE 1
    GROUP BY DATE(fecha_entrega)
    ORDER BY dia;
  `;
  connection.query(query, (err, results) => {
    if (err) {
      //console.error(err);
      return res.status(500).json({ error: 'Error al obtener herramentales' });
    }
    res.json(results);
  });
});

app.get("/data/masusados", (req, res) => {
  const query = `
    SELECT 
    id_htal, 
    SUM(TIMESTAMPDIFF(HOUR, fecha_prestamo, fecha_entrega)) AS horas_uso
    FROM registro
    WHERE fecha_entrega IS NOT NULL -- para evitar errores si aún no se entregó
    GROUP BY id_htal
    ORDER BY horas_uso DESC
    LIMIT 25;
  `;
  connection.query(query, (err, results) => {
    if (err) {
      //console.error(err);
      return res.status(500).json({ error: 'Error al obtener datos' });
    }
    res.json(results);
  });
});

app.get("/api/saludo", (req, res) => {
  res.json({ mensaje: "Hola desde Node JS, inicio de proyecto y comunicacion con el back 🚀" });
});
//Aplicacion web
app.post("/data/cambiarStatus", (req, res) => {
    const numemp = req.body.numemp;
    if (!numemp) {
        return res.status(400).json({ 
            success: false, 
            message: "Número de empleado no proporcionado" 
        });
    }

    cambiarStatus(connection, numemp, (result) => {
        res.send(result);
    });
});

app.post("/data/cambioc", (req, res) => {
    const { numemp, nuevaContrasena } = req.body;
    if (!numemp || !nuevaContrasena) {
        return res.status(400).json({
            success: false,
            message: "Número de empleado y nueva contraseña son requeridos"
        });
    }

    cambiarContrasena(connection, numemp, nuevaContrasena, (result) => {
        res.send(result);
    });
});

app.listen(puerto, () => {
  console.log(`Servidor corriendo en el puerto `+puerto);
});

