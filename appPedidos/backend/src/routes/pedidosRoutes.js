const express = require('express');
const router = express.Router();
const pedidosController = require('../controllers/pedidosController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');

router.post('/crear',
    authenticate,
    authorize('Cliente','cliente'),
    pedidosController.crearPedido
  );
  module.exports = router;
