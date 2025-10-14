const {
  validarCuenta,
  mostrar,
  cambiarStatus,
  modificarUser,
  cambiarContrasena,
} = require("../consultas");

describe("Pruebas unitarias de consultas.js", () => {
  let mockConnection;

  beforeEach(() => {
    // Cada prueba tendrá su propio mock
    mockConnection = {
      query: jest.fn(),
    };
  });

  // ✅ validarCuenta()
  test("Debe devolver usuario válido si las credenciales son correctas", (done) => {
    const fakeResults = [{ num_emp: "123", nombre: "Saul", tipo_cuenta: 0 }];

    mockConnection.query.mockImplementation((query, values, callback) => {
      callback(null, fakeResults);
    });

    validarCuenta(mockConnection, "123", "1234", (err, usuario) => {
      expect(err).toBeNull();
      expect(usuario).toEqual({
        num_emp: "123",
        nombre: "Saul",
        userLevel: 0,
      });
      done();
    });
  });

  test("Debe devolver error si no se encuentra el usuario", (done) => {
    mockConnection.query.mockImplementation((query, values, callback) => {
      callback(null, []); // No hay resultados
    });

    validarCuenta(mockConnection, "999", "wrong", (result) => {
      expect(result).toHaveProperty("error");
      expect(result.error).toMatch(/Credenciales inválidas/);
      done();
    });
  });

  // ✅ mostrar()
  test("Debe devolver resultados en mostrar()", (done) => {
    const fakeUsers = [{ num_emp: "2", nombre: "Carlos" }];
    mockConnection.query.mockImplementation((q, v, cb) => cb(null, fakeUsers));

    mostrar(mockConnection, "Car", "1", (result) => {
      expect(result).toEqual(fakeUsers);
      done();
    });
  });

  // ✅ modificarUser()
  test("Debe devolver éxito al modificar un usuario", (done) => {
    mockConnection.query.mockImplementation((q, v, cb) => cb(null, { affectedRows: 1 }));

    modificarUser(mockConnection, "123", "Saul", "Mañana", 1, 0, (res) => {
      expect(res.success).toBe(true);
      expect(res.message).toMatch(/exitosamente/);
      done();
    });
  });

  // ✅ cambiarContrasena()
  test("Debe devolver error si no se actualiza ninguna fila al cambiar contraseña", (done) => {
    mockConnection.query.mockImplementation((q, v, cb) => cb(null, { affectedRows: 0 }));

    cambiarContrasena(mockConnection, "123", "newpass", (res) => {
      expect(res.success).toBe(false);
      expect(res.message).toMatch(/No se actualizó/);
      done();
    });
  });

  // ✅ cambiarStatus()
  test("Debe alternar el estado del usuario correctamente", (done) => {
    // Primera consulta devuelve estado actual = 1
    mockConnection.query
      .mockImplementationOnce((q, v, cb) => cb(null, [{ estado: 1 }]))
      .mockImplementationOnce((q, v, cb) => cb(null, { affectedRows: 1 }));

    cambiarStatus(mockConnection, "123", (res) => {
      expect(res.success).toBe(true);
      expect(res.nuevoEstado).toBe(0);
      done();
    });
  });
});
const {
  mostrarReportes,
  registrosHistorialReportes,
  cerrarReporte,
} = require("../consultas");

describe("Pruebas adicionales para consultas.js", () => {
  let mockConnection;

  beforeEach(() => {
    mockConnection = { query: jest.fn() };
  });

  // ✅ mostrarReportes()
  test("Debe devolver reportes activos correctamente", (done) => {
    const fakeReportes = [{ id_reporte: 1, estado: 1 }];
    mockConnection.query.mockImplementation((q, cb) => cb(null, fakeReportes));

    mostrarReportes(mockConnection, (result) => {
      expect(result).toEqual(fakeReportes);
      done();
    });
  });

  test("Debe devolver [] si hay error en mostrarReportes()", (done) => {
    mockConnection.query.mockImplementation((q, cb) => cb(new Error("Fallo SQL")));

    mostrarReportes(mockConnection, (result) => {
      expect(result).toEqual([]);
      done();
    });
  });

  // ✅ registrosHistorialReportes()
  test("Debe devolver reportes cerrados correctamente", (done) => {
    const fakeReportes = [{ id_reporte: 2, estado: 0 }];
    mockConnection.query.mockImplementation((q, cb) => cb(null, fakeReportes));

    registrosHistorialReportes(mockConnection, (result) => {
      expect(result).toEqual(fakeReportes);
      done();
    });
  });

  test("Debe devolver [] si hay error en registrosHistorialReportes()", (done) => {
    mockConnection.query.mockImplementation((q, cb) => cb(new Error("Error SQL")));

    registrosHistorialReportes(mockConnection, (result) => {
      expect(result).toEqual([]);
      done();
    });
  });

  // ✅ cerrarReporte()
  test("Debe cerrar un reporte y actualizar herramental correctamente", (done) => {
    // 1. Primera consulta (UPDATE reportes)
    mockConnection.query
      .mockImplementationOnce((q, v, cb) => cb(null, { affectedRows: 1 }))
      // 2. Segunda consulta (UPDATE herramental)
      .mockImplementationOnce((q, v, cb) => cb(null, { affectedRows: 1 }));

    cerrarReporte(mockConnection, 10, "Solucionado", 5, (res) => {
      expect(res.success).toBe(true);
      expect(res.message).toMatch(/cerrado exitosamente/);
      done();
    });
  });

  test("Debe manejar error al cerrar reporte si falla la actualización", (done) => {
    mockConnection.query.mockImplementation((q, v, cb) => cb(new Error("Fallo SQL")));

    cerrarReporte(mockConnection, 10, "Solución", 5, (res) => {
      expect(res.success).toBe(false);
      expect(res.message).toMatch(/Error al cerrar reporte/);
      done();
    });
  });

  test("Debe manejar caso donde no se actualiza ningún reporte", (done) => {
    mockConnection.query.mockImplementation((q, v, cb) => cb(null, { affectedRows: 0 }));

    cerrarReporte(mockConnection, 10, "Nada", 5, (res) => {
      expect(res.success).toBe(false);
      expect(res.message).toMatch(/No se actualizó ningún reporte/);
      done();
    });
  });

  test("Debe manejar error al actualizar herramental", (done) => {
    // 1. update reportes OK
    mockConnection.query
      .mockImplementationOnce((q, v, cb) => cb(null, { affectedRows: 1 }))
      // 2. update herramental falla
      .mockImplementationOnce((q, v, cb) => cb(new Error("Error update herramental")));

    cerrarReporte(mockConnection, 10, "Solución", 5, (res) => {
      expect(res.success).toBe(false);
      expect(res.message).toMatch(/Error al actualizar herramental/);
      done();
    });
  });

  test("Debe manejar caso donde no se actualiza ningún herramental", (done) => {
    // 1. update reportes OK
    mockConnection.query
      .mockImplementationOnce((q, v, cb) => cb(null, { affectedRows: 1 }))
      // 2. update herramental no afecta filas
      .mockImplementationOnce((q, v, cb) => cb(null, { affectedRows: 0 }));

    cerrarReporte(mockConnection, 10, "Solución", 5, (res) => {
      expect(res.success).toBe(false);
      expect(res.message).toMatch(/No se actualizó ningún herramental/);
      done();
    });
  });
});
