const express = require('express');
const router = express.Router();
const calificacionesController = require('../controllers/calificacionesController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');

// Ruta para que el cliente califique un pedido ya entregado
router.post(
  '/calificar/:pedidoId',
  authenticate,
  authorize('Cliente','cliente'),
  calificacionesController.calificarPedido
);

module.exports = router;
