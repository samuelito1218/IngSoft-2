// appPedidos/backend/src/repositories/PagoRepository.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class PagoRepository {
  constructor() {
    this.prisma = prisma;
  }

  /**
   * Crear un nuevo registro de pago
   * @param {Object} paymentData Datos del pago
   * @returns {Promise<Object>} Pago creado
   */
  async createPayment(paymentData) {
    return this.prisma.pagos.create({
      data: paymentData
    });
  }

  /**
   * Obtener un pago por su ID
   * @param {string} id ID del pago
   * @returns {Promise<Object>} Pago encontrado
   */
  async getPaymentById(id) {
    return this.prisma.pagos.findUnique({
      where: { id },
      include: { 
        pedido: true,
        reembolsos: true
      }
    });
  }

  /**
   * Obtener un pago por referencia externa (ID de Stripe)
   * @param {string} referenceId ID de referencia externa
   * @returns {Promise<Object>} Pago encontrado
   */
  async getPaymentByReference(referenceId) {
    return this.prisma.pagos.findFirst({
      where: { referenciaPago: referenceId },
      include: { pedido: true }
    });
  }

  /**
   * Actualizar el estado de un pago
   * @param {string} id ID del pago
   * @param {string} status Nuevo estado
   * @returns {Promise<Object>} Pago actualizado
   */
  async updatePaymentStatus(id, status) {
    return this.prisma.pagos.update({
      where: { id },
      data: { 
        estado: status,
        fechaActualizacion: new Date()
      }
    });
  }

  /**
   * Actualizar múltiples pagos por referencia externa
   * @param {string} referenceId ID de referencia externa
   * @param {Object} data Datos para actualizar
   * @returns {Promise<Object>} Resultado de la actualización
   */
  async updatePaymentsByReference(referenceId, data) {
    return this.prisma.pagos.updateMany({
      where: { referenciaPago: referenceId },
      data: {
        ...data,
        fechaActualizacion: new Date()
      }
    });
  }

  /**
   * Obtener pagos de un usuario
   * @param {string} userId ID del usuario
   * @param {number} page Número de página
   * @param {number} limit Límite de resultados por página
   * @returns {Promise<Object>} Pagos del usuario paginados
   */
  async getPaymentsByUser(userId, page = 1, limit = 10) {
    const skip = (page - 1) * parseInt(limit);
    
    // Buscar los pedidos del usuario
    const pedidos = await this.prisma.pedidos.findMany({
      where: { usuario_id: userId },
      select: { id: true }
    });

    const pedidosIds = pedidos.map(p => p.id);

    // Buscar los pagos relacionados con esos pedidos
    const pagos = await this.prisma.pagos.findMany({
      where: {
        pedido_Id: { in: pedidosIds }
      },
      skip,
      take: parseInt(limit),
      orderBy: {
        fechaCreacion: 'desc'
      },
      include: {
        pedido: {
          select: {
            estado: true,
            fechaDeCreacion: true
          }
        }
      }
    });

    // Contar total para paginación
    const total = await this.prisma.pagos.count({
      where: {
        pedido_Id: { in: pedidosIds }
      }
    });

    return {
      data: pagos,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    };
  }

  /**
   * Crear un reembolso
   * @param {Object} refundData Datos del reembolso
   * @returns {Promise<Object>} Reembolso creado
   */
  async createRefund(refundData) {
    return this.prisma.reembolsos.create({
      data: refundData
    });
  }

  /**
   * Actualizar el estado de un reembolso
   * @param {string} refundId ID del reembolso
   * @param {string} status Nuevo estado
   * @param {number} amount Monto reembolsado (opcional)
   * @returns {Promise<Object>} Reembolso actualizado
   */
  async updateRefundStatus(refundId, status, amount = null) {
    const updateData = { 
      estado: status,
    };

    if (status === 'procesado') {
      updateData.fechaProcesado = new Date();
      if (amount !== null) {
        updateData.montoReembolsado = amount;
      }
    }

    return this.prisma.reembolsos.update({
      where: { id: refundId },
      data: updateData
    });
  }

  /**
   * Obtener estadísticas de pagos
   * @param {string} restauranteId ID del restaurante
   * @param {string} periodo Periodo de tiempo (day, week, month)
   * @returns {Promise<Object>} Estadísticas de pagos
   */
  async getPaymentStats(restauranteId, periodo = 'day') {
    // Calcular fecha de inicio según el periodo
    const startDate = new Date();
    if (periodo === 'day') {
      startDate.setHours(0, 0, 0, 0);
    } else if (periodo === 'week') {
      startDate.setDate(startDate.getDate() - startDate.getDay());
      startDate.setHours(0, 0, 0, 0);
    } else if (periodo === 'month') {
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
    }

    // Obtener productos del restaurante
    const productos = await this.prisma.productos.findMany({
      where: { restaurante_Id: restauranteId },
      select: { id: true }
    });

    const productosIds = productos.map(p => p.id);

    // Buscar los pedidos que contienen estos productos
    const pedidos = await this.prisma.pedidos.findMany({
      where: {
        fechaDeCreacion: { gte: startDate },
        productos: {
          some: {
            productoId: { in: productosIds }
          }
        }
      },
      select: { id: true, total: true }
    });

    const pedidosIds = pedidos.map(p => p.id);
    
    // Calcular total de ventas
    const totalVentas = pedidos.reduce((sum, pedido) => sum + pedido.total, 0);

    // Obtener pagos completados
    const pagosCompletados = await this.prisma.pagos.count({
      where: {
        pedido_Id: { in: pedidosIds },
        estado: 'completado'
      }
    });

    return {
      periodo,
      totalPedidos: pedidos.length,
      totalVentas,
      pagosCompletados,
      promedioVenta: pedidos.length > 0 ? totalVentas / pedidos.length : 0
    };
  }
}

module.exports = PagoRepository;