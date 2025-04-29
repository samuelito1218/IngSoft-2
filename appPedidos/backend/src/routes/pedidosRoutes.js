const express = require('express');
const router = express.Router();
const pedidosController = require('../controllers/pedidosController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');

router.post('/crear',
    authenticate,
    authorize('Cliente','cliente'),
    pedidosController.crearPedido
  );

router.put('/asignar/:pedidoId', authenticate, authorize('Repartidor'), pedidosController.asignarPedido);

router.put(
  '/en-camino/:pedidoId',
  authenticate,
  authorize('Repartidor'),
  pedidosController.marcarEnCamino
);

router.put(
  '/entregar/:pedidoId',
  authenticate,
  authorize('Repartidor'),
  pedidosController.marcarEntregado
);


module.exports = router;

