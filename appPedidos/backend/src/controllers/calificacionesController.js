const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.calificarPedido = async (req, res) => {
  try {

    console.log('Iniciando calificación de pedido con parámetros:', req.params);
    console.log('Body recibido:', req.body);

    const { pedidoId } = req.params;
    const { calificacionRepartidor, calificacionPedido, comentarios } = req.body;
    const usuario_id = req.user.id;
    
    if (calificacionPedido === undefined || calificacionRepartidor === undefined) {
      return res.status(400).json({ message: 'Faltan datos de calificación' });
    }
    
    if (typeof calificacionPedido !== 'number' || typeof calificacionRepartidor !== 'number') {
      return res.status(400).json({ message: 'Las calificaciones deben ser numéricas' });
    }
    
    if (calificacionPedido < 1 || calificacionPedido > 5 || calificacionRepartidor < 1 || calificacionRepartidor > 5) {
      return res.status(400).json({ message: 'Las calificaciones deben estar entre 1 y 5' });
    }
    
    const pedido = await prisma.pedidos.findUnique({
      where: { id: pedidoId }
    });
    
    if (!pedido) {
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }
    
    if (pedido.usuario_id !== usuario_id) {
      return res.status(403).json({ message: 'No tienes permiso para calificar este pedido' });
    }
    
    if (pedido.estado !== 'Entregado') {
      return res.status(400).json({ message: 'Solo se pueden calificar pedidos entregados' });
    }

    console.log("Verificando calificación", pedidoId);
    
    const calificacionExistente = await prisma.calificaciones.findFirst({
      where: { pedidoId: pedidoId }
    });
    
    if (calificacionExistente) {
      return res.status(400).json({ message: 'Este pedido ya ha sido calificado' });
    }
    
    console.log('Creando calificación con datos:', {
      pedidoId,  // CORREGIDO: usar pedidoId
      calificacionRepartidor,
      calificacionPedido,
      comentarios
    });

    const calificacion = await prisma.calificaciones.create({
      data: {
        pedidoId: pedidoId,
        //usuario_id,
        //repartidor_Id: pedido.repartidor_Id,
        calificacionRepartidor,
        calificacionPedido,
        comentarios: comentarios || '',
        //fechaCreacion: new Date()
      }
    });
    console.log('Calificación creada:', calificacion);
    
    res.status(201).json({
      message: 'Calificación guardada correctamente',
      calificacion
    });
  } catch (error) {
    console.error('Error al calificar pedido:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ message: 'Error al guardar la calificación', error: error.message });
  }
};

exports.getCalificacionesRepartidor = async (req, res) => {
  try {
    const { repartidorId } = req.params;
    
    const calificaciones = await prisma.calificaciones.findMany({
      where: { repartidor_Id: repartidorId },
      orderBy: { fechaCreacion: 'desc' }
    });
    
    let promedio = 0;
    if (calificaciones.length > 0) {
      const suma = calificaciones.reduce((acc, cal) => acc + cal.calificacionRepartidor, 0);
      promedio = suma / calificaciones.length;
    }
    
    res.status(200).json({
      calificaciones,
      promedio,
      totalCalificaciones: calificaciones.length
    });
  } catch (error) {
    console.error('Error al obtener calificaciones del repartidor:', error);
    res.status(500).json({ 
      message: 'Error al obtener calificaciones', 
      error: error.message 
    });
  }
};

exports.getCalificacionesUsuario = async (req, res) => {
  try {
    const usuario_id = req.user.id;
    
    const calificaciones = await prisma.calificaciones.findMany({
      where: { usuario_id },
      orderBy: { fechaCreacion: 'desc' },
      include: {
        pedido: true
      }
    });
    
    res.status(200).json(calificaciones);
  } catch (error) {
    console.error('Error al obtener calificaciones del usuario:', error);
    res.status(500).json({ 
      message: 'Error al obtener calificaciones', 
      error: error.message 
    });
  }
};