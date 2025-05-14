const express = require('express');
const router = express.Router();
const restaurantesController = require("../controllers/restaurantesController");
const { authenticate /*authorize*/ } = require('../middlewares/authMiddleware');


// GET /restaurants/mine → devuelve sólo los del owner logueado
router.get('/mine', authenticate, restaurantesController.obtenerMisRestaurantes);

router.get(
  "/",
  restaurantesController.listarRestaurantes // Necesitarás crear este método
);
// Ruta para crear un restaurante
router.post(
    "/crear",
    authenticate,
    //authorize("Admin", "admin"),
    restaurantesController.crearRestaurante
);
router.put(
    "/:restauranteId/imagen",
    authenticate,
    restaurantesController.actualizarImagen
);
// Ruta para agregar una ubicación (antes era sucursal)
router.post(
    "/:restauranteId/agregar-ubicacion",
    authenticate,
    restaurantesController.agregarUbicacion // Cambiado de agregarSucursal
);

// Ruta para eliminar una ubicación
router.delete(
    "/eliminar-ubicacion/:restauranteId/:ubicacionIndex", // Cambiado el formato
    authenticate,
    restaurantesController.eliminarUbicacion // Cambiado de eliminarSucursal
);

// Ruta para listar las ubicaciones de un restaurante
router.get(
    "/:restauranteId/ubicaciones", // Cambiado de sucursales
    authenticate,
    restaurantesController.listarUbicacionesPorRestaurante // Cambiado
);

// Ruta para listar restaurantes
router.get(
    "/mis-restaurantes",
    authenticate,
    restaurantesController.listarMisRestaurantes
);
//obtener los detalles de un restaurante específico
router.get(
  "/:id",
  restaurantesController.obtenerRestaurante
);
// Ruta para actualizar restaurante
router.put(
    "/editar/:restauranteId",
    authenticate,
    restaurantesController.editarRestaurante
);
// Ruta para listar productos de un restaurante
router.get(
  "/:restauranteId/productos",
  restaurantesController.listarProductosPorRestaurante
);
// Ruta para eliminar un restaurante
router.delete(
    "/eliminar/:restauranteId",
    authenticate,
    restaurantesController.eliminarRestaurante
);




module.exports = router;