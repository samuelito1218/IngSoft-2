// backend/src/routes/sucursalesRoutes.js
const express = require('express');
const router  = express.Router();
const { authenticate } = require('../middlewares/authMiddleware');
const ctrl    = require('../controllers/sucursalesController');
//
// POST /api/sucursales
router.post('/', authenticate, ctrl.crearSucursal);

module.exports = router;
