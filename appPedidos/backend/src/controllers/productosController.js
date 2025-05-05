// Controlador de productos
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Método para listar todos los productos
exports.listarProductos = async (req, res) => {
  try {
    const productos = await prisma.productos.findMany();
    
    res.status(200).json(productos);
  } catch (error) {
    console.error("Error al listar productos:", error);
    res.status(500).json({
      message: "Error interno al listar productos",
      error: error.message
    });
  }
};

// Método para obtener un producto específico por ID
exports.obtenerProducto = async (req, res) => {
  try {
    const { id } = req.params;
    
    const producto = await prisma.productos.findUnique({
      where: { id },
      include: {
        restaurante: true
      }
    });
    
    if (!producto) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }
    
    res.status(200).json(producto);
  } catch (error) {
    console.error("Error al obtener producto:", error);
    res.status(500).json({
      message: "Error interno al obtener el producto",
      error: error.message
    });
  }
};

// Método para listar productos por restaurante
exports.listarProductosPorRestaurante = async (req, res) => {
  try {
    const { restauranteId } = req.params;
    
    // Verificar que el restaurante existe
    const restaurante = await prisma.restaurantes.findUnique({
      where: { id: restauranteId }
    });
    
    if (!restaurante) {
      return res.status(404).json({ message: "Restaurante no encontrado" });
    }
    
    // Buscar productos del restaurante
    const productos = await prisma.productos.findMany({
      where: { restaurante_Id: restauranteId }
    });
    
    res.status(200).json(productos);
  } catch (error) {
    console.error("Error al listar productos del restaurante:", error);
    res.status(500).json({
      message: "Error interno al listar productos",
      error: error.message
    });
  }
};

// Método para crear un producto
exports.crearProducto = async (req, res) => {
  try {
    const { nombre, especificaciones, precio, restaurante_Id } = req.body;
    
    // Validar datos requeridos
    if (!nombre || !especificaciones || precio === undefined || !restaurante_Id) {
      return res.status(400).json({ 
        message: "Faltan datos requeridos. Se necesita nombre, especificaciones, precio y restaurante_Id" 
      });
    }
    
    // Verificar que el restaurante existe
    const restaurante = await prisma.restaurantes.findUnique({
      where: { id: restaurante_Id }
    });
    
    if (!restaurante) {
      return res.status(404).json({ message: "Restaurante no encontrado" });
    }
    
    // Crear el producto
    const nuevoProducto = await prisma.productos.create({
      data: {
        nombre,
        especificaciones,
        precio: parseFloat(precio),
        restaurante_Id
      }
    });
    
    res.status(201).json({
      message: "Producto creado exitosamente",
      producto: nuevoProducto
    });
  } catch (error) {
    console.error("Error al crear producto:", error);
    res.status(500).json({
      message: "Error interno al crear el producto",
      error: error.message
    });
  }
};

// Método para actualizar un producto
exports.actualizarProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, especificaciones, precio } = req.body;
    
    // Verificar que el producto existe
    const producto = await prisma.productos.findUnique({
      where: { id }
    });
    
    if (!producto) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }
    
    // Actualizar el producto
    const productoActualizado = await prisma.productos.update({
      where: { id },
      data: {
        nombre: nombre || producto.nombre,
        especificaciones: especificaciones || producto.especificaciones,
        precio: precio !== undefined ? parseFloat(precio) : producto.precio
      }
    });
    
    res.status(200).json({
      message: "Producto actualizado exitosamente",
      producto: productoActualizado
    });
  } catch (error) {
    console.error("Error al actualizar producto:", error);
    res.status(500).json({
      message: "Error interno al actualizar el producto",
      error: error.message
    });
  }
};

// Método para eliminar un producto
exports.eliminarProducto = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar que el producto existe
    const producto = await prisma.productos.findUnique({
      where: { id }
    });
    
    if (!producto) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }
    
    // Eliminar el producto
    await prisma.productos.delete({
      where: { id }
    });
    
    res.status(200).json({
      message: "Producto eliminado exitosamente"
    });
  } catch (error) {
    console.error("Error al eliminar producto:", error);
    res.status(500).json({
      message: "Error interno al eliminar el producto",
      error: error.message
    });
  }
};