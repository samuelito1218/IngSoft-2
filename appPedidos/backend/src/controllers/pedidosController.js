const { PrismaClient } = require('@prisma/client');
//const { ObjectId } = require('mongodb');

const prisma = new PrismaClient();
// Método para obtener el historial de pedidos de un cliente
exports.getPedidosCliente = async (req, res) => {
  try {
    const usuario_id = req.user.id;
    
    // Buscar todos los pedidos del usuario
    const pedidos = await prisma.pedidos.findMany({
      where: {
        usuario_id
      },
      orderBy: {
        fechaDeCreacion: 'desc'
      }
    });
    
    res.status(200).json(pedidos);
  } catch (error) {
    console.error('Error al obtener historial de pedidos:', error);
    res.status(500).json({ 
      message: 'Error al obtener historial de pedidos', 
      error: error.message 
    });
  }
};
// Método para obtener detalles de un pedido específico
// Método para obtener detalles de un pedido específico
exports.getPedidoDetalle = async (req, res) => {
  try {
    const { pedidoId } = req.params;
    const usuario_id = req.user.id;
    
    // Buscar el pedido
    const pedido = await prisma.pedidos.findUnique({
      where: { id: pedidoId }
    });
    
    if (!pedido) {
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }
    
    // Verificar permisos (solo cliente del pedido o repartidor asignado)
    if (pedido.usuario_id !== usuario_id && pedido.repartidor_Id !== usuario_id) {
      return res.status(403).json({ message: 'No tienes permiso para ver este pedido' });
    }
    
    // Si hay un repartidor asignado, obtener sus datos
    let repartidor = null;
    if (pedido.repartidor_Id) {
      repartidor = await prisma.usuarios.findUnique({
        where: { id: pedido.repartidor_Id },
        select: {
          id: true,
          nombreCompleto: true,
          telefono: true,
          vehiculo: true,
          imageUrl: true
        }
      });
    }
    
    res.status(200).json({ 
      pedido,
      repartidor
    });
  } catch (error) {
    console.error('Error al obtener detalles del pedido:', error);
    res.status(500).json({ 
      message: 'Error al obtener detalles del pedido', 
      error: error.message 
    });
  }
};
//Método para crear pedido
exports.crearPedido = async (req, res) => {
  try {
    const { direccionEntrega, productos } = req.body;
    const usuario_id = req.user.id;
    //console.log('ID del usuario autenticado:', usuario_id);
    
    //Método que impide que un usuario cree otro pedido mientras no haya finalizado el anterior

    const pedidosActivos = await prisma.pedidos.count({
      where: {
        usuario_id: usuario_id,
        estado: {
          in: ['Pendiente', 'En_Camino']
        }
      }
    });
    

    console.log(`Pedidos activos para el usuario ${usuario_id}:`, pedidosActivos);


    if (pedidosActivos > 0) {
      return res.status(400).json({
        message: 'Ups, ya tienes un pedido en curso. Debes finalizarlo antes de crear uno nuevo.'
      });
    }

    if (!direccionEntrega || !Array.isArray(productos) || productos.length === 0) {
      return res.status(400).json({ message: 'Faltan datos obligatorios.' });
    }

    const { barrio, comuna, direccionEspecifica } = direccionEntrega;
    if (!barrio || !comuna || !direccionEspecifica) {
      return res.status(400).json({ message: 'Dirección de entrega incompleta.' });
    }

    

    // Obtener los productos de la BD
    const productosIds = productos.map(p => p.productoId);
    const productosDB = await prisma.productos.findMany({
      where: { id: { in: productosIds } }
    });

    let total = 0;
    const productosFinal = productos.map(p => {
      if (p.cantidad<=0){
        throw new Error(`La cantidad para el producto ${p.productoId} debe ser mayor que cero.`);
      }
      
      const productoEncontrado = productosDB.find(db => db.id === p.productoId);
      if (!productoEncontrado) {
        throw new Error(`Producto con ID ${p.productoId} no encontrado.`);
      }
      total += productoEncontrado.precio * p.cantidad;
      return {
        cantidad: p.cantidad,
        productoId: p.productoId
      };
    });

    // Crear el pedido
    const nuevoPedido = await prisma.pedidos.create({
      data: {
        estado: 'Pendiente',
        total,
        usuario_id,
        repartidor_Id: null, // O el ID de un repartidor válido si aplica
        fechaDeCreacion: new Date(),
        direccionEntrega: {
          barrio,
          comuna,
          direccionEspecifica
        },
        productos: productosFinal,
        mensajes: []
      }
    });


    

    res.status(201).json(nuevoPedido);
  } catch (error) {
    console.error('Error al crear pedido:', error);
    res.status(500).json({ message: 'Error al crear pedido', error: error.message });
  }
};

exports.getPedidoActivo = async (req, res) => {
  try {
    const usuario_id = req.user.id;
    
    // Buscar pedido activo
    const pedidoActivo = await prisma.pedidos.findFirst({
      where: {
        usuario_id,
        estado: {
          in: ['Pendiente', 'En_Camino']
        }
      },
      orderBy: {
        fechaDeCreacion: 'desc'
      }
    });
    
    // Si no hay pedido activo, devolver un objeto vacío con código 200, no 404
    if (!pedidoActivo) {
      return res.status(200).json({ 
        message: 'No hay pedido activo',
        pedido: null
      });
    }
    
    // Si hay un repartidor asignado, obtener sus datos
    let repartidor = null;
    if (pedidoActivo.repartidor_Id) {
      repartidor = await prisma.usuarios.findUnique({
        where: { id: pedidoActivo.repartidor_Id },
        select: {
          id: true,
          nombreCompleto: true,
          telefono: true,
          vehiculo: true
        }
      });
    }
    
    // Obtener datos del cliente
    const cliente = await prisma.usuarios.findUnique({
      where: { id: usuario_id },
      select: {
        id: true,
        nombreCompleto: true
      }
    });
    
    res.status(200).json({ 
      pedido: pedidoActivo,
      repartidor,
      cliente
    });
  } catch (error) {
    console.error('Error al obtener pedido activo:', error);
    res.status(500).json({ message: 'Error al obtener pedido activo', error: error.message });
  }
};


//Método para asignar un pedido a un repartidor, usando sesiones y el id del pedido
exports.asignarPedido = async (req,res)=>{
  try{
    const  { pedidoId }  = req.params;
    const repartidor_Id = req.user.id;

    const pedido = await prisma.pedidos.findUnique({
      where: {id:pedidoId},
    });
    if(!pedido){
      return res.status(404).json({message:"Pedido no encontrado"});
    }

    if (pedido.repartidor_Id){
      return res.status(400).json({message:"Este pedido ya tiene un repartidor"});
    }

    const pedidoActualizado = await prisma.pedidos.update({
      where:{id:pedidoId},
      data: {repartidor_Id:repartidor_Id}
    });

    res.status(200).json({message:"Pedido asignado correctamente", pedido: pedidoActualizado});
  } catch (error){
    console.error("Error al asignar pedido: ", error);
    res.status(500).json({message:"Error al asignar pedido", error: error.mensajes});
  }
};

//Método para cambiar el estado del pedido (solo el repartidor puede hacer esto)

exports.marcarEnCamino = async (req,res) =>{
  try {
    const  { pedidoId } = req.params;
    const repartidor_Id = req.user.id;

    //Buscar pedido
    const pedido = await prisma.pedidos.findUnique({
      where: { id:pedidoId },
    });

    if (!pedido){
      return res.status(404).json({message:"Pedido no encontrado"});
    }

    //Verificar que si sea el repartidor el asignado a ese pedido

    if (pedido.repartidor_Id !==repartidor_Id){
      return res.status(403).json({message:"No posees el permiso para cambiar el estado de este pedido"});

    }

    //Verificar que el estado previo sea Pendiente
    if (pedido.estado != "Pendiente"){
      return res.status(400).json({message: "El pedido debe haber estado pendiente para poder ir En camino"});
    }

    //Cambiar el estado a En_Camino

    const pedidoActualizado = await prisma.pedidos.update({
      where:{id:pedidoId},
      data:{estado:"En_Camino"}
    });

    res.status(200).json({message:"Estado cambiado a En Camino", pedido:pedidoActualizado});
  } catch (error){
    console.error("Error al marcar como en camino ", error);
    res.status(500).json({
      message:"Error al cambiar estado a En camino", error: error.message });
    }
};

//Cambiar el estado a Entregado

exports.marcarEntregado = async (req,res)=>{
  try {
    const { pedidoId } = req.params;
    const repartidor_Id = req.user.id;

    // Buscar pedido

    const pedido = await prisma.pedidos.findUnique({
      where: { id: pedidoId },
    });

    if (!pedido){
      return res.status(404).json({message: "Pedido no encontrado"});
    }

    //Verificar que si sea el repartidor el asignado al pedido
    if (pedido.repartidor_Id !== repartidor_Id){
      return res.status(403).json({message: "No tienes permiso para cambiar el estado de este pedido"});

    }

    //Verificar que el estado previo sea En_Camino
    if (pedido.estado != "En_Camino"){
      return res.status(400).json({message: "El pedido debe estar en camino para poder ser entregado"});
    }
    //Cambiar el estado a Entregado

    const pedidoActualizado = await prisma.pedidos.update({
      where: {id:pedidoId},
      data: {estado:"Entregado"}
    });
    
    res.status(200).json({message:"Estado cambiado a Entregado", pedido : pedidoActualizado});

  } catch (error){
    console.error("Error al marcar como Entregado: ", error);
    res.status(500).json({message: "Error al cambair estado a Entregado", error: error.message});
  }
};

//Método para eliminar pedido (solamente por el usuario que creo el pedido) Nota: Si ya se asigno un repartidor no se peude eliminar
exports.eliminarPedido = async (req,res)=>{
  try{
    const { pedidoId } = req.params;
    const clienteId = req.user.id;

    //Buscar el pedido
    const pedido = await prisma.pedidos.findUnique({
      where: { id: pedidoId},
    });

    if (!pedido){
      return res.status(404).json({
        message: "Pedido no encontrado"
      });
    }
    //Se verifica que el pedido pertenezca al cliente autenticado
    if (pedido.usuario_id !== clienteId){
      return res.status(403).json({
        message: "No tienes permiso para eliminar este pedido"
      });
    }
    //Se verifica que el pedido no tenga repartidor asignado

    if (pedido.repartidor_Id !== null){
      return res.status(400).json({
        message: "No puedes eliminar un pedido con repartidor asignado"
      });
    }
    //Eliminar pedido

    await prisma.pedidos.delete({
      where: { id: pedidoId},
    });

    res.json({
      message: "Pedido eliminado exitosamente"
    });
  } catch (error){
    console.error("Error al eliminar pedido: ", error);
    res.status(500).json({
      message: "Error interno al eliminar pedido"
    });
  }
};

//Método para editar pedido (solamente si no hay repartidor asignado) Nota: los productos asociados siguen perteneciendo al restaurante del pedido original

exports.editarPedido = async (req, res) =>{
  try{
    const { pedidoId } = req.params;
    const { productos } = req.body; // productos: [{productoId, cantidad}]
    const clienteId = req.user.id;

    //Buscar el pedido

    const pedido = await prisma.pedidos.findUnique({
      where: { id: pedidoId },
      include: { productos: true},
    });

    if (!pedido){
      return res.status(404).json({
        message: "Pedido no encontrado"
      });
    }
    //Validar si el pedido pertenece al usuario y el estado del mismo:
    if (pedido.usuario_id !==clienteId){
      return res.status(403).json({
        message: "No tienes permiso para editar este pedido"
      });
    }

    if (pedido.estado !== "Pendiente"){
      return res.status(400).json({
        message: "Solo se pueden editar pedidos pendientes"
      });
    }
    //Se obtiene el restaurante original mediante el primer producto

    const productoOriginal = await prisma.productos.findUnique({
      where: { id: pedido.productos[0].productoId },
    });
    const restauranteOriginalId = productoOriginal.restaurante_Id;

    let total=0;
    //Se valida que todos los nuevos productos pertenezcan al mismo restaurante

    for (const item of productos){
      if (item.cantidad<=0){
        return res.status(400).json({
          message: `La cantidad para el producto ${item.productoId} debe ser mayor que cero.`
        });
      }
      const producto = await prisma.productos.findUnique({
        where: { id: item.productoId },
      });

      if (!producto){
        return res.status(400).json({
          message: `Producto no encontrado: ${item.productoId}`
        });
      }
      if (producto.restaurante_Id !== restauranteOriginalId){
        return res.status(400).json({
          message: "Todos los productos deben pertener al mismo restaurante que el pedido original, en todo caso, elimine el pedido y cree uno nuevo"
        });
      }
      total += producto.precio * item.cantidad;
    }
    //Actualizar los productos del pedido

    await prisma.pedidos.update({
      where: { id: pedidoId},
      data: {
        productos: {
          set: productos, //Se reemplazan completamente los productos
        },
        total
      },
    });

    res.status(200).json({
      message: "Pedido actualizado correctamente"
    });
  } catch (error){
    console.error("Error al editar el pedido: ", error);
    res.status(500).json({
      message: "Error al editar el pedido", error: error.message
    });
  }
};

//Nuevos métodos para el frontend del repartidor desde aqui:

// Método para obtener todos los pedidos disponibles (sin repartidor asignado)
exports.getPedidosDisponibles = async (req, res) => {
  try {
    // Buscar pedidos sin repartidor asignado
    const pedidos = await prisma.pedidos.findMany({
      where: {
        repartidor_Id: null,
        estado: 'Pendiente'
      },
      orderBy: {
        fechaDeCreacion: 'desc'
      }
    });
    
    // Obtener información detallada de cada pedido
    const pedidosConInfo = await Promise.all(pedidos.map(async (pedido) => {
      try {
        // Obtener información del cliente
        const cliente = await prisma.usuarios.findUnique({
          where: { id: pedido.usuario_id },
          select: {
            id: true,
            nombreCompleto: true,
            telefono: true
          }
        });
        
        // Info de restaurante y sucursal
        let infoRestaurante = {
          id: null,
          nombre: "Restaurante no disponible",
          imageUrl: null,
          direccion: "Dirección no disponible", // Mantenemos campo para compatibilidad
          sucursal: null // Nuevo campo opcional con datos completos de la sucursal
        };
        
        // Obtener restaurante y sucursal a partir del primer producto
        if (pedido.productos && pedido.productos.length > 0) {
          try {
            // 1. Obtener información del producto
            const primerProducto = await prisma.productos.findUnique({
              where: { id: pedido.productos[0].productoId }
            });
            
            if (primerProducto) {
              // 2. Obtener información del restaurante
              const restaurante = await prisma.restaurantes.findUnique({
                where: { id: primerProducto.restaurante_Id },
                select: {
                  id: true,
                  nombre: true,
                  imageUrl: true,
                  ubicaciones: true
                }
              });
              
              if (restaurante) {
                // Información básica del restaurante
                infoRestaurante.id = restaurante.id;
                infoRestaurante.nombre = restaurante.nombre;
                infoRestaurante.imageUrl = restaurante.imageUrl;
                
                // 3. Obtener información de la sucursal
                if (restaurante.ubicaciones && restaurante.ubicaciones.length > 0) {
                  // Tomar la primera sucursal (podríamos implementar lógica para elegir la mejor)
                  const sucursalId = restaurante.ubicaciones[0].sucursal_Id;
                  
                  const sucursal = await prisma.sucursales.findUnique({
                    where: { id: sucursalId }
                  });
                  
                  if (sucursal) {
                    // Guardamos la dirección principal para compatibilidad
                    infoRestaurante.direccion = sucursal.direccion;
                    
                    // Guardamos la información completa de la sucursal
                    infoRestaurante.sucursal = {
                      id: sucursal.id,
                      nombre: sucursal.nombre,
                      direccion: sucursal.direccion,
                      comuna: sucursal.comuna
                    };
                  }
                }
              }
            }
          } catch (error) {
            console.error('Error al obtener info de restaurante/sucursal:', error);
          }
        }
        
        return {
          ...pedido,
          cliente,
          restaurante: infoRestaurante
        };
      } catch (error) {
        console.error(`Error procesando pedido ${pedido.id}:`, error);
        return pedido;
      }
    }));
    
    res.status(200).json(pedidosConInfo);
  } catch (error) {
    console.error('Error al obtener pedidos disponibles:', error);
    res.status(500).json({ 
      message: 'Error al obtener pedidos disponibles', 
      error: error.message 
    });
  }
};

// Método para obtener pedidos activos de un repartidor
// Función mejorada con mejor manejo de errores
exports.getPedidosRepartidor = async (req, res) => {
  try {
    // Verificar que el usuario tiene el rol correcto
    console.log("ID de usuario:", req.user.id);
    console.log("Rol de usuario:", req.user.rol);
    
    const repartidor_Id = req.user.id;
    
    // Primero verificar si el repartidor existe
    const repartidor = await prisma.usuarios.findUnique({
      where: { id: repartidor_Id }
    });
    
    if (!repartidor) {
      console.error(`Repartidor con ID ${repartidor_Id} no encontrado`);
      return res.status(404).json({ message: 'Repartidor no encontrado' });
    }
    
    console.log(`Buscando pedidos para repartidor: ${repartidor_Id}`);
    
    // Buscar pedidos con mejor manejo de errores
    const pedidos = await prisma.pedidos.findMany({
      where: {
        repartidor_Id,
        estado: {
          in: ['Pendiente', 'En_Camino']
        }
      },
      orderBy: {
        fechaDeCreacion: 'desc'
      }
    });
    
    console.log(`Pedidos encontrados: ${pedidos.length}`);
    
    // Procesar un pedido a la vez para identificar errores más fácilmente
    const pedidosConInfo = [];
    
    for (const pedido of pedidos) {
      try {
        console.log(`Procesando pedido ID: ${pedido.id}`);
        
        // Obtener cliente con manejo de errores
        let cliente = null;
        try {
          cliente = await prisma.usuarios.findUnique({
            where: { id: pedido.usuario_id },
            select: {
              id: true,
              nombreCompleto: true,
              telefono: true
            }
          });
        } catch (clienteError) {
          console.error(`Error al obtener cliente para pedido ${pedido.id}:`, clienteError);
        }
        
        // Obtener restaurante con manejo de errores
        let restaurante = null;
        if (pedido.productos && pedido.productos.length > 0) {
          try {
            const primerProductoId = pedido.productos[0].productoId;
            console.log(`Buscando producto ID: ${primerProductoId}`);
            
            const primerProducto = await prisma.productos.findUnique({
              where: { id: primerProductoId }
            });
            
            if (primerProducto && primerProducto.restaurante_Id) {
              console.log(`Buscando restaurante ID: ${primerProducto.restaurante_Id}`);
              
              restaurante = await prisma.restaurantes.findUnique({
                where: { id: primerProducto.restaurante_Id },
                select: {
                  id: true,
                  nombre: true,
                  // Eliminar direccion: true
                  ubicaciones: true, // En su lugar, incluir ubicaciones
                  imageUrl: true
                }
              });
            }
          } catch (productoError) {
            console.error(`Error al obtener restaurante para pedido ${pedido.id}:`, productoError);
          }
        }
        
        pedidosConInfo.push({
          ...pedido,
          cliente,
          restaurante
        });
      } catch (pedidoError) {
        console.error(`Error procesando pedido ${pedido.id}:`, pedidoError);
        // Continuar con el siguiente pedido sin interrumpir el proceso
      }
    }
    
    res.status(200).json(pedidosConInfo);
  } catch (error) {
    console.error('Error detallado al obtener pedidos del repartidor:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ 
      message: 'Error al obtener pedidos del repartidor', 
      error: error.message 
    });
  }
};

// Método para obtener historial de pedidos de un repartidor
exports.getHistorialRepartidor = async (req, res) => {
  try {
    const repartidor_Id = req.user.id;
    
    // Buscar pedidos completados por el repartidor
    const pedidos = await prisma.pedidos.findMany({
      where: {
        repartidor_Id,
        estado: {
          in: ['Entregado', 'Cancelado']
        }
      },
      include:{
        calificaciones: true
      },
      orderBy: {
        fechaDeCreacion: 'desc'
      }
    });
    
    // Obtener información detallada de cada pedido
    const pedidosConInfo = await Promise.all(pedidos.map(async (pedido) => {
      // Obtener información del cliente
      const cliente = await prisma.usuarios.findUnique({
        where: { id: pedido.usuario_id },
        select: {
          id: true,
          nombreCompleto: true
        }
      });
      
      // Obtener restaurante basado en el primer producto del pedido
      let restaurante = null;
      if (pedido.productos && pedido.productos.length > 0) {
        const primerProducto = await prisma.productos.findUnique({
          where: { id: pedido.productos[0].productoId }
        });
        
        if (primerProducto) {
          restaurante = await prisma.restaurantes.findUnique({
            where: { id: primerProducto.restaurante_Id },
            select: {
              id: true,
              nombre: true
            }
          });
        }
      }
      
      return {
        ...pedido,
        cliente,
        restaurante
      };
    }));
    
    res.status(200).json(pedidosConInfo);
  } catch (error) {
    console.error('Error al obtener historial del repartidor:', error);
    res.status(500).json({ 
      message: 'Error al obtener historial del repartidor', 
      error: error.message 
    });
  }
};