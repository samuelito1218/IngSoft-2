// utils/PedidoStateStack.js
class PedidoStateStack {
  constructor() {
    this.stacks = {}; // Un stack por cada pedido
  }

  // Crear stack para un pedido específico
  initPedido(pedidoId, estadoInicial = 'PENDIENTE') {
    if (!this.stacks[pedidoId]) {
      this.stacks[pedidoId] = [];
      this.push(pedidoId, {
        estado: estadoInicial,
        timestamp: new Date().toISOString(),
        accion: 'PEDIDO_CREADO'
      });
    }
  }

  // Agregar nuevo estado al stack (LIFO)
  push(pedidoId, estadoInfo) {
    if (!this.stacks[pedidoId]) {
      this.initPedido(pedidoId);
    }
    
    const registro = {
      ...estadoInfo,
      timestamp: estadoInfo.timestamp || new Date().toISOString(),
      orden: this.stacks[pedidoId].length + 1
    };
    
    this.stacks[pedidoId].push(registro);
    console.log(`Estado agregado al pedido ${pedidoId}:`, registro);
    
    return registro;
  }

  // Obtener el estado más reciente sin quitarlo
  peek(pedidoId) {
    if (!this.stacks[pedidoId] || this.stacks[pedidoId].length === 0) {
      return null;
    }
    return this.stacks[pedidoId][this.stacks[pedidoId].length - 1];
  }

  // Quitar el estado más reciente (por si necesitas rollback)
  pop(pedidoId) {
    if (!this.stacks[pedidoId] || this.stacks[pedidoId].length === 0) {
      return null;
    }
    return this.stacks[pedidoId].pop();
  }

  // Obtener historial completo de un pedido
  getHistorial(pedidoId) {
    return this.stacks[pedidoId] || [];
  }

  // Obtener estado actual de un pedido
  getCurrentState(pedidoId) {
    const current = this.peek(pedidoId);
    return current ? current.estado : null;
  }

  // Verificar si un pedido puede cambiar a cierto estado
  canTransitionTo(pedidoId, nuevoEstado) {
    const estadoActual = this.getCurrentState(pedidoId);
    
    // Definir transiciones válidas
    const transicionesValidas = {
      'PENDIENTE': ['EN_CAMINO', 'CANCELADO'],
      'EN_CAMINO': ['ENTREGADO', 'CANCELADO'],
      'ENTREGADO': [], // Estado final
      'CANCELADO': []  // Estado final
    };
    
    if (!estadoActual) return false;
    
    return transicionesValidas[estadoActual]?.includes(nuevoEstado) || false;
  }

  // Obtener tiempo en estado actual
  getTimeInCurrentState(pedidoId) {
    const current = this.peek(pedidoId);
    if (!current) return 0;
    
    const ahora = new Date();
    const inicioEstado = new Date(current.timestamp);
    return Math.floor((ahora - inicioEstado) / 1000 / 60); // minutos
  }

  // Obtener estadísticas del pedido
  getEstadisticas(pedidoId) {
    const historial = this.getHistorial(pedidoId);
    if (historial.length === 0) return null;

    const tiempoTotal = this.getTiempoTotal(pedidoId);
    const estadoActual = this.getCurrentState(pedidoId);
    const cantidadCambios = historial.length - 1;

    return {
      pedidoId,
      estadoActual,
      tiempoTotalMinutos: tiempoTotal,
      cantidadCambiosEstado: cantidadCambios,
      tiempoEnEstadoActual: this.getTimeInCurrentState(pedidoId),
      historialCompleto: historial
    };
  }

  // Calcular tiempo total desde creación
  getTiempoTotal(pedidoId) {
    const historial = this.getHistorial(pedidoId);
    if (historial.length === 0) return 0;

    const inicio = new Date(historial[0].timestamp);
    const ahora = new Date();
    return Math.floor((ahora - inicio) / 1000 / 60); // minutos
  }

  // Limpiar stack de un pedido completado
  cleanup(pedidoId) {
    const estado = this.getCurrentState(pedidoId);
    if (estado === 'ENTREGADO' || estado === 'CANCELADO') {
      // Guardar en historial permanente si es necesario
      const historial = this.getHistorial(pedidoId);
      
      // Limpiar de memoria
      delete this.stacks[pedidoId];
      
      console.log(`Stack del pedido ${pedidoId} limpiado. Historial guardado:`, historial);
      return historial;
    }
    return null;
  }

  // Obtener todos los pedidos activos
  getPedidosActivos() {
    const activos = {};
    
    Object.keys(this.stacks).forEach(pedidoId => {
      const estado = this.getCurrentState(pedidoId);
      if (estado !== 'ENTREGADO' && estado !== 'CANCELADO') {
        activos[pedidoId] = {
          estado,
          tiempoEnEstado: this.getTimeInCurrentState(pedidoId),
          estadisticas: this.getEstadisticas(pedidoId)
        };
      }
    });
    
    return activos;
  }
}

// Instancia singleton para usar en toda la aplicación
const pedidoStateStack = new PedidoStateStack();
export default pedidoStateStack;