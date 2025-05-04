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

<<<<<<< HEAD
router.get(
  '/cliente/activo',
  authenticate,
  authorize('Cliente', 'cliente'),
  pedidosController.getPedidoActivo
);
=======
router.delete(
  "/eliminar/:pedidoId",
  authenticate,
  authorize("Cliente", "cliente"),
  pedidosController.eliminarPedido
);

router.put(
  "/editar/:pedidoId",
  authenticate,
  authorize("Cliente", "cliente"),
  pedidosController.editarPedido
);

>>>>>>> 2aba3ca5746de5e21a48e45ff21097ca2129b131

module.exports = router;

