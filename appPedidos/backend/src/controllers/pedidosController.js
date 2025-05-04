const { PrismaClient } = require('@prisma/client');
//const { ObjectId } = require('mongodb');

const prisma = new PrismaClient();

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
    
    if (!pedidoActivo) {
      return res.status(404).json({ message: 'No hay pedido activo' });
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
