const express = require('express');
const router = express.Router();
const usuariosController = require("../controllers/usuariosController");
const { authenticate } = require('../middlewares/authMiddleware');

console.log("=== Cargando usuariosRoutes.js ===");
console.log("Controlador importado:", Object.keys(usuariosController));

// Rutas explícitas (específicas) primero
router.get('/perfil', authenticate, usuariosController.getUserProfile);
console.log("✓ Ruta registrada: GET /perfil");

router.put('/perfil', authenticate, usuariosController.updateUserProfile);
console.log("✓ Ruta registrada: PUT /perfil");

router.post('/perfil/imagen', authenticate, usuariosController.updateProfileImage);
console.log("✓ Ruta registrada: POST /perfil/imagen");

// Añadir esta línea y log para la ruta de cambio de contraseña
router.post('/perfil/cambiar-contrasena', authenticate, usuariosController.cambiarContrasena);
console.log("✓ Ruta registrada: POST /perfil/cambiar-contrasena");

// IMPORTANTE: Estas rutas de direcciones deben estar ANTES de la ruta con parámetro /:id
router.get('/mis-direcciones', authenticate, usuariosController.obtenerDirecciones);
console.log("✓ Ruta registrada: GET /mis-direcciones");

router.post('/guardar-direccion', authenticate, usuariosController.guardarDireccion);
console.log("✓ Ruta registrada: POST /guardar-direccion");

// Otras rutas específicas
router.get('/mis-pedidos', authenticate, usuariosController.obtenerPedidosUsuario);
console.log("✓ Ruta registrada: GET /mis-pedidos");

router.delete('/eliminar-cuenta', authenticate, usuariosController.eliminarCuentaUsuario);


console.log("Ruta registrada Delete");

// Ruta con parámetro dinámico (DEBE IR AL FINAL)
router.get('/:id', authenticate, usuariosController.getUserById);
console.log("Ruta registrada: GET /:id");



console.log("=== Rutas de usuarios registradas correctamente ===");

module.exports = router;