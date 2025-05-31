
class PedidoNode {
  constructor(pedido) {
    this.pedido = pedido;
    this.timestamp = new Date().toISOString();
    this.accessCount = 1;
    this.next = null;
    this.prev = null;
  }
}

class PedidoLinkedListCache {
  constructor(maxSize = 50) {
    this.maxSize = maxSize;
    this.size = 0;
    this.cache = new Map(); 
    
    this.head = new PedidoNode({ id: 'HEAD', dummy: true });
    this.tail = new PedidoNode({ id: 'TAIL', dummy: true });
    
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }

  addAfter(prevNode, newNode) {
    const nextNode = prevNode.next;
    
    prevNode.next = newNode;
    newNode.prev = prevNode;
    newNode.next = nextNode;
    nextNode.prev = newNode;
  }

  removeNode(node) {
    const prevNode = node.prev;
    const nextNode = node.next;
    
    prevNode.next = nextNode;
    nextNode.prev = prevNode;
    
    node.prev = null;
    node.next = null;
  }

  moveToFront(node) {
    this.removeNode(node);
    this.addAfter(this.head, node);
    node.timestamp = new Date().toISOString();
    node.accessCount++;
  }

  put(pedido) {
    const pedidoId = pedido.id;
    
    if (this.cache.has(pedidoId)) {
      const existingNode = this.cache.get(pedidoId);
      existingNode.pedido = { ...existingNode.pedido, ...pedido }; // Actualizar datos
      this.moveToFront(existingNode);
      
      console.log(`Pedido ${pedidoId} actualizado en cache y movido al frente`);
      return existingNode;
    }
    
    const newNode = new PedidoNode(pedido);
    
    if (this.size >= this.maxSize) {
      const lru = this.tail.prev;
      if (lru !== this.head) {
        this.cache.delete(lru.pedido.id);
        this.size--;
        
        console.log(`Pedido ${lru.pedido.id} removido del cache (LRU)`);
      }
    }
    
    this.addAfter(this.head, newNode);
    this.cache.set(pedidoId, newNode);
    this.size++;
    
    console.log(`Pedido ${pedidoId} agregado al cache. Tamaño: ${this.size}`);
    return newNode;
  }

  get(pedidoId) {
    if (!this.cache.has(pedidoId)) {
      return null;
    }
    
    const node = this.cache.get(pedidoId);
    this.moveToFront(node);
    
    console.log(`Pedido ${pedidoId} obtenido del cache (acceso #${node.accessCount})`);
    return node.pedido;
  }

  has(pedidoId) {
    return this.cache.has(pedidoId);
  }

  remove(pedidoId) {
    if (!this.cache.has(pedidoId)) {
      return false;
    }
    
    const node = this.cache.get(pedidoId);
    this.removeNode(node);
    this.cache.delete(pedidoId);
    this.size--;
    
    console.log(`Pedido ${pedidoId} removido del cache manualmente`);
    return true;
  }

  getAllOrdered() {
    const pedidos = [];
    let current = this.head.next;
    
    while (current !== this.tail) {
      pedidos.push({
        ...current.pedido,
        cacheInfo: {
          timestamp: current.timestamp,
          accessCount: current.accessCount,
          position: pedidos.length + 1
        }
      });
      current = current.next;
    }
    
    return pedidos;
  }

  getMostAccessed(limit = 10) {
    const allPedidos = this.getAllOrdered();
    return allPedidos
      .sort((a, b) => b.cacheInfo.accessCount - a.cacheInfo.accessCount)
      .slice(0, limit);
  }

  getMostRecent(limit = 10) {
    const allPedidos = this.getAllOrdered();
    return allPedidos
      .sort((a, b) => new Date(b.cacheInfo.timestamp) - new Date(a.cacheInfo.timestamp))
      .slice(0, limit);
  }

  search(filters = {}) {
    const allPedidos = this.getAllOrdered();
    
    return allPedidos.filter(pedido => {
      if (filters.estado && pedido.estado !== filters.estado) {
        return false;
      }
      
      
      if (filters.restaurante && 
          !pedido.restaurante?.nombre?.toLowerCase().includes(filters.restaurante.toLowerCase())) {
        return false;
      }
      
      if (filters.cliente && 
          !pedido.cliente?.nombreCompleto?.toLowerCase().includes(filters.cliente.toLowerCase())) {
        return false;
      }
      
      if (filters.fechaDesde) {
        const fechaPedido = new Date(pedido.fechaDeCreacion || pedido.createdAt);
        const fechaDesde = new Date(filters.fechaDesde);
        if (fechaPedido < fechaDesde) return false;
      }
      
      if (filters.fechaHasta) {
        const fechaPedido = new Date(pedido.fechaDeCreacion || pedido.createdAt);
        const fechaHasta = new Date(filters.fechaHasta);
        if (fechaPedido > fechaHasta) return false;
      }
      
      if (filters.montoMinimo && pedido.total < filters.montoMinimo) {
        return false;
      }
      
      return true;
    });
  }

  getStats() {
    const allPedidos = this.getAllOrdered();
    
    if (allPedidos.length === 0) {
      return {
        size: 0,
        maxSize: this.maxSize,
        utilizacion: 0,
        promedioAccesos: 0,
        estadosDistribution: {},
        restaurantesPopulares: []
      };
    }
    
    const totalAccesos = allPedidos.reduce((sum, p) => sum + p.cacheInfo.accessCount, 0);
    const promedioAccesos = Math.round((totalAccesos / allPedidos.length) * 100) / 100;
    
    const estadosDistribution = {};
    allPedidos.forEach(pedido => {
      const estado = pedido.estado || 'DESCONOCIDO';
      estadosDistribution[estado] = (estadosDistribution[estado] || 0) + 1;
    });
    
    const restaurantesCount = {};
    allPedidos.forEach(pedido => {
      const nombreRestaurante = pedido.restaurante?.nombre || 'Desconocido';
      restaurantesCount[nombreRestaurante] = (restaurantesCount[nombreRestaurante] || 0) + 1;
    });
    
    const restaurantesPopulares = Object.entries(restaurantesCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([nombre, count]) => ({ nombre, count }));
    
    return {
      size: this.size,
      maxSize: this.maxSize,
      utilizacion: Math.round((this.size / this.maxSize) * 100),
      promedioAccesos,
      estadosDistribution,
      restaurantesPopulares
    };
  }

  clear() {
    this.cache.clear();
    this.head.next = this.tail;
    this.tail.prev = this.head;
    this.size = 0;
    
    console.log('Cache de pedidos limpiado');
  }

  optimize() {
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - 24); 
    
    let current = this.tail.prev;
    let removedCount = 0;
    
    while (current !== this.head) {
      const nodeTime = new Date(current.timestamp);
      const prev = current.prev;
      
      if (nodeTime < cutoffTime && current.accessCount <= 2) {
        this.removeNode(current);
        this.cache.delete(current.pedido.id);
        this.size--;
        removedCount++;
      }
      
      current = prev;
    }
    
    console.log(`Cache optimizado: ${removedCount} pedidos antiguos removidos`);
    return removedCount;
  }
}

const pedidoCache = new PedidoLinkedListCache(50);
export default pedidoCache;