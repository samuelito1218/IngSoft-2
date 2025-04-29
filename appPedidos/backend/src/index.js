// Corrección de src/index.js

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/authRoutes');
const pedidoRoutes = require("./routes/pedidosRoutes"); //Nueva importación
const calificacionesRoutes = require("./routes/calificacionesRoutes"); //Nueva importación

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
app.use("/api/pedidos", pedidoRoutes); //esto es nuevo
app.use("/api/calificaciones", calificacionesRoutes); //Nuevo

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

