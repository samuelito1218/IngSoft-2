const express = require('express');
const router = express.Router();
const calificacionesController = require('../controllers/calificacionesController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');
//
router.post(
  '/calificar/:pedidoId',
  authenticate,
  authorize('Cliente', 'cliente'),
  calificacionesController.calificarPedido
);

router.get(
  '/repartidor/:repartidorId',
  authenticate,
  calificacionesController.getCalificacionesRepartidor
);

router.get(
  '/usuario',
  authenticate,
  calificacionesController.getCalificacionesUsuario
);

module.exports = router;