const {PrismaClient} = require('@prisma/client');
const prisma = new PrismaClient();

// listado de los restaurantes del admin logueado
exports.obtenerMisRestaurantes = async (req, res) => {
    try {
        const userId = req.user.id;
        console.log("id del admin: "+userId)
        const restaurantes = await prisma.restaurantes.findMany({
          where: { ownerId: userId },
          orderBy: { nombre: 'asc' },
        });
        res.json(restaurantes);
      } catch (error) {
        console.error('Error interno al obtener restaurantes:', error);
        res.status(500).json({
          message: 'Error interno al obtener los restaurantes',
          error: error.message
        });
      }
    };
    
// Método para listar todos los restaurantes
exports.listarRestaurantes = async (req, res) => {
  try {
    const restaurantes = await prisma.restaurantes.findMany();
    
    res.status(200).json(restaurantes);
  } catch (error) {
    console.error("Error al listar restaurantes:", error);
    res.status(500).json({
      message: "Error interno al listar los restaurantes",
      error: error.message
    });
  }
};
// Método para obtener un restaurante específico por ID
exports.obtenerRestaurante = async (req, res) => {
  try {
    const { id } = req.params;
    
    const restaurante = await prisma.restaurantes.findUnique({
      where: { id }
    });
    
    if (!restaurante) {
      return res.status(404).json({ message: "Restaurante no encontrado" });
    }
    
    res.status(200).json(restaurante);
  } catch (error) {
    console.error("Error al obtener restaurante:", error);
    res.status(500).json({
      message: "Error interno al obtener el restaurante",
      error: error.message
    });
  }
};
// Método para listar productos de un restaurante específico
exports.listarProductosPorRestaurante = async (req, res) => {
  try {
    const { restauranteId } = req.params;
    
    // Verificar que el restaurante existe
    const restaurante = await prisma.restaurantes.findUnique({
      where: { id: restauranteId }
    });
    
    if (!restaurante) {
      return res.status(404).json({ message: "Restaurante no encontrado" });
    }
    
    // Buscar productos del restaurante
    const productos = await prisma.productos.findMany({
      where: { restaurante_Id: restauranteId }
    });
    
    res.status(200).json(productos);
  } catch (error) {
    console.error("Error al listar productos del restaurante:", error);
    res.status(500).json({
      message: "Error interno al listar productos",
      error: error.message
    });
  }
};
// Crear restaurante
exports.crearRestaurante = async (req, res) => {
    try {
      // 1) Sólo Admin
      if (req.user.rol !== "Admin") {
        return res.status(403).json({ message: "Acceso denegado. Sólo Admin puede crear restaurantes" });
      }
  
      // 2) Extraer y validar datos
      const { nombre, descripcion, ubicaciones, imageUrl } = req.body;
      if (!nombre || !descripcion ){
        return res.status(400).json({ message: "Faltan datos obligatorios: nombre, descripcion, ownerId" });
      }
      
  
      // 3) Mapear ubicaciones (si vienen)
      let ubicacionesData = [];
      if (Array.isArray(ubicaciones)) {
        ubicacionesData = ubicaciones.map(u => {
          if (!u.sucursal_Id || !u.comuna) {
            throw new Error("Cada ubicación debe tener sucursal_Id y comuna");
          }
          if (!/^[0-9a-fA-F]{24}$/.test(u.sucursal_Id)) {
            throw new Error("sucursal_Id no es un ObjectId válido");
          }
          return { sucursal_Id: u.sucursal_Id, comuna: u.comuna };
        });
      }
  
      // 4) Armar el objeto data SIN usar `{ create: … }`
      const data = {
        nombre,
        descripcion,
        ownerId: req.user.id,
        imageUrl
      };
      if (ubicacionesData.length) {
        data.ubicaciones = ubicacionesData; 
      }
  
      // 5) Crear el restaurante
      const nuevoRestaurante = await prisma.restaurantes.create({ data });
  
      return res.status(201).json({
        message: "Restaurante creado exitosamente",
        restaurante: nuevoRestaurante
      });
  
    } catch (error) {
      console.error("Error al crear restaurante:", error);
      const status = error.message.includes("ubicación") ? 400 : 500;
      return res.status(status).json({
        message: error.message.includes("ubic") 
          ? error.message 
          : "Error interno al crear el restaurante",
        error: error.message
      });
    }
  };

// Método para agregar ubicación (solamente el dueño del restaurante)
exports.agregarUbicacion = async (req, res) => {
    try {
        // Solo los admins propietarios
        if (req.user.rol !== "Admin") {
            return res.status(403).json({
                message: "Acceso denegado, solo los usuarios con rol Admin pueden agregar ubicaciones a los restaurantes"
            });
        }

        const { restauranteId } = req.params;
        const { sucursal_Id, comuna } = req.body;

        // Validación de los datos
        if (!sucursal_Id || !comuna) {
            return res.status(400).json({
                message: "Faltan datos obligatorios para agregar la ubicación: sucursal_Id, comuna"
            });
        }

        // Verificar existencia del restaurante y que es de la propiedad del usuario solicitante
        const restaurante = await prisma.restaurantes.findUnique({
            where: { id: restauranteId }
        });

        if (!restaurante) {
            return res.status(404).json({
                message: "Restaurante no encontrado en el sistema"
            });
        }

        // Verificar si el usuario actual está en la lista de usuarios del restaurante
        if (!restaurante.usuariosIds.includes(req.user.id)) {
            return res.status(403).json({
                message: "Solo puedes agregar ubicaciones a un restaurante de tu propiedad"
            });
        }

        // Agregar la ubicación al restaurante
        const restauranteActualizado = await prisma.restaurantes.update({
            where: { id: restauranteId },
            data: {
                ubicaciones: {
                    push: { sucursal_Id, comuna }
                }
            }
        });

        res.status(201).json({
            message: "Ubicación agregada exitosamente",
            ubicacion: { sucursal_Id, comuna },
            restaurante: restauranteActualizado
        });
    } catch (error) {
        console.error("Error al agregar ubicación ", error);
        res.status(500).json({
            message: "Error interno al agregar ubicación",
            error: error.message
        });
    }
};

// Método para eliminar ubicación
exports.eliminarUbicacion = async (req, res) => {
    try {
        const { restauranteId, ubicacionIndex } = req.params;
        const index = parseInt(ubicacionIndex);

        if (isNaN(index) || index < 0) {
            return res.status(400).json({
                message: "Índice de ubicación inválido"
            });
        }

        // Buscar el restaurante
        const restaurante = await prisma.restaurantes.findUnique({
            where: { id: restauranteId }
        });

        if (!restaurante) {
            return res.status(404).json({
                message: "Restaurante no encontrado"
            });
        }

        // Verificar que el usuario sea uno de los propietarios
        if (req.user.rol !== "Admin" || !restaurante.usuariosIds.includes(req.user.id)) {
            return res.status(403).json({
                message: "Acceso denegado. Solo puedes eliminar ubicaciones de tus propios restaurantes"
            });
        }

        // Verificar que el índice sea válido
        if (index >= restaurante.ubicaciones.length) {
            return res.status(404).json({
                message: "Ubicación no encontrada"
            });
        }

        // Guardar la ubicación a eliminar
        const ubicacionEliminada = restaurante.ubicaciones[index];

        // Eliminar la ubicación del array
        const ubicacionesActualizadas = [...restaurante.ubicaciones];
        ubicacionesActualizadas.splice(index, 1);

        // Actualizar el restaurante
        await prisma.restaurantes.update({
            where: { id: restauranteId },
            data: {
                ubicaciones: ubicacionesActualizadas
            }
        });

        res.status(200).json({
            message: "Ubicación eliminada correctamente",
            ubicacionEliminada
        });
    } catch (error) {
        console.error("Error al eliminar ubicación: ", error);
        res.status(500).json({
            message: "Error al eliminar ubicación",
            error: error.message
        });
    }
};

// Método para listar ubicaciones de un restaurante
exports.listarUbicacionesPorRestaurante = async (req, res) => {
    try {
        const { restauranteId } = req.params;

        // Buscar restaurante
        const restaurante = await prisma.restaurantes.findUnique({
            where: { id: restauranteId }
        });

        if (!restaurante) {
            return res.status(404).json({
                message: "Restaurante no encontrado"
            });
        }

        res.status(200).json({
            message: "Ubicaciones del restaurante",
            ubicaciones: restaurante.ubicaciones
        });
    } catch (error) {
        console.error("Error al listar ubicaciones: ", error);
        res.status(500).json({
            message: "Error al listar las ubicaciones",
            error: error.message
        });
    }
};

// Método para listar restaurantes de un usuario
exports.listarMisRestaurantes = async (req, res) => {
    try {
        if (req.user.rol !== "Admin") {
            return res.status(403).json({
                message: "Acceso denegado. Solo los administradores pueden listar sus restaurantes."
            });
        }

        // Obtener los IDs de restaurantes del usuario
        const usuario = await prisma.usuarios.findUnique({
            where: { id: req.user.id }
        });

        if (!usuario || !usuario.restaurantesIds) {
            return res.status(200).json({
                message: "No se encontraron restaurantes para este usuario",
                restaurantes: []
            });
        }

        // Buscar los restaurantes asociados al usuario
        const misRestaurantes = await prisma.restaurantes.findMany({
            where: {
                id: { in: usuario.restaurantesIds }
            }
        });

        res.status(200).json({
            message: "Restaurantes del usuario autenticado",
            restaurantes: misRestaurantes
        });
    } catch (error) {
        console.error("Error al listar mis restaurantes:", error);
        res.status(500).json({
            message: "Error interno al listar los restaurantes",
            error: error.message
        });
    }
};

// Método para Editar la información de un restaurante (solo el dueño)
exports.editarRestaurante = async (req, res) => {
    try {
        const { restauranteId } = req.params;
        const { nombre } = req.body;

        if (req.user.rol !== "Admin") {
            return res.status(403).json({
                message: "Acceso denegado. Solo administradores pueden editar restaurantes."
            });
        }

        const restaurante = await prisma.restaurantes.findUnique({
            where: { id: restauranteId }
        });

        if (!restaurante) {
            return res.status(404).json({
                message: "Restaurante no encontrado"
            });
        }

        // Se comprueba que el usuario esté en la lista de usuarios del restaurante
        if (!restaurante.usuariosIds.includes(req.user.id)) {
            return res.status(403).json({
                message: "Solo puedes editar restaurantes de tu propiedad"
            });
        }

        // Actualizar info restaurante
        const restauranteActualizado = await prisma.restaurantes.update({
            where: { id: restauranteId },
            data: {
                nombre: nombre || restaurante.nombre
            }
        });

        res.status(200).json({
            message: "Restaurante actualizado exitosamente",
            restaurante: restauranteActualizado
        });

    } catch (error) {
        console.error("Error al editar restaurante:", error);
        res.status(500).json({
            message: "Error interno al editar el restaurante",
            error: error.message
        });
    }
};

// Método para eliminar un restaurante
exports.eliminarRestaurante = async (req, res) => {
    try {
        const { restauranteId } = req.params;

        if (req.user.rol !== "Admin") {
            return res.status(403).json({
                message: "Acceso denegado. Solo los administradores pueden eliminar restaurantes."
            });
        }

        // Se busca el restaurante
        const restaurante = await prisma.restaurantes.findUnique({
            where: { id: restauranteId }
        });

        if (!restaurante) {
            return res.status(404).json({
                message: "Restaurante no encontrado"
            });
        }

        // Se valida que el usuario esté en la lista de usuarios del restaurante
        if (!restaurante.usuariosIds.includes(req.user.id)) {
            return res.status(403).json({
                message: "Solo puedes eliminar restaurantes que te pertenecen"
            });
        }

        // Primero eliminar los productos asociados a este restaurante
        await prisma.productos.deleteMany({
            where: { restaurante_Id: restauranteId }
        });

        // Luego eliminar el restaurante
        await prisma.restaurantes.delete({
            where: { id: restauranteId }
        });

        // Actualizar la lista de restaurantes del usuario
        await prisma.usuarios.update({
            where: { id: req.user.id },
            data: {
                restaurantesIds: {
                    set: usuario.restaurantesIds.filter(id => id !== restauranteId)
                }
            }
        });

        res.status(200).json({
            message: "Restaurante y todos sus productos eliminados correctamente"
        });
    } catch (error) {
        console.error("Error al eliminar restaurante: ", error);
        res.status(500).json({
            message: "Error interno al eliminar el restaurante",
            error: error.message
        });
    }
};