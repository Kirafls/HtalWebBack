const mysql =require("mysql");

function validarCuenta(connection, numemp, contrasena, callback) {
    //console.log("Validando cuenta:", numemp);
    // Consulta que compara el hash SHA-256 de la contraseña proporcionada
    const query = `
    SELECT * FROM \`encargado\` 
    WHERE \`num_emp\` = ? 
      AND \`contrasena\` = SHA2(?, 256)
      AND \`tipo_cuenta\` = 0
      AND \`estado\` = 1
`;
const values = [numemp, contrasena];

connection.query(query, values, (err, results) => {
    if (err) {
        console.error("Error en la consulta:", err);
        return callback({ error: "Error en la consulta", detalles: err.message });
    }

    if (results.length === 0) {
        // Puede ser por credenciales incorrectas o permisos insuficientes
        return callback({ error: "Credenciales inválidas o no tienes los permisos necesarios" });
    }
    
    // Devuelve solo los datos necesarios, excluyendo la contraseña
    const usuario = {
        num_emp: results[0].num_emp,
        nombre: results[0].nombre,
        userLevel: results[0].tipo_cuenta,
    };        

    callback(null, usuario);
});
}

function mostrar(connection, cadena, numemp, callback) {
  let query = `
    SELECT \`num_emp\`, \`nombre\`, \`turno\`, \`estado\`, \`tipo_cuenta\`
    FROM \`encargado\`
    WHERE num_emp != ? 
      AND (\`num_emp\` LIKE ? OR \`nombre\` LIKE ?)
`;

const searchParam = `%${cadena.trim()}%`; // Búsqueda parcial en ambos campos

connection.query(query, [numemp, searchParam, searchParam], function(err, result) {
    if (err) {
        console.error("Error en la consulta:", err);
        return callback([]); // Devuelve array vacío si hay error
    }
    //console.log("Resultados encontrados:", result.length);
    callback(result);
});
}

function modificarUser(connection, numemp, nombre, turno, estado, tipo_cuenta, callback) {
    let query = `
        UPDATE \`encargado\`
        SET \`nombre\` = ?, \`turno\` = ?, \`estado\` = ?, \`tipo_cuenta\` = ?
        WHERE \`num_emp\` = ?
    `;
    connection.query(query, [nombre, turno, estado, tipo_cuenta, numemp], (err, results) => {
        if (err) {
            console.error("Error al modificar usuario:", err);
            return callback({ success: false, message: "Error al modificar usuario", error: err.message });
        }
        if (results.affectedRows === 0) {
            return callback({ success: false, message: "No se actualizó ningún registro" });
        }
        callback({ success: true, message: "Usuario modificado exitosamente" });
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

function registrosHistorialReportes(connection, callback) {
    const query = `
        SELECT * FROM \`reportes\` where \`estado\` = 0
    `;
    connection.query(query, (err, results) => {
        if (err) {
            console.error("Error en la consulta:", err);
            return callback([]);
        }
        callback(results);
    });
}

function cerrarReporte(connection, id_reporte, solucion, id_herramental, callback) {
let query = `
        UPDATE \`reportes\`
        SET \`estado\` = 0, \`solucion\` = ?, \`fecha_cierre\` = NOW()
        WHERE \`id_reporte\` = ?
    `;

    connection.query(query, [solucion, id_reporte], (err, results) => {
        if (err) {
            console.error("Error al cerrar reporte:", err);
            return callback({ success: false, message: "Error al cerrar reporte", error: err.message });
        }
        if (results.affectedRows === 0) {
            return callback({ success: false, message: "No se actualizó ningún reporte" });
        }

        // Si el primer update fue exitoso → ejecutar el segundo
        query = `
            UPDATE \`heramental\`
            SET \`reporte\` = 0
            WHERE \`id_herramental\` = ?
        `;
        connection.query(query, [id_herramental], (err, results) => {
            if (err) {
                console.error("Error al actualizar herramental:", err);
                return callback({ success: false, message: "Error al actualizar herramental", error: err.message });
            }
            if (results.affectedRows === 0) {
                return callback({ success: false, message: "No se actualizó ningún herramental" });
            }

            // ✅ Solo aquí se responde exitosamente
            callback({ success: true, message: "Reporte cerrado exitosamente" });
        });
    });
}

function cambiarContrasena(connection, numemp, nuevaContrasena, callback) {
    const query = `
        UPDATE \`encargado\`
        SET \`contrasena\` = SHA2(?, 256)
        WHERE \`num_emp\` = ?
    `;
    connection.query(query, [nuevaContrasena, numemp], (err, results) => {
        if (err) {
            console.error("Error al cambiar contraseña:", err);
            return callback({ success: false, message: "Error al cambiar contraseña", error: err.message });
        }
        if (results.affectedRows === 0) {
            return callback({ success: false, message: "No se actualizó ningún registro" });
        }
        callback({ success: true, message: "Contraseña cambiada exitosamente" });
    });
}

module.exports={validarCuenta, mostrar, cambiarStatus, registrosHistorialReportes, mostrarReportes, cerrarReporte, modificarUser, cambiarContrasena};