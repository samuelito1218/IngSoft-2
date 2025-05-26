// Rutas para productos
const express = require('express');
const router = express.Router();
const productosController = require('../controllers/productosController');
const { authenticate } = require('../middlewares/authMiddleware');
//
// Rutas públicas
router.get('/', productosController.listarProductos);
router.get('/restaurante/:restauranteId', productosController.listarProductosPorRestaurante);
router.get('/sucursal/:sucursalId', productosController.listarProductosPorSucursal);  // Nueva


// Rutas que necesitan el ID del producto - deben ir después de las específicas
router.get('/:id', productosController.obtenerProducto);


// Rutas protegidas (requieren autenticación)
router.post('/', authenticate, productosController.crearProducto);
router.put('/:productoId', authenticate, productosController.editarProducto); //Corregida
router.delete('/:id', authenticate, productosController.eliminarProducto);

module.exports = router;