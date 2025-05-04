const {PrismaClient} = require('@prisma/client');
const prisma = new PrismaClient();


//Crear restaurante

exports.crearRestaurante = async (req,res)=>{
    try{
        //Se verifica que el usuario sea Admin
        if (req.user.rol !== "Admin"){
            return res.status(403).json({
                message: "Acceso denegado. Solo los usuarios con rol de Admin pueden crear un restaurante"
            });
        }

        const { nombre, descripcion, sucursales } = req.body;

        if(!nombre || !descripcion || !Array.isArray(sucursales) || sucursales.length === 0){
            return res.status(400).json({
                message: "Faltan datos obligatorios: nombre, descripción, sucursales"
            });

        }
        //Validar cada ubicación

        for (const sucursal of sucursales) {
            if (!sucursal.nombre || !sucursal.direccion || !sucursal.comuna) {
              return res.status(400).json({
                message: "Cada sucursal debe tener nombre, dirección y comuna"
              });
            }
          }
        //Crear el restaurante

        const nuevoRestaurante = await prisma.restaurantes.create({
            data: {
              nombre,
              descripcion,
              ownerId: req.user.id,
              sucursales: {
                create: sucursales.map(sucursal => ({
                  nombre: sucursal.nombre,
                  direccion: sucursal.direccion,
                  comuna: sucursal.comuna
                }))
              }
            },
            include: {
              sucursales: true
            }
          });
      
          res.status(201).json({
            message: "Restaurante y sucursales creados exitosamente",
            restaurante: nuevoRestaurante
          });
      
        }catch (error){
        console.error("Error al crear restaurante: ", error);
        res.status(500).json({
            message: "Error al crear el restaurante",
            error: error.message
        });
    }
};

//Método para agregar sucursales (solamente el dueño del restaurante o sea el usuario de rol Admin que lo creo)

exports.agregarSucursal = async (req,res)=>{
    try{
        //Solo los admins propietarios
        if(req.user.rol !== "Admin"){
            return res.status(403).json({
                message: "Acceso denegado, solo los usuarios con rol Admin pueden agregar sucursales a los restaurantes"
            });
        }

        const { restauranteId } = req.params;
        const { nombre, direccion, comuna } = req.body;

        //Validación de los datos
        if(!nombre || !direccion || !comuna){
            return res.status(400).json({
                message: "Faltan datos obligatorios para agregar la sucursal: nombre, dirección, comuna"
            });
        }

        //Verificar existencia del restaurante y que es de la propiedad del usuario solicitante

        const restaurante = await prisma.restaurantes.findUnique({
            where: { id: restauranteId },
            select: { id: true, ownerId: true}
        });
        if(!restaurante){
            return res.status(404).json({
                message: "Restaurante no encontrado en el sistema"
            });}
            if (restaurante.ownerId !== req.user.id){
                return res.status(403).json({
                    message: "Solo puedes agregar sucursales a un restaurante de tu propiedad"
                });
            }
            //Crear la sucursal

            const nuevaSucursal = await prisma.sucursales.create({
                data: {
                    nombre,
                    direccion,
                    comuna,
                    restaurante_Id : restauranteId
                }
            });

            res.status(201).json({
                message: "Sucursal agregada exitosamente",
                sucursal: nuevaSucursal
            });
        } catch (error){
            console.error("Error al agregar sucursal ", error);
            res.status(500).json({
                message: "Error interno al agregar sucursal",
                error: error.message
            });
        }
    };

//Método para eliminar sucursales

exports.eliminarSucursal = async (req, res)=>{
    try{
        const { sucursalId } = req.params;

        //Buscar la sucursal con su restaurante

        const sucursal = await prisma.sucursales.findUnique({
            where: { id: sucursalId },
            include: {
                restaurante: true,
            },
        });
        if(!sucursal){
            return res.status(404).json({
                message: "Sucursal no encontrada"
            });
        }

        //Verificar que el usuario sea el dueño del restaurante
        if (req.user.rol !== "Admin" || sucursal.restaurante.ownerId !== req.user.id){
            return res.status(403).json({
                message: "Acceso denegado. Solo puedes eliminar sucursales de tus propios restaurantes"
            });
        }

        //Eliminar la sucursal

        await prisma.sucursales.delete({
            where: { id: sucursalId },
        });

        res.status(200).json({
            message: "Sucursal eliminada correctamente",
            sucursalEliminada: {
                id: sucursal.id,
                nombre: sucursal.nombre,
                direccion: sucursal.direccion,
                comuna: sucursal.comuna,
                restauranteId: sucursal.restauranteId,
            },
        });
    } catch (error){
        console.error("Error al eliminar sucursal: ", error);
        res.status(500).json({
            message: "Error al eliminar sucursal",
            error: error.message
        });
    }
};
//Método para listar sucursales

exports.listarSucursalesPorRestaurante = async (req,res)=>{
    try{
        const { restauranteId } = req.params;

        //Buscar restaurante y validar propiedad
        const restaurante = await prisma.restaurantes.findUnique({
            where: { id: restauranteId },
            include: { sucursales: true}
        });

        if (!restaurante){
            return res.status(404).json({
                message: "Restaurante no encontrado"
            });
        }
        if (restaurante.ownerId !== req.user.id){
            return res.status(403).json({
                message: "Accedo denegado. Solo puedes ver las sucursales de tus restaurantes"
            });
        }

        res.status(200).json({
            message: "Sucursales del restaurante",
            sucursales: restaurante.sucursales
        });
    } catch (error){
        console.error("Error al listar sucursales: ", error);
        res.status(500).json({
            message: "Error al listar las sucursales",
            error: error.message
        });
    }
};

//Método para listar restaurantes de un usuario
exports.listarMisRestaurantes = async (req, res) => {
    try {
      if (req.user.rol !== "Admin") {
        return res.status(403).json({
          message: "Acceso denegado. Solo los administradores pueden listar sus restaurantes."
        });
      }
      //Busqueda
      const misRestaurantes = await prisma.restaurantes.findMany({
        where: {
          ownerId: req.user.id
        },
        include: {
          sucursales: true
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
      const { nombre, descripcion } = req.body;
  
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
      //Se comprueba que pertenezca al usuario
      if (restaurante.ownerId !== req.user.id) {
        return res.status(403).json({
          message: "Solo puedes editar restaurantes de tu propiedad"
        });
      }
      //Actualizar info restaurante
      const restauranteActualizado = await prisma.restaurantes.update({
        where: { id: restauranteId },
        data: {
          nombre: nombre || restaurante.nombre,
          descripcion: descripcion || restaurante.descripcion
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
  // Método para eliminar un restaurante y todas sus sucursales 
exports.eliminarRestaurante = async (req, res) => {
    try {
      const { restauranteId } = req.params;
  
      if (req.user.rol !== "Admin") {
        return res.status(403).json({
          message: "Acceso denegado. Solo los administradores pueden eliminar restaurantes."
        });
      }
      //Se busca el restaurante
      const restaurante = await prisma.restaurantes.findUnique({
        where: { id: restauranteId },
        include: { sucursales: true }
      });
  
      if (!restaurante) {
        return res.status(404).json({
          message: "Restaurante no encontrado"
        });
      }
      //Se valida que pertenezca al usuario
      if (restaurante.ownerId !== req.user.id) {
        return res.status(403).json({
          message: "Solo puedes eliminar restaurantes que te pertenecen"
        });
      }
  
      // Se  eliminan las sucursales asociadas a ese restaurante
      await prisma.sucursales.deleteMany({
        where: { restaurante_Id: restauranteId }
      });
  
      // Se elimina el restaurante
      await prisma.restaurantes.delete({
        where: { id: restauranteId }
      });
  
      res.status(200).json({
        message: "Restaurante y todas sus sucursales eliminados correctamente"
      });
    } catch (error) {
      console.error("Error al eliminar restaurante: ", error);
      res.status(500).json({
        message: "Error interno al eliminar el restaurante",
        error: error.message
      });
    }
  };
  
  
  



