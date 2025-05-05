// src/services/ProfileService.js
import ApiService from './api';
import CloudinaryService from './CloudinaryService';

const ProfileService = {
  // Subir imagen de perfil usando Cloudinary
  async uploadProfileImage(userId, file) {
    try {
      if (!file) {
        throw new Error('Se requiere un archivo');
      }
      
      // Usar el servicio de Cloudinary para subir la imagen
      const imageUrl = await CloudinaryService.uploadProfileImage(file);
      
      return imageUrl;
    } catch (error) {
      console.error('Error al subir imagen de perfil:', error);
      throw error;
    }
  },

  // Obtener perfil del usuario
  async getUserProfile() {
    try {
      const response = await ApiService.usuarios.perfil();
      return response.data;
    } catch (error) {
      console.error('Error al obtener perfil:', error);
      throw error;
    }
  },

  // Actualizar perfil del usuario
  async updateUserProfile(profileData) {
    try {
      // Asegurarse de que todos los campos están presentes
      if (!profileData.nombreCompleto || !profileData.telefono || 
          !profileData.direccion || !profileData.comuna) {
        throw new Error('Todos los campos son requeridos');
      }
      
      // Convertir campos numéricos a números
      const dataToSend = {
        ...profileData,
        telefono: parseInt(profileData.telefono),
        comuna: parseInt(profileData.comuna)
      };
      
      const response = await ApiService.usuarios.actualizarPerfil(dataToSend);
      return response.data.usuario || response.data;
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      throw error;
    }
  }
};

export default ProfileService;