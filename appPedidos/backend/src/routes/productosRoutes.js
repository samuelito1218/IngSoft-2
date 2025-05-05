// Rutas para productos
const express = require('express');
const router = express.Router();
const productosController = require('../controllers/productosController');
const { authenticate } = require('../middlewares/authMiddleware');

// Rutas públicas
router.get('/', productosController.listarProductos);
router.get('/:id', productosController.obtenerProducto);
router.get('/restaurante/:restauranteId', productosController.listarProductosPorRestaurante);

// Rutas protegidas (requieren autenticación)
router.post('/', authenticate, productosController.crearProducto);
router.put('/:id', authenticate, productosController.actualizarProducto);
router.delete('/:id', authenticate, productosController.eliminarProducto);

module.exports = router;