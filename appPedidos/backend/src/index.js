// Corrección de src/index.js

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/authRoutes');
const pedidoRoutes = require("./routes/pedidosRoutes"); 
const mensajesRoutes = require("./routes/mensajesRoutes"); 
const ubicacionRoutes = require("./routes/ubicacionRoutes"); 
const calificacionesRoutes = require("./routes/calificacionesRoutes"); 
const restaurantesRoutes = require("./routes/restaurantesRoutes");
const usuariosRoutes = require('./routes/usuariosRoutes');
const productosRoutes = require('./routes/productosRoutes');
const sucursalesRoutes = require('./routes/sucursalesRoutes');
// Cargar variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors({
  origin: 'http://localhost:5173', // URL de tu frontend React/Vite
  credentials: true // Permite enviar cookies si es necesario
}));
app.use(express.json());

// Rutas
app.use('/api/auth', authRoutes);
app.use("/api/pedidos", pedidoRoutes);
app.use("/api/calificaciones", calificacionesRoutes);
app.use('/api/mensajes', mensajesRoutes);        
app.use('/api/ubicacion', ubicacionRoutes);    
app.use("/api/restaurantes",restaurantesRoutes); 
app.use('/api/usuarios', usuariosRoutes); 
app.use('/api/productos', productosRoutes);
app.use('/api/sucursales',sucursalesRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ message: 'API de AppPedidos funcionando correctamente' });
});

// Middleware para manejo de errores
app.use((err, req, res, next) => {
  console.error('Error general:', err);
  res.status(500).json({ 
    message: 'Error interno del servidor', 
    error: process.env.NODE_ENV === 'development' ? err.message : undefined 
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

