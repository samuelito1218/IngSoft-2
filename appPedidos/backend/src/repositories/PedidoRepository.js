// appPedidos/backend/src/repositories/PedidoRepository.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class PedidoRepository {
  constructor() {
    this.prisma = prisma;
  }

  /**
   * Crear un nuevo pedido
   * @param {Object} pedidoData Datos del pedido
   * @returns {Promise<Object>} Pedido creado
   */
  async createPedido(pedidoData) {
    return this.prisma.pedidos.create({
      data: pedidoData
    });
  }

  /**
   * Obtener un pedido por su ID
   * @param {string} id ID del pedido
   * @returns {Promise<Object>} Pedido encontrado
   */
  async getPedidoById(id) {
    return this.prisma.pedidos.findUnique({
      where: { id }
    });
  }

  /**
   * Obtener un pedido con detalles completos
   * @param {string} id ID del pedido
   * @returns {Promise<Object>} Pedido con detalles
   */
  async getPedidoWithDetails(id) {
    return this.prisma.pedidos.findUnique({
      where: { id },
      include: {
        calificaciones: true
      }
    });
  }

  /**
   * Actualizar un pedido
   * @param {string} id ID del pedido
   * @param {Object} updateData Datos a actualizar
   * @returns {Promise<Object>} Pedido actualizado
   */
  async updatePedido(id, updateData) {
    return this.prisma.pedidos.update({
      where: { id },
      data: updateData
    });
  }

  /**
   * Actualizar el estado de un pedido
   * @param {string} id ID del pedido
   * @param {string} estado Nuevo estado
   * @returns {Promise<Object>} Pedido actualizado
   */
  async updatePedidoEstado(id, estado) {
    return this.prisma.pedidos.update({
      where: { id },
      data: { estado }
    });
  }

  /**
   * Obtener pedidos de un cliente
   * @param {string} usuarioId ID del cliente
   * @param {number} page Número de página
   * @param {number} limit Límite de resultados por página
   * @returns {Promise<Object>} Pedidos del cliente paginados
   */
  async getPedidosByCliente(usuarioId, page = 1, limit = 10) {
    const skip = (page - 1) * parseInt(limit);
    
    const pedidos = await this.prisma.pedidos.findMany({
      where: { usuario_id: usuarioId },
      skip,
      take: parseInt(limit),
      orderBy: {
        fechaDeCreacion: 'desc'
      }
    });

    const total = await this.prisma.pedidos.count({
      where: { usuario_id: usuarioId }
    });

    return {
      data: pedidos,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    };
  }

  /**
   * Obtener pedidos de un repartidor
   * @param {string} repartidorId ID del repartidor
   * @param {string} estado Estado del pedido (opcional)
   * @param {number} page Número de página
   * @param {number} limit Límite de resultados por página
   * @returns {Promise<Object>} Pedidos del repartidor paginados
   */
  async getPedidosByRepartidor(repartidorId, estado = null, page = 1, limit = 10) {
    const skip = (page - 1) * parseInt(limit);
    
    const whereClause = { repartidor_Id: repartidorId };
    if (estado) {
      whereClause.estado = estado;
    }
    
    const pedidos = await this.prisma.pedidos.findMany({
      where: whereClause,
      skip,
      take: parseInt(limit),
      orderBy: {
        fechaDeCreacion: 'desc'
      }
    });

    const total = await this.prisma.pedidos.count({
      where: whereClause
    });

    return {
      data: pedidos,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    };
  }

  /**
   * Obtener pedidos pendientes (sin repartidor asignado)
   * @param {number} page Número de página
   * @param {number} limit Límite de resultados por página
   * @returns {Promise<Object>} Pedidos pendientes paginados
   */
  async getPedidosPendientes(page = 1, limit = 10) {
    const skip = (page - 1) * parseInt(limit);
    
    const pedidos = await this.prisma.pedidos.findMany({
      where: { 
        estado: 'Pendiente',
        repartidor_Id: null
      },
      skip,
      take: parseInt(limit),
      orderBy: {
        fechaDeCreacion: 'asc'
      }
    });

    const total = await this.prisma.pedidos.count({
      where: { 
        estado: 'Pendiente',
        repartidor_Id: null
      }
    });

    return {
      data: pedidos,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    };
  }

  /**
   * Asignar un repartidor a un pedido
   * @param {string} pedidoId ID del pedido
   * @param {string} repartidorId ID del repartidor
   * @returns {Promise<Object>} Pedido actualizado
   */
  async asignarRepartidor(pedidoId, repartidorId) {
    return this.prisma.pedidos.update({
      where: { id: pedidoId },
      data: { repartidor_Id: repartidorId }
    });
  }

  /**
   * Obtener pedido activo de un cliente
   * @param {string} clienteId ID del cliente
   * @returns {Promise<Object>} Pedido activo
   */
  async getPedidoActivoCliente(clienteId) {
    return this.prisma.pedidos.findFirst({
      where: {
        usuario_id: clienteId,
        estado: {
          in: ['Pendiente', 'En_Camino']
        }
      },
      orderBy: {
        fechaDeCreacion: 'desc'
      }
    });
  }

  /**
   * Obtener pedido activo de un repartidor
   * @param {string} repartidorId ID del repartidor
   * @returns {Promise<Object>} Pedido activo
   */
  async getPedidoActivoRepartidor(repartidorId) {
    return this.prisma.pedidos.findFirst({
      where: {
        repartidor_Id: repartidorId,
        estado: {
          in: ['Pendiente', 'En_Camino']
        }
      },
      orderBy: {
        fechaDeCreacion: 'desc'
      }
    });
  }

  /**
   * Actualizar ubicación del repartidor en un pedido
   * @param {string} pedidoId ID del pedido
   * @param {Object} ubicacion Datos de ubicación
   * @returns {Promise<Object>} Pedido actualizado
   */
  async updateUbicacionRepartidor(pedidoId, ubicacion) {
    return this.prisma.pedidos.update({
      where: { id: pedidoId },
      data: {
        UbicacionRepartidor: {
          lat: ubicacion.lat,
          lng: ubicacion.lng,
          heading: ubicacion.heading || 0,
          timestamp: new Date()
        }
      }
    });
  }

  /**
   * Añadir un mensaje a un pedido
   * @param {string} pedidoId ID del pedido
   * @param {string} mensajeId ID del mensaje
   * @returns {Promise<Object>} Pedido actualizado
   */
  async addMensajeToPedido(pedidoId, mensajeId) {
    const pedido = await this.prisma.pedidos.findUnique({
      where: { id: pedidoId },
      select: { mensajes: true }
    });                     
    const mensajes = pedido.mensajes || [];
    mensajes.push(mensajeId);
    return this.prisma.pedidos.update({
      where: { id: pedidoId },
      data: { mensajes }
    });
  }
}