// appPedidos/backend/src/controllers/usuariosController.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

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
        historialDirecciones: true
      }
    });
    
    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    res.status(200).json(usuario);
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
    
    // Actualizar usuario
    const usuarioActualizado = await prisma.usuarios.update({
      where: { id: userId },
      data: {
        nombreCompleto,
        telefono: parseInt(telefono),
        direccion,
        comuna: parseInt(comuna)
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