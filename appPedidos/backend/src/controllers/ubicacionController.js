// ubicacionController.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Obtener ubicación de un pedido
exports.obtenerUbicacionPedido = async (req, res) => {
  try {
    const { pedidoId } = req.params;
    
    // Buscar la ubicación en la base de datos
    const ubicacion = await prisma.ubicacion.findFirst({
      where: { pedidoId: pedidoId }
    });
    
    if (!ubicacion) {
      return res.status(404).json({ message: 'No hay ubicación registrada para este pedido' });
    }
    
    res.status(200).json(ubicacion);
  } catch (error) {
    console.error('Error al obtener ubicación del pedido:', error);
    res.status(500).json({ message: 'Error al obtener ubicación', error: error.message });
  }
};

// Actualizar ubicación de un pedido
exports.actualizarUbicacionPedido = async (req, res) => {
  try {
    const { pedidoId } = req.params;
    const { latitud, longitud, heading } = req.body;
    
    // Verificar que el pedido existe
    const pedido = await prisma.pedidos.findUnique({
      where: { id: pedidoId }
    });
    
    if (!pedido) {
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }
    
    // Buscar si ya existe una ubicación para este pedido
    const existingUbicacion = await prisma.ubicacion.findUnique({
      where: { pedidoId: pedidoId }
    });
    
    let ubicacion;
    
    if (existingUbicacion) {
      // Actualizar si existe
      ubicacion = await prisma.ubicacion.update({
        where: { id: existingUbicacion.id },
        data: { 
          latitud, 
          longitud, 
          heading: heading || 0,
          fechaActualizacion: new Date() 
        }
      });
    } else {
      // Crear si no existe
      ubicacion = await prisma.ubicacion.create({
        data: {
          pedidoId,
          latitud,
          longitud,
          heading: heading || 0,
          fechaActualizacion: new Date()
        }
      });
    }
    
    res.status(200).json({ 
      message: 'Ubicación actualizada correctamente', 
      ubicacion 
    });
  } catch (error) {
    console.error('Error al actualizar la ubicación del pedido:', error);
    res.status(500).json({ 
      message: 'Error al actualizar la ubicación', 
      error: error.message 
    });
  }
};