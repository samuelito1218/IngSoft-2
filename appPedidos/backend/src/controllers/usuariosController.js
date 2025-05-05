// appPedidos/backend/src/controllers/usuariosController.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// appPedidos/backend/src/controllers/usuariosController.js
exports.getUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const usuario = await prisma.usuarios.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nombreCompleto: true,
        email: true,
        telefono: true,
        cedula: true,
        direccion: true,
        rol: true,
        vehiculo: true,
        imageUrl: true,
        historialDirecciones: true,
        restaurantesIds: true
      }
    });
    
    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    // Si el usuario es Admin, obtener información de sus restaurantes
    let restaurantes = [];
    if (usuario.rol === 'Admin' && usuario.restaurantesIds && usuario.restaurantesIds.length > 0) {
      restaurantes = await prisma.restaurantes.findMany({
        where: {
          id: { in: usuario.restaurantesIds }
        }
      });
    }
    
    // Agregar la información de restaurantes a la respuesta
    const respuesta = {
      ...usuario,
      restaurantes: usuario.rol === 'Admin' ? restaurantes : undefined
    };
    
    res.status(200).json(respuesta);
  } catch (error) {
    console.error('Error al obtener perfil de usuario:', error);
    res.status(500).json({ message: 'Error al obtener perfil de usuario', error: error.message });
  }
};

exports.updateUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { nombreCompleto, telefono, direccion, comuna } = req.body;
    
    // Validar datos
    if (!nombreCompleto || !telefono || !direccion || !comuna) {
      return res.status(400).json({ message: 'Faltan campos requeridos' });
    }
    
    // Primero, buscar el usuario actual para obtener su cédula
    const usuarioActual = await prisma.usuarios.findUnique({
      where: { id: userId }
    });
    
    if (!usuarioActual) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    // Actualizar usuario incluyendo la cédula actual
    const usuarioActualizado = await prisma.usuarios.update({
      where: { id: userId },
      data: {
        nombreCompleto,
        telefono: parseInt(telefono),
        direccion,
        comuna: parseInt(comuna),
        cedula: usuarioActual.cedula // Incluir la cédula actual
      }
    });
    
    res.status(200).json({
      message: 'Perfil actualizado correctamente',
      usuario: {
        id: usuarioActualizado.id,
        nombreCompleto: usuarioActualizado.nombreCompleto,
        email: usuarioActualizado.email,
        telefono: usuarioActualizado.telefono,
        direccion: usuarioActualizado.direccion,
        cedula: usuarioActualizado.cedula,
        rol: usuarioActualizado.rol,
        vehiculo: usuarioActualizado.vehiculo,
        imageUrl: usuarioActualizado.imageUrl
      }
    });
  } catch (error) {
    console.error('Error al actualizar perfil de usuario:', error);
    res.status(500).json({ message: 'Error al actualizar perfil de usuario', error: error.message });
  }
};

exports.updateProfileImage = async (req, res) => {
  try {
    const userId = req.user.id;
    const { imageUrl } = req.body;
    
    if (!imageUrl) {
      return res.status(400).json({ message: 'La URL de la imagen es requerida' });
    }
    
    // Actualizar URL de imagen en la base de datos
    const usuarioActualizado = await prisma.usuarios.update({
      where: { id: userId },
      data: { imageUrl }
    });
    
    res.status(200).json({
      message: 'Imagen de perfil actualizada correctamente',
      imageUrl: usuarioActualizado.imageUrl
    });
  } catch (error) {
    console.error('Error al actualizar imagen de perfil:', error);
    res.status(500).json({ message: 'Error al actualizar imagen de perfil', error: error.message });
  }
};
// Método para obtener direcciones guardadas del usuario
exports.obtenerDirecciones = async (req, res) => {
  try {
    const usuario = await prisma.usuarios.findUnique({
      where: { id: req.user.id }
    });
    
    if (!usuario) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }
    
    res.status(200).json(usuario.historialDirecciones || []);
  } catch (error) {
    console.error("Error al obtener direcciones:", error);
    res.status(500).json({
      message: "Error al obtener direcciones",
      error: error.message
    });
  }
};

// Método para guardar una nueva dirección
exports.guardarDireccion = async (req, res) => {
  try {
    const { direccion } = req.body;
    
    if (!direccion || !direccion.barrio || !direccion.comuna || !direccion.direccionEspecifica) {
      return res.status(400).json({ message: "Datos de dirección incompletos" });
    }
    
    // Actualizar usuario
    const usuario = await prisma.usuarios.update({
      where: { id: req.user.id },
      data: {
        historialDirecciones: {
          push: direccion
        }
      }
    });
    
    res.status(200).json({ 
      message: "Dirección guardada correctamente",
      direcciones: usuario.historialDirecciones
    });
  } catch (error) {
    console.error("Error al guardar dirección:", error);
    res.status(500).json({
      message: "Error al guardar dirección",
      error: error.message
    });
  }
};