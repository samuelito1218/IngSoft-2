const express = require('express');
const router = express.Router();
const usuariosController = require("../controllers/UsuariosController");
const { authenticate } = require('../middlewares/authMiddleware');
router.get(
  '/mis-pedidos',
  authenticate,
  usuariosController.obtenerPedidosUsuario
);
// Rutas para el perfil de usuario
router.get('/perfil', authenticate, usuariosController.getUserProfile);
router.put('/perfil', authenticate, usuariosController.updateUserProfile);
router.put('/perfil/imagen', authenticate, usuariosController.updateProfileImage);

// NUEVA RUTA - Obtener usuario por ID
router.get('/:id', authenticate, usuariosController.getUserById);

// Rutas para direcciones de usuario
router.get('/direcciones', authenticate, usuariosController.obtenerDirecciones);
router.post('/direcciones', authenticate, usuariosController.guardarDireccion);

module.exports = router;