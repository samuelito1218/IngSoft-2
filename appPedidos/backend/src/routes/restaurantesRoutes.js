const express = require('express');
const router = express.Router();
const restaurantesController = require("../controllers/restaurantesController");
const { authenticate, /*authorize*/ } = require('../middlewares/authMiddleware');

//Ruta para crear un restaurante
router.post(
    "/crear",
    authenticate,
    //authorize("Admin", "admin"),
    restaurantesController.crearRestaurante
);
//Ruta para agregar una sucursal
router.post(
    "/:restauranteId/agregar-sucursal",
    authenticate,
    restaurantesController.agregarSucursal
  );

//Ruta para eliminar una sucursal
router.delete(
    "/eliminar-sucursal/:sucursalId",
    authenticate,
    restaurantesController.eliminarSucursal
  );
//Ruta para listar las sucursales de un restaurante
router.get(
    "/:restauranteId/sucursales",
    authenticate,
    restaurantesController.listarSucursalesPorRestaurante
  );
//Ruta para listar restaurantes
router.get(
    "/mis-restaurantes",
    authenticate,
    restaurantesController.listarMisRestaurantes
  );
//Ruta para actualizar restaurante
router.put(
    "/editar/:restauranteId",
    authenticate,
    restaurantesController.editarRestaurante
  );
//Ruta para eliminar un restaurante
router.delete(
    "/eliminar/:restauranteId",
    authenticate,
    restaurantesController.eliminarRestaurante
  );
  
  

module.exports = router;