// Mover este archivo a una subcarpeta para evitar conflictos
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
//
// Controlador dedicado solo para direcciones
exports.listarDirecciones = async (req, res) => {
  try {
    // Responder siempre con un array vacío mientras depuramos
    console.log('Intento de obtener direcciones para el usuario ID:', req.user?.id);
    
    // Para depuración, siempre devolver un array vacío primero
    return res.status(200).json([]);
    
    // Código original comentado para depuración
    /*
    // Verificar que req.user existe
    if (!req.user || !req.user.id) {
      console.error('Error: req.user o req.user.id es undefined');
      return res.status(401).json({ message: "Usuario no autenticado o token inválido" });
    }

    const usuario = await prisma.usuarios.findUnique({
      where: { 
        id: req.user.id 
      },
      select: {
        historialDirecciones: true
      }
    });
    
    if (!usuario) {
      console.log(`Usuario con ID ${req.user.id} no encontrado`);
      return res.status(404).json({ message: "Usuario no encontrado" });
    }
    
    const direcciones = Array.isArray(usuario.historialDirecciones) ? usuario.historialDirecciones : [];
    console.log(`Se encontraron ${direcciones.length} direcciones para el usuario`);
    
    res.status(200).json(direcciones);
    */
  } catch (error) {
    console.error("Error al obtener direcciones:", error);
    res.status(500).json({
      message: "Error al obtener direcciones",
      error: error.toString()
    });
  }
};

exports.guardarDireccion = async (req, res) => {
  // Implementación similar a listarDirecciones con respuesta simple para depuración
  res.status(200).json({ 
    message: "Dirección guardada correctamente (depuración)",
    direcciones: []
  });
};