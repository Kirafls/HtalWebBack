const mysql =require("mysql");

function validarCuenta(connection, numemp, contrasena, callback) {
    //console.log("Validando cuenta:", numemp);
    // Consulta que compara el hash SHA-256 de la contraseña proporcionada
    const query = `
        SELECT * FROM \`encargado\` 
        WHERE \`num_emp\` = ? 
        AND \`contrasena\` = SHA2(?, 256)
    `;
    const values = [numemp, contrasena];
    
    connection.query(query, values, (err, results) => {
        if (err) {
            console.error("Error en la consulta:", err);
            return callback({ error: "Error en la consulta", detalles: err.message });
        }
        if (results.length === 0) {
            return callback({ error: "Credenciales inválidas" });
        }
        
        // Devuelve solo los datos necesarios, excluyendo la contraseña
        const usuario = {
            num_emp: results[0].num_emp,
            nombre: results[0].nombre,
        };        
        //console.log("Cuenta validada:", usuario.num_emp);
        callback(null, usuario);
    });
}
module.exports={validarCuenta};


/*function nuevo(conection,data,callback){
    let insertQuery="INSERT INTO `user`(`Nombre`, `Apellido`, `Prepa`, `Carrera`, `Fecha_na`, `Genero`, `Promedio`) VALUES (?,?,?,?,?,?,?)";
    let query =mysql.format(insertQuery, [data.nombre,data.apellido,data.prepa,data.carrera,data.fecha,data.genero,data.promedio]);
    conection.query(query,function(err,result){
        if(err) throw err;
        callback(result);
    });
}

function mostrar(conection,callback){
    let query="SELECT * FROM `user`";
    conection.query(query,function(err,result){
        if(err) throw err;
        callback(result);
    });
}
function eliminar(conection,data,callback){
    let insertQuery="DELETE FROM `user` WHERE `ID`=?";
    let query =mysql.format(insertQuery, [data.id]);
    conection.query(query,function(err,result){
        if(err) throw err;
        callback(result);
    });
*/