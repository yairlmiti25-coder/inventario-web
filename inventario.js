/**
 * inventario.js
 * Lógica de negocio y persistencia para el Sistema de Inventario
 * Almacenamiento persistente en localStorage y manejo de casos alternos.
 */

const STORAGE_KEY = 'inventario_web_productos';

// Datos iniciales de demostración
const PRODUCTOS_INICIALES = [
    { id: 1, nombre: "Lápiz", categoria: "Papelería", descripcion: "Lápiz grafito HB estándar", existencia: 120 },
    { id: 2, nombre: "Cuaderno", categoria: "Papelería", descripcion: "Cuaderno profesional raya 100 hojas", existencia: 50 },
    { id: 3, nombre: "Borrador", categoria: "Papelería", descripcion: "Goma de borrar blanca migajón", existencia: 35 },
    { id: 4, nombre: "Regla", categoria: "Papelería", descripcion: "Regla transparente de plástico 30 cm", existencia: 40 }
];

// Obtener lista completa de productos
function obtenerProductos() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(PRODUCTOS_INICIALES));
        return [...PRODUCTOS_INICIALES];
    }
    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [...PRODUCTOS_INICIALES];
    } catch (e) {
        console.error("Error al leer localStorage, restaurando datos iniciales", e);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(PRODUCTOS_INICIALES));
        return [...PRODUCTOS_INICIALES];
    }
}

// Guardar array en localStorage
function guardarProductos(lista) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
}

// Obtener un producto por ID
function obtenerProductoPorId(id) {
    const productos = obtenerProductos();
    return productos.find(p => p.id === Number(id)) || null;
}

// Validar datos de un producto (Manejo de Casos Alternos)
function validarDatosProducto(datos, idEdicion = null) {
    const errores = [];
    
    // Caso alterno 1: Nombre vacío o puros espacios
    const nombre = (datos.nombre || '').trim();
    if (!nombre) {
        errores.push("El nombre del producto es obligatorio y no puede estar vacío.");
    } else if (nombre.length < 2) {
        errores.push("El nombre debe tener al menos 2 caracteres.");
    }

    // Caso alterno 2: Categoría vacía
    const categoria = (datos.categoria || '').trim();
    if (!categoria) {
        errores.push("Debe ingresar o seleccionar una categoría.");
    }

    // Caso alterno 3: Cantidad inválida, no numérica o negativa
    const existenciaNum = Number(datos.existencia);
    if (isNaN(existenciaNum) || datos.existencia === '' || datos.existencia === null) {
        errores.push("La cantidad debe ser un valor numérico válido.");
    } else if (!Number.isInteger(existenciaNum)) {
        errores.push("La cantidad debe ser un número entero (sin decimales).");
    } else if (existenciaNum < 0) {
        errores.push("La existencia no puede ser un número negativo.");
    }

    // Caso alterno 4: Producto duplicado con el mismo nombre
    const productos = obtenerProductos();
    const duplicado = productos.find(p => 
        p.nombre.toLowerCase().trim() === nombre.toLowerCase() &&
        p.id !== Number(idEdicion)
    );
    if (duplicado) {
        errores.push(`Ya existe un producto registrado con el nombre "${nombre}" (ID: ${duplicado.id}). Use otro nombre o modifique el existente.`);
    }

    return {
        esValido: errores.length === 0,
        errores,
        datosLimpios: {
            nombre,
            categoria,
            descripcion: (datos.descripcion || '').trim(),
            existencia: Math.max(0, Math.floor(existenciaNum || 0))
        }
    };
}

// Registrar nuevo producto
function registrarProducto(datos) {
    const validacion = validarDatosProducto(datos);
    if (!validacion.esValido) {
        return { exito: false, errores: validacion.errores };
    }

    const productos = obtenerProductos();
    // Generar ID incremental seguro
    const nuevoId = productos.length > 0 ? Math.max(...productos.map(p => p.id || 0)) + 1 : 1;
    
    const nuevoProducto = {
        id: nuevoId,
        ...validacion.datosLimpios
    };

    productos.push(nuevoProducto);
    guardarProductos(productos);
    return { exito: true, producto: nuevoProducto };
}

// Modificar producto existente
function modificarProducto(id, datosActualizados) {
    const idNum = Number(id);
    const validacion = validarDatosProducto(datosActualizados, idNum);
    if (!validacion.esValido) {
        return { exito: false, errores: validacion.errores };
    }

    const productos = obtenerProductos();
    const indice = productos.findIndex(p => p.id === idNum);
    if (indice === -1) {
        return { exito: false, errores: ["El producto que intenta modificar no existe."] };
    }

    productos[indice] = {
        id: idNum,
        ...validacion.datosLimpios
    };

    guardarProductos(productos);
    return { exito: true, producto: productos[indice] };
}

// Eliminar producto por ID
function eliminarProducto(id) {
    const idNum = Number(id);
    const productos = obtenerProductos();
    const indice = productos.findIndex(p => p.id === idNum);
    if (indice === -1) {
        return { exito: false, error: "El producto no fue encontrado." };
    }

    const eliminado = productos.splice(indice, 1)[0];
    guardarProductos(productos);
    return { exito: true, eliminado };
}

// Restaurar datos de fábrica (para pruebas o demostración)
function restaurarDatosIniciales() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(PRODUCTOS_INICIALES));
    return [...PRODUCTOS_INICIALES];
}
