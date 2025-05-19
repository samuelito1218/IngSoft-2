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

// Método para obtener todos los pedidos de un restaurante
exports.getPedidosRestaurante = async (req, res) => {
  try {
    const { restauranteId } = req.params;
    const { estado, fechaDesde, fechaHasta } = req.query;
    const adminId = req.user.id;

    // Verificar que el restaurante existe y pertenece al admin
    const restaurante = await prisma.restaurantes.findUnique({
      where: { id: restauranteId }
    });

    if (!restaurante) {
      return res.status(404).json({ message: 'Restaurante no encontrado' });
    }

    if (!restaurante.usuariosIds.includes(adminId)) {
      return res.status(403).json({ message: 'No tienes permiso para acceder a este restaurante' });
    }

    // Construir la consulta con filtros opcionales
    let where = {};
    
    // Para filtrar pedidos del restaurante, necesitamos verificar los productos
    // Primero obtenemos todos los productos del restaurante
    const productosRestaurante = await prisma.productos.findMany({
      where: { restaurante_Id: restauranteId },
      select: { id: true }
    });
    
    const productosIds = productosRestaurante.map(p => p.id);
    
    // Buscamos pedidos que contengan estos productos
    where.productos = {
      some: {
        productoId: { in: productosIds }
      }
    };

    // Filtrar por estado si se proporciona
    if (estado) {
      where.estado = estado;
    }

    // Filtrar por rango de fechas si se proporciona
    if (fechaDesde || fechaHasta) {
      where.fechaDeCreacion = {};
      
      if (fechaDesde) {
        where.fechaDeCreacion.gte = new Date(fechaDesde);
      }
      
      if (fechaHasta) {
        where.fechaDeCreacion.lte = new Date(fechaHasta);
      }
    }

    // Obtener pedidos con la consulta construida
    const pedidos = await prisma.pedidos.findMany({
      where,
      orderBy: {
        fechaDeCreacion: 'desc'
      },
      include: {
        calificaciones: true
      }
    });

    // Para cada pedido, obtener información del cliente
    const pedidosConCliente = await Promise.all(pedidos.map(async (pedido) => {
      const cliente = await prisma.usuarios.findUnique({
        where: { id: pedido.usuario_id },
        select: {
          id: true,
          nombreCompleto: true,
          telefono: true
        }
      });

      // Obtener detalles de los productos (nombre, precio)
      const productosConDetalles = await Promise.all(pedido.productos.map(async (item) => {
        const producto = await prisma.productos.findUnique({
          where: { id: item.productoId }
        });
        
        return {
          ...item,
          nombre: producto?.nombre || 'Producto no disponible',
          precio: producto?.precio || 0
        };
      }));

      return {
        ...pedido,
        cliente,
        productos: productosConDetalles
      };
    }));

    res.status(200).json(pedidosConCliente);
  } catch (error) {
    console.error('Error al obtener pedidos del restaurante:', error);
    res.status(500).json({ 
      message: 'Error al obtener pedidos del restaurante', 
      error: error.message 
    });
  }
};

// Método para obtener pedidos pendientes de un restaurante
exports.getPedidosPendientesRestaurante = async (req, res) => {
  try {
    const { restauranteId } = req.params;
    const adminId = req.user.id;

    // Verificar que el restaurante existe y pertenece al admin
    const restaurante = await prisma.restaurantes.findUnique({
      where: { id: restauranteId }
    });

    if (!restaurante) {
      return res.status(404).json({ message: 'Restaurante no encontrado' });
    }

    if (!restaurante.usuariosIds.includes(adminId)) {
      return res.status(403).json({ message: 'No tienes permiso para acceder a este restaurante' });
    }

    // Obtener todos los productos del restaurante
    const productosRestaurante = await prisma.productos.findMany({
      where: { restaurante_Id: restauranteId },
      select: { id: true }
    });
    
    const productosIds = productosRestaurante.map(p => p.id);
    
    // Buscar pedidos pendientes que contengan estos productos
    const pedidosPendientes = await prisma.pedidos.findMany({
      where: {
        estado: 'Pendiente',
        productos: {
          some: {
            productoId: { in: productosIds }
          }
        }
      },
      orderBy: {
        fechaDeCreacion: 'asc' // Primero los más antiguos
      }
    });

    // Para cada pedido, obtener información del cliente
    const pedidosConCliente = await Promise.all(pedidosPendientes.map(async (pedido) => {
      const cliente = await prisma.usuarios.findUnique({
        where: { id: pedido.usuario_id },
        select: {
          id: true,
          nombreCompleto: true,
          telefono: true
        }
      });

      // Obtener detalles de los productos (nombre, precio)
      const productosConDetalles = await Promise.all(pedido.productos.map(async (item) => {
        const producto = await prisma.productos.findUnique({
          where: { id: item.productoId }
        });
        
        return {
          ...item,
          nombre: producto?.nombre || 'Producto no disponible',
          precio: producto?.precio || 0
        };
      }));

      return {
        ...pedido,
        cliente,
        productos: productosConDetalles
      };
    }));

    res.status(200).json(pedidosConCliente);
  } catch (error) {
    console.error('Error al obtener pedidos pendientes:', error);
    res.status(500).json({ 
      message: 'Error al obtener pedidos pendientes', 
      error: error.message 
    });
  }
};

// Método para que el restaurante acepte un pedido
exports.aceptarPedido = async (req, res) => {
  try {
    const { pedidoId } = req.params;
    const adminId = req.user.id;
    
    // Buscar el pedido
    const pedido = await prisma.pedidos.findUnique({
      where: { id: pedidoId }
    });
    
    if (!pedido) {
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }
    
    // Verificar que el pedido esté en estado Pendiente
    if (pedido.estado !== 'Pendiente') {
      return res.status(400).json({ message: 'Solo se pueden aceptar pedidos en estado Pendiente' });
    }
    
    // Obtener el primer producto del pedido para identificar el restaurante
    const primerProducto = await prisma.productos.findUnique({
      where: { id: pedido.productos[0].productoId }
    });
    
    if (!primerProducto) {
      return res.status(404).json({ message: 'No se encontró información del producto' });
    }
    
    // Obtener el restaurante
    const restaurante = await prisma.restaurantes.findUnique({
      where: { id: primerProducto.restaurante_Id }
    });
    
    // Verificar que el restaurante pertenezca al admin
    if (!restaurante || !restaurante.usuariosIds.includes(adminId)) {
      return res.status(403).json({ message: 'No tienes permiso para gestionar este pedido' });
    }
    
    // Actualizar el estado del pedido a "En_Preparacion" (agregamos este estado)
    const pedidoActualizado = await prisma.pedidos.update({
      where: { id: pedidoId },
      data: { estado: 'En_Preparacion' }
    });
    
    res.status(200).json({
      message: 'Pedido aceptado correctamente',
      pedido: pedidoActualizado
    });
  } catch (error) {
    console.error('Error al aceptar pedido:', error);
    res.status(500).json({ 
      message: 'Error al aceptar el pedido', 
      error: error.message 
    });
  }
};

// Método para que el restaurante rechace un pedido
exports.rechazarPedido = async (req, res) => {
  try {
    const { pedidoId } = req.params;
    const { motivo } = req.body;
    const adminId = req.user.id;
    
    // Buscar el pedido
    const pedido = await prisma.pedidos.findUnique({
      where: { id: pedidoId }
    });
    
    if (!pedido) {
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }
    
    // Verificar que el pedido esté en estado Pendiente
    if (pedido.estado !== 'Pendiente') {
      return res.status(400).json({ message: 'Solo se pueden rechazar pedidos en estado Pendiente' });
    }
    
    // Obtener el primer producto del pedido para identificar el restaurante
    const primerProducto = await prisma.productos.findUnique({
      where: { id: pedido.productos[0].productoId }
    });
    
    if (!primerProducto) {
      return res.status(404).json({ message: 'No se encontró información del producto' });
    }
    
    // Obtener el restaurante
    const restaurante = await prisma.restaurantes.findUnique({
      where: { id: primerProducto.restaurante_Id }
    });
    
    // Verificar que el restaurante pertenezca al admin
    if (!restaurante || !restaurante.usuariosIds.includes(adminId)) {
      return res.status(403).json({ message: 'No tienes permiso para gestionar este pedido' });
    }
    
    // Actualizar el estado del pedido a "Cancelado"
    const pedidoActualizado = await prisma.pedidos.update({
      where: { id: pedidoId },
      data: { 
        estado: 'Cancelado',
        motivoRechazo: motivo || 'Rechazado por el restaurante'
      }
    });
    
    res.status(200).json({
      message: 'Pedido rechazado correctamente',
      pedido: pedidoActualizado
    });
  } catch (error) {
    console.error('Error al rechazar pedido:', error);
    res.status(500).json({ 
      message: 'Error al rechazar el pedido', 
      error: error.message 
    });
  }
};

// Método para marcar un pedido como preparado (listo para entrega)
exports.marcarPedidoPreparado = async (req, res) => {
  try {
    const { pedidoId } = req.params;
    const adminId = req.user.id;
    
    // Buscar el pedido
    const pedido = await prisma.pedidos.findUnique({
      where: { id: pedidoId }
    });
    
    if (!pedido) {
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }
    
    // Verificar que el pedido esté en estado En_Preparacion
    if (pedido.estado !== 'En_Preparacion') {
      return res.status(400).json({ message: 'Solo se pueden marcar como preparados los pedidos en estado En_Preparacion' });
    }
    
    // Obtener el primer producto del pedido para identificar el restaurante
    const primerProducto = await prisma.productos.findUnique({
      where: { id: pedido.productos[0].productoId }
    });
    
    if (!primerProducto) {
      return res.status(404).json({ message: 'No se encontró información del producto' });
    }
    
    // Obtener el restaurante
    const restaurante = await prisma.restaurantes.findUnique({
      where: { id: primerProducto.restaurante_Id }
    });
    
    // Verificar que el restaurante pertenezca al admin
    if (!restaurante || !restaurante.usuariosIds.includes(adminId)) {
      return res.status(403).json({ message: 'No tienes permiso para gestionar este pedido' });
    }
    
    // Verificar si ya hay un repartidor asignado
    if (!pedido.repartidor_Id) {
      return res.status(400).json({ message: 'El pedido necesita un repartidor asignado antes de marcarlo como preparado' });
    }
    
    // Actualizar el estado del pedido a "Preparado"
    const pedidoActualizado = await prisma.pedidos.update({
      where: { id: pedidoId },
      data: { estado: 'Preparado' }
    });
    
    res.status(200).json({
      message: 'Pedido marcado como preparado correctamente',
      pedido: pedidoActualizado
    });
  } catch (error) {
    console.error('Error al marcar pedido como preparado:', error);
    res.status(500).json({ 
      message: 'Error al marcar el pedido como preparado', 
      error: error.message 
    });
  }
};

// Método para obtener estadísticas de pedidos para un restaurante
exports.getEstadisticasRestaurante = async (req, res) => {
  try {
    const { restauranteId } = req.params;
    const { periodo } = req.query; // 'hoy', 'semana', 'mes', 'año'
    const adminId = req.user.id;
    
    // Verificar que el restaurante existe y pertenece al admin
    const restaurante = await prisma.restaurantes.findUnique({
      where: { id: restauranteId }
    });
    
    if (!restaurante) {
      return res.status(404).json({ message: 'Restaurante no encontrado' });
    }
    
    if (!restaurante.usuariosIds.includes(adminId)) {
      return res.status(403).json({ message: 'No tienes permiso para acceder a este restaurante' });
    }
    
    // Obtener todos los productos del restaurante
    const productosRestaurante = await prisma.productos.findMany({
      where: { restaurante_Id: restauranteId },
      select: { id: true }
    });
    
    const productosIds = productosRestaurante.map(p => p.id);
    
    // Determinar el rango de fechas según el período
    let fechaDesde = new Date();
    switch (periodo) {
      case 'hoy':
        fechaDesde.setHours(0, 0, 0, 0);
        break;
      case 'semana':
        fechaDesde.setDate(fechaDesde.getDate() - 7);
        break;
      case 'mes':
        fechaDesde.setMonth(fechaDesde.getMonth() - 1);
        break;
      case 'año':
        fechaDesde.setFullYear(fechaDesde.getFullYear() - 1);
        break;
      default:
        // Por defecto, mostrar estadísticas del último mes
        fechaDesde.setMonth(fechaDesde.getMonth() - 1);
    }
    
    // Buscar todos los pedidos del restaurante en el período
    const pedidos = await prisma.pedidos.findMany({
      where: {
        fechaDeCreacion: {
          gte: fechaDesde
        },
        productos: {
          some: {
            productoId: { in: productosIds }
          }
        }
      }
    });
    
    // Calcular estadísticas
    const totalPedidos = pedidos.length;
    const pedidosPendientes = pedidos.filter(p => p.estado === 'Pendiente').length;
    const pedidosEnPreparacion = pedidos.filter(p => p.estado === 'En_Preparacion').length;
    const pedidosEnCamino = pedidos.filter(p => p.estado === 'En_Camino').length;
    const pedidosEntregados = pedidos.filter(p => p.estado === 'Entregado').length;
    const pedidosCancelados = pedidos.filter(p => p.estado === 'Cancelado').length;
    
    // Calcular ingreso total
    const totalIngresos = pedidos
      .filter(p => p.estado === 'Entregado')
      .reduce((sum, p) => sum + p.total, 0);
    
    // Calcular promedio de calificaciones si hay
    let promedioCalificacion = 0;
    const pedidosCalificados = pedidos.filter(p => p.calificaciones && p.calificaciones.length > 0);
    
    if (pedidosCalificados.length > 0) {
      const sumaCalificaciones = pedidosCalificados.reduce((sum, p) => {
        const calificacion = p.calificaciones[0];
        return sum + calificacion.calificacionPedido;
      }, 0);
      
      promedioCalificacion = sumaCalificaciones / pedidosCalificados.length;
    }
    
    // Obtener productos más vendidos
    const productosVendidos = {};
    pedidos.forEach(pedido => {
      pedido.productos.forEach(item => {
        if (!productosVendidos[item.productoId]) {
          productosVendidos[item.productoId] = 0;
        }
        productosVendidos[item.productoId] += item.cantidad;
      });
    });
    
    // Convertir a array y ordenar
    const productosArray = Object.entries(productosVendidos).map(([id, cantidad]) => ({ id, cantidad }));
    productosArray.sort((a, b) => b.cantidad - a.cantidad);
    
    // Obtener detalles de los 5 productos más vendidos
    const topProductos = await Promise.all(
      productosArray.slice(0, 5).map(async (item) => {
        const producto = await prisma.productos.findUnique({
          where: { id: item.id }
        });
        
        return {
          id: item.id,
          nombre: producto?.nombre || 'Producto no disponible',
          cantidad: item.cantidad,
          ingresos: (producto?.precio || 0) * item.cantidad
        };
      })
    );
    
    res.status(200).json({
      periodo,
      totalPedidos,
      pedidosPendientes,
      pedidosEnPreparacion,
      pedidosEnCamino,
      pedidosEntregados,
      pedidosCancelados,
      totalIngresos,
      promedioCalificacion,
      topProductos
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ 
      message: 'Error al obtener estadísticas', 
      error: error.message 
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
// En pedidosController.js
exports.listarPedidosUsuario = async (req, res) => {
  // Simplemente redirigir al método existente
  return exports.getPedidosCliente(req, res);
};
exports.obtenerPedido = async (req, res) => {
  // Puedes simplemente redirigir al método existente
  return exports.getPedidoDetalle(req, res);
};
// En pedidosController.js
exports.asignarRepartidor = async (req, res) => {
  // Puedes redirigir al método existente
  return exports.asignarPedido(req, res);
};