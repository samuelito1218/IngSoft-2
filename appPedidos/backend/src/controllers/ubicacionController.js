const {PrismaClient} = require('@prisma/client');
const prisma = new PrismaClient();

// Función para obtener la ubicación del repartidor
exports.obtenerUbicacionRepartidor = async (req, res) => {
  try {
    const { repartidorId } = req.params;
    
    // Verificar que el repartidor existe
    const repartidor = await prisma.usuarios.findUnique({
      where: { 
        id: repartidorId,
        rol: 'Repartidor'
      }
    });

    if (!repartidor) {
      return res.status(404).json({ message: 'Repartidor no encontrado' });
    }

    // Obtener la última ubicación registrada
    const ubicacion = await prisma.ubicacion.findFirst({
      where: { usuarioId: repartidorId },
      orderBy: { fechaActualizacion: 'desc' }
    });

    if (!ubicacion) {
      return res.status(404).json({ message: 'No hay ubicación registrada para este repartidor' });
    }

    res.status(200).json(ubicacion);
  } catch (error) {
    console.error('Error al obtener ubicación del repartidor:', error);
    res.status(500).json({ message: 'Error al obtener ubicación', error: error.message });
  }
};

// Función para actualizar la ubicación del repartidor
exports.actualizarUbicacionRepartidor = async (req, res) => {
  try {
    const { repartidorId } = req.params;
    const { latitud, longitud } = req.body;
    const usuarioId = req.user.id;

    // Verificar que el usuario es el repartidor o tiene permisos
    if (repartidorId !== usuarioId) {
      return res.status(403).json({ message: 'No tienes permiso para actualizar esta ubicación' });
    }

    // Verificar que el repartidor existe
    const repartidor = await prisma.usuarios.findUnique({
      where: { 
        id: repartidorId,
        rol: 'Repartidor'
      }
    });

    if (!repartidor) {
      return res.status(404).json({ message: 'Repartidor no encontrado' });
    }

    // Actualizar o crear la ubicación
    const ubicacion = await prisma.ubicacion.upsert({
      where: { 
        usuarioId: repartidorId 
      },
      update: { 
        latitud, 
        longitud, 
        fechaActualizacion: new Date() 
      },
      create: {
        usuarioId: repartidorId,
        latitud,
        longitud,
        fechaActualizacion: new Date()
      }
    });

    res.status(200).json({ message: 'Ubicación actualizada correctamente', ubicacion });
  } catch (error) {
    console.error('Error al actualizar la ubicación del repartidor:', error);
    res.status(500).json({ message: 'Error al actualizar la ubicación', error: error.message });
  }
};

// Función para obtener la ubicación de un pedido
exports.obtenerUbicacionPedido = async (req, res) => {
  try {
    const { pedidoId } = req.params;
    const usuarioId = req.user.id;

    // Verificar que el pedido existe
    const pedido = await prisma.pedidos.findUnique({
      where: { id: pedidoId }
    });

    if (!pedido) {
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }

    // Verificar que el usuario es parte del pedido
    if (pedido.usuario_id !== usuarioId && pedido.repartidor_Id !== usuarioId) {
      return res.status(403).json({ message: 'No tienes permiso para ver la ubicación de este pedido' });
    }

    // Obtener la ubicación del pedido
    const ubicacion = await prisma.ubicacion.findFirst({
      where: { pedidoId: pedidoId },
      orderBy: { fechaActualizacion: 'desc' }
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

// Función para actualizar la ubicación de un pedido
exports.actualizarUbicacionPedido = async (req, res) => {
  try {
    const { pedidoId } = req.params;
    const { latitud, longitud } = req.body;
    const usuarioId = req.user.id;

    // Verificar que el pedido existe
    const pedido = await prisma.pedidos.findUnique({
      where: { id: pedidoId }
    });

    if (!pedido) {
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }

    // Verificar que el usuario es el repartidor asignado al pedido
    if (pedido.repartidor_Id !== usuarioId) {
      return res.status(403).json({ message: 'No tienes permiso para actualizar la ubicación de este pedido' });
    }

    // Actualizar o crear la ubicación del pedido
    const ubicacion = await prisma.ubicacion.upsert({
      where: { 
        pedidoId: pedidoId 
      },
      update: { 
        latitud, 
        longitud, 
        fechaActualizacion: new Date() 
      },
      create: {
        pedidoId,
        latitud,
        longitud,
        fechaActualizacion: new Date()
      }
    });

    res.status(200).json({ message: 'Ubicación del pedido actualizada correctamente', ubicacion });
  } catch (error) {
    console.error('Error al actualizar la ubicación del pedido:', error);
    res.status(500).json({ message: 'Error al actualizar la ubicación', error: error.message });
  }
};

// Función para obtener la ubicación de un cliente
exports.obtenerUbicacionCliente = async (req, res) => {
  try {
    const { clienteId } = req.params;
    const usuarioId = req.user.id;

    // Verificar que el cliente existe
    const cliente = await prisma.usuarios.findUnique({
      where: { 
        id: clienteId,
        rol: 'Cliente'
      }
    });

    if (!cliente) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }

    // Verificar permisos (solo el propio cliente o un repartidor con pedido asignado)
    if (clienteId !== usuarioId && req.user.rol !== 'Repartidor') {
      return res.status(403).json({ message: 'No tienes permiso para ver esta ubicación' });
    }

    // Si es repartidor, verificar que tiene un pedido asignado de este cliente
    if (req.user.rol === 'Repartidor' && clienteId !== usuarioId) {
      const pedidoConCliente = await prisma.pedidos.findFirst({
        where: {
          usuario_id: clienteId,
          repartidor_Id: usuarioId,
          estado: { in: ['ASIGNADO', 'EN_CURSO', 'EN_CAMINO'] }
        }
      });

      if (!pedidoConCliente) {
        return res.status(403).json({ message: 'No tienes pedidos asignados de este cliente' });
      }
    }

    // Obtener la ubicación del cliente
    const ubicacion = await prisma.ubicacion.findFirst({
      where: { usuarioId: clienteId },
      orderBy: { fechaActualizacion: 'desc' }
    });

    if (!ubicacion) {
      return res.status(404).json({ message: 'No hay ubicación registrada para este cliente' });
    }

    res.status(200).json(ubicacion);
  } catch (error) {
    console.error('Error al obtener ubicación del cliente:', error);
    res.status(500).json({ message: 'Error al obtener ubicación', error: error.message });
  }
};

// Mantener la función existente pero no se usa en las rutas
exports.actualizarUbicacion = async (req, res) => {
  const { pedidoId, latitud, longitud } = req.body;

  try {
    // Actualizar la ubicación del repartidor en la base de datos
    const ubicacionActualizada = await prisma.ubicacion.update({
      where: { pedidoId: pedidoId },
      data: { latitud: latitud, longitud: longitud },
    });

    res.status(200).json({ message: 'Ubicación actualizada correctamente', ubicacion: ubicacionActualizada });
  } catch (error) {
    console.error('Error al actualizar la ubicación:', error);
    res.status(500).json({ message: 'Error al actualizar la ubicación' });
  }
};