const express = require('express');
const router = express.Router();
const restaurantesController = require("../controllers/restaurantesController");
const { authenticate /*authorize*/ } = require('../middlewares/authMiddleware');
//

// Listar todos los restaurantes
router.get(
  "/",
  restaurantesController.listarRestaurantes
);


// Obtener restaurantes del usuario logueado
router.get('/mine', authenticate, restaurantesController.obtenerMisRestaurantes);

// Ruta alternativa para obtener mis restaurantes (para compatibilidad)
router.get(
  "/mis-restaurantes",
  authenticate,
  restaurantesController.obtenerMisRestaurantes
);

// Obtener detalles de un restaurante específico
router.get(
  "/:id",
  restaurantesController.obtenerRestaurante
);

// Listar productos de un restaurante
router.get(
  "/:restauranteId/productos",
  restaurantesController.listarProductosPorRestaurante
);

// ==== RUTAS DE RESTAURANTES (REQUIEREN AUTENTICACIÓN) ====





// Crear un restaurante
router.post(
  "/crear",
  authenticate,
  restaurantesController.crearRestaurante
);

// Actualizar imagen de un restaurante
router.put(
  "/:restauranteId/imagen",
  authenticate,
  restaurantesController.actualizarImagen
);

// Editar un restaurante
router.put(
  "/editar/:restauranteId",
  authenticate,
  restaurantesController.editarRestaurante
);

// Eliminar un restaurante
router.delete(
  "/eliminar/:restauranteId",
  authenticate,
  restaurantesController.eliminarRestaurante
);

// ==== RUTAS DE SUCURSALES ====

// Crear una sucursal
router.post(
  "/sucursales", 
  authenticate, 
  restaurantesController.crearSucursal
);

// Listar sucursales de un restaurante
router.get(
  "/:restauranteId/sucursales", 
  authenticate, 
  restaurantesController.listarSucursalesPorRestaurante
);

// Actualizar una sucursal
router.put(
  "/sucursales/:id", 
  authenticate, 
  restaurantesController.actualizarSucursal
);

// Eliminar una sucursal
router.delete(
  "/sucursales/:id", 
  authenticate, 
  restaurantesController.eliminarSucursal
);
module.exports = router;