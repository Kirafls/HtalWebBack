const express = require("express");  
const app = express();
const puerto=3000;
const mysql=require("mysql");
const {validarCuenta,mostrar,cambiarStatus,mostrarReportes}=require("./consultas");
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
    console.log("Coneccion con la base de datos");
})
app.get("/",(req,res)=>{
    res.send("Servidor corriendo");
})

app.post('/login', (req, res) => {
    const { numemp, contrasena } = req.body;

    if (!numemp || !contrasena) {
        return res.status(400).json({ error: "Número de empleado y contraseña son requeridos" });
    }

    console.log("Intento de login para:", numemp);

    validarCuenta(connection, numemp, contrasena, (err, usuario) => {
        if (err) {
            console.error("Error en autenticación:", err.error);
            return res.status(401).json(err); // 401 Unauthorized
        }

        console.log("Login exitoso para:", usuario);

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

app.post("/mostrar", (req, res) => {
    const cadena = req.body.cadena;
    mostrar(connection, cadena, (result) => {
        res.send(result);
    });
});

app.post("/cstatus", (req, res) => {
    const numemp = req.body.cadena;
    
    if (!numemp) {
        return res.status(400).json({ 
            success: false, 
            message: "Número de empleado no proporcionado" 
        });
    }
    
    cambiarStatus(connection, numemp, (result) => {
        if (result.success) {
            res.status(200).json(result);
        } else {
            res.status(404).json(result);
        }
    });
});

app.get("/reportes", (req, res) => {
    mostrarReportes(connection, (result) => {
        res.send(result);
    });
});



app.listen(puerto, () => {
  console.log(`Servidor corriendo en el puerto `+puerto);
});


/*app.post("/nuevo",(req,res)=>{
    let nombre=req.body.nombre;
    let apellido=req.body.apellido;
    let carrera=req.body.carrera;
    let fecha=req.body.fecha;
    let promedio=req.body.promedio;
    let genero=req.body.genero;
    let prepa=req.body.prepa;
    nuevo(connection,{nombre:nombre,apellido:apellido,prepa:prepa,carrera:carrera,fecha:fecha,genero:genero,promedio:promedio},result=>{
        res.send(result);
    });
})

app.post("/eliminar",(req,res)=>{
    let id=req.body.id;
    eliminar(connection,{id:id},result=>{
        res.send(result);
    });
})


app.get("/mostrar",(req,res)=>{
    mostrar(connection,result=>{
        res.send(result);
    })
})*/

