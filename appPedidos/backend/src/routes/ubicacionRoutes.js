const express = require('express');
const router = express.Router();
const ubicacionController = require('../controllers/ubicacionController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');

// Ruta para obtener la ubicación actual del repartidor
router.get(
  '/repartidor/:repartidorId',
  authenticate,
  authorize('Repartidor'),
  ubicacionController.obtenerUbicacionRepartidor
);

// Ruta para actualizar la ubicación del repartidor
router.put(
  '/repartidor/:repartidorId',
  authenticate,
  authorize('Repartidor'),
  ubicacionController.actualizarUbicacionRepartidor
);

// Ruta para obtener la ubicación de un pedido
router.get(
  '/pedido/:pedidoId',
  authenticate,
  authorize('Cliente','Repartidor'),
  ubicacionController.obtenerUbicacionPedido
);

// Ruta para actualizar la ubicación de un pedido
router.put(
  '/pedido/:pedidoId',
  authenticate,
  authorize('Cliente','Repartidor'),
  ubicacionController.actualizarUbicacionPedido
);

// Ruta para obtener la ubicación de un cliente 
router.get(
  '/cliente/:clienteId',
  authenticate,
  authorize('Cliente','Repartidor'),
  ubicacionController.obtenerUbicacionCliente
);

module.exports = router;