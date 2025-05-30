// utils/PedidoPriorityQueue.js
class PedidoPriorityQueue {
  constructor() {
    this.heap = [];
    this.size = 0;
  }

  // Calcular prioridad SOLO basada en precio
  calculatePriority(pedido) {
    // Solo precio: más alto = mayor prioridad
    const total = pedido.total || 0;
    return Math.round(total * 100) / 100; // Usar el precio directamente como prioridad
  }

  // Obtener índice del padre
  getParentIndex(index) {
    return Math.floor((index - 1) / 2);
  }

  // Obtener índice del hijo izquierdo
  getLeftChildIndex(index) {
    return 2 * index + 1;
  }

  // Obtener índice del hijo derecho
  getRightChildIndex(index) {
    return 2 * index + 2;
  }

  // Verificar si tiene padre
  hasParent(index) {
    return this.getParentIndex(index) >= 0;
  }

  // Verificar si tiene hijo izquierdo
  hasLeftChild(index) {
    return this.getLeftChildIndex(index) < this.size;
  }

  // Verificar si tiene hijo derecho
  hasRightChild(index) {
    return this.getRightChildIndex(index) < this.size;
  }

  // Obtener valor del padre
  parent(index) {
    return this.heap[this.getParentIndex(index)];
  }

  // Obtener valor del hijo izquierdo
  leftChild(index) {
    return this.heap[this.getLeftChildIndex(index)];
  }

  // Obtener valor del hijo derecho
  rightChild(index) {
    return this.heap[this.getRightChildIndex(index)];
  }

  // Intercambiar elementos
  swap(index1, index2) {
    [this.heap[index1], this.heap[index2]] = [this.heap[index2], this.heap[index1]];
  }

  // Ver el elemento de mayor prioridad sin quitarlo
  peek() {
    if (this.size === 0) return null;
    return this.heap[0];
  }

  // Agregar pedido a la cola con prioridad
  enqueue(pedido) {
    const priority = this.calculatePriority(pedido);
    const elemento = {
      pedido,
      priority,
      timestamp: new Date().toISOString(),
      id: pedido.id
    };
    
    this.heap[this.size] = elemento;
    this.size++;
    this.heapifyUp();
    
    return elemento;
  }

  // Quitar pedido de mayor prioridad
  dequeue() {
    if (this.size === 0) return null;
    
    const item = this.heap[0];
    this.heap[0] = this.heap[this.size - 1];
    this.size--;
    this.heapifyDown();
    
    return item;
  }

  // Mantener propiedad de heap hacia arriba
  heapifyUp() {
    let index = this.size - 1;
    while (this.hasParent(index) && this.parent(index).priority < this.heap[index].priority) {
      this.swap(this.getParentIndex(index), index);
      index = this.getParentIndex(index);
    }
  }

  // Mantener propiedad de heap hacia abajo
  heapifyDown() {
    let index = 0;
    while (this.hasLeftChild(index)) {
      let largerChildIndex = this.getLeftChildIndex(index);
      
      if (this.hasRightChild(index) && 
          this.rightChild(index).priority > this.leftChild(index).priority) {
        largerChildIndex = this.getRightChildIndex(index);
      }
      
      if (this.heap[index].priority > this.heap[largerChildIndex].priority) {
        break;
      } else {
        this.swap(index, largerChildIndex);
      }
      
      index = largerChildIndex;
    }
  }

  // Obtener todos los pedidos ordenados por prioridad (precio)
  getAllSorted() {
    return [...this.heap]
      .slice(0, this.size)
      .sort((a, b) => b.priority - a.priority)
      .map(item => ({
        ...item.pedido,
        priority: item.priority
      }));
  }

  // Buscar pedido por ID
  findById(pedidoId) {
    for (let i = 0; i < this.size; i++) {
      if (this.heap[i].pedido.id === pedidoId) {
        return {
          index: i,
          element: this.heap[i]
        };
      }
    }
    return null;
  }

  // Remover pedido específico por ID
  removeById(pedidoId) {
    const found = this.findById(pedidoId);
    if (!found) return null;
    
    const { index } = found;
    const item = this.heap[index];
    
    // Mover último elemento a la posición del elemento a remover
    this.heap[index] = this.heap[this.size - 1];
    this.size--;
    
    // Rebalancear heap
    if (index < this.size) {
      this.heapifyUp();
      this.heapifyDown();
    }
    
    return item;
  }

  // Verificar si está vacía
  isEmpty() {
    return this.size === 0;
  }

  // Obtener tamaño
  getSize() {
    return this.size;
  }

  // Limpiar cola
  clear() {
    this.heap = [];
    this.size = 0;
  }
}

// Instancia singleton
const pedidoPriorityQueue = new PedidoPriorityQueue();
export default pedidoPriorityQueue;