import ApiService from './api';
import CloudinaryService from './CloudinaryService';

const ProfileService = {
  // Subir imagen de perfil usando Cloudinary
  async uploadProfileImage(userId, file) {
    try {
      if (!file) {
        throw new Error('Se requiere un archivo');
      }
      
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

  async changePassword(newPassword) {
    try {
      if (!newPassword) {
        throw new Error('La nueva contraseña es requerida');
      }
      
      const response = await ApiService.usuarios.cambiarContrasena({ newPassword });
      
      return response.data;
    } catch (error) {
      console.error('Error al cambiar contraseña:', error);
      throw error;
    }
  },

  // Actualizar perfil del usuario
  async updateUserProfile(profileData) {
    try {
      if (!profileData.nombreCompleto || !profileData.telefono || 
          !profileData.direccion || !profileData.comuna) {
        throw new Error('Todos los campos son requeridos');
      }
      
      const dataToSend = {
        ...profileData,
        telefono: parseInt(profileData.telefono),
        comuna: parseInt(profileData.comuna)
      };
      
      const response = await ApiService.usuarios.actualizar(dataToSend);
      return response.data.usuario || response.data;
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      throw error;
    }
  },

  async eliminarCuenta(){
    try{
      const response = await ApiService.usuarios.eliminarCuenta();
      return response.data;
    } catch(error){
      console.error("Error al eliminar cuenta:", error);
      throw error;
    }
  }
};


export default ProfileService;