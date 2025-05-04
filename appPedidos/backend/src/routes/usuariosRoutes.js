// appPedidos/backend/src/routes/usuariosRoutes.js
const express = require('express');
const router = express.Router();
const usuariosController = require('../controllers/usuariosController');
const { authenticate } = require('../middlewares/authMiddleware');

// Rutas para el perfil de usuario
router.get('/perfil', authenticate, usuariosController.getUserProfile);
router.put('/perfil', authenticate, usuariosController.updateUserProfile);
router.put('/perfil/imagen', authenticate, usuariosController.updateProfileImage);

module.exports = router;