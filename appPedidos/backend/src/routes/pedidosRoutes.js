const express = require('express');
const router = express.Router();
const pedidosController = require('../controllers/pedidosController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');

// Ruta para obtener historial de pedidos de un cliente
router.get(
  "/cliente",
  authenticate,
  authorize("Cliente", "cliente"),
  pedidosController.getPedidosCliente  // Necesitarás implementar este método
);

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

router.get(
  '/cliente/activo',
  authenticate,
  authorize('Cliente', 'cliente'),
  pedidosController.getPedidoActivo
);

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
// Ruta para obtener detalles de un pedido específico
router.get(
  "/:pedidoId",
  authenticate,
  pedidosController.getPedidoDetalle  
);
router.get(
  "/cliente/activo",
  authenticate,
  pedidosController.getPedidoActivo  
);
module.exports = router;