const express = require('express');
const router = express.Router();

const restaurantesVerificacionController = require('../controllers/restaurantesVerificacionController');
// Cambia esto:
// const { authMiddleware } = require('../middlewares/authMiddleware');
// Por esto:
const { authenticate } = require('../middlewares/authMiddleware');

// Ruta para crear solicitud de verificación
router.post(
  '/crear',
  authenticate, // Cambiado de authMiddleware a authenticate
  restaurantesVerificacionController.upload,
  restaurantesVerificacionController.crearRestauranteVerificacion
);

// Ruta para aprobar verificación (solo SuperAdmin)
router.put(
  '/aprobar/:verificacionId',
  authenticate, // Cambiado de authMiddleware a authenticate
  restaurantesVerificacionController.aprobarVerificacion
);

module.exports = router;