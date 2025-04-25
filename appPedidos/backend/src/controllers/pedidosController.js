const { PrismaClient } = require('@prisma/client');
//const { ObjectId } = require('mongodb');

const prisma = new PrismaClient();

exports.crearPedido = async (req, res) => {
  try {
    const { direccionEntrega, productos } = req.body;
    const usuario_id = req.user.id;

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
