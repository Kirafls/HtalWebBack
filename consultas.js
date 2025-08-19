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
            userLevel: results[0].tipo_cuenta,
        };        
        //console.log("Cuenta validada:", usuario.num_emp);
        callback(null, usuario);
    });
}

function mostrar(connection, cadena, callback) {
    let query = `
        SELECT \`num_emp\`, \`nombre\`, \`turno\`, \`estado\` 
        FROM \`encargado\`
        WHERE \`num_emp\` LIKE ? OR \`nombre\` LIKE ?
    `;
    
    const searchParam = `%${cadena.trim()}%`; // Búsqueda parcial en ambos campos
    
    connection.query(query, [searchParam, searchParam], function(err, result) {
        if (err) {
            console.error("Error en la consulta:", err);
            return callback([]); // Devuelve array vacío si hay error
        }
        //console.log("Resultados encontrados:", result.length);
        callback(result);
    });
}

function cambiarStatus(connection, numemp, callback) {
    console.log("Cambiando estado para el usuario:", numemp);
    
    mostrar(connection, numemp, (result) => {
        if (result.length === 0) {
            return callback({ success: false, message: "Usuario no encontrado" });
        }
        
        const nuevoEstado = result[0].estado === 1 ? 0 : 1;
        const query = `
            UPDATE \`encargado\`
            SET \`estado\` = ?
            WHERE \`num_emp\` = ?
        `;
        
        connection.query(query, [nuevoEstado, numemp], (err, results) => {
            if (err) {
                console.error("Error al cambiar estado:", err);
                return callback({ 
                    success: false, 
                    message: "Error al cambiar estado",
                    error: err.message 
                });
            }
            
            if (results.affectedRows === 0) {
                return callback({ 
                    success: false, 
                    message: "No se actualizó ningún registro" 
                });
            }
            
            callback({ 
                success: true, 
                message: "Estado cambiado exitosamente",
                nuevoEstado: nuevoEstado
            });
        });
    });
}

function mostrarReportes(connection, callback) {
    const query = `
        SELECT * FROM \`reportes\` where \`estado\` = 1
    `;
    connection.query(query, (err, results) => {
        if (err) {
            console.error("Error en la consulta:", err);
            return callback([]);
        }
        callback(results);
    });
}

function registrosReportes(connection, callback) {
    const query = `
        SELECT * FROM \`reportes\`
    `;
    connection.query(query, (err, results) => {
        if (err) {
            console.error("Error en la consulta:", err);
            return callback([]);
        }
        callback(results);
    });
}

function cerrarReporte(conection,data,callback){
}


module.exports={validarCuenta, mostrar, cambiarStatus, registrosReportes, mostrarReportes, cerrarReporte};