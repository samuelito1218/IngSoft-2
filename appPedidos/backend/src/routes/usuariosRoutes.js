const express = require('express');
const router = express.Router();
const usuariosController = require("../controllers/usuariosController");
const { authenticate } = require('../middlewares/authMiddleware');
//
// Rutas explícitas (específicas) primero
router.get('/perfil', authenticate, usuariosController.getUserProfile);
router.put('/perfil', authenticate, usuariosController.updateUserProfile);
router.post('/perfil/imagen', authenticate, usuariosController.updateProfileImage);

// IMPORTANTE: Estas rutas de direcciones deben estar ANTES de la ruta con parámetro /:id
router.get('/mis-direcciones', authenticate, usuariosController.obtenerDirecciones); // CAMBIO DE NOMBRE DE RUTA
router.post('/guardar-direccion', authenticate, usuariosController.guardarDireccion); // CAMBIO DE NOMBRE DE RUTA

// Otras rutas específicas
router.get('/mis-pedidos', authenticate, usuariosController.obtenerPedidosUsuario);

// Ruta con parámetro dinámico (DEBE IR AL FINAL)
router.get('/:id', authenticate, usuariosController.getUserById);

module.exports = router;