// src/services/CloudinaryService.js
import ApiService from './api';

const CLOUDINARY_UPLOAD_PRESET = 'perfil_usuarios'; // Crea este preset en Cloudinary
const CLOUDINARY_CLOUD_NAME = 'dwubcvtsh'; // De tu dashboard de Cloudinary

const CloudinaryService = {
  async uploadProfileImage(file) {
    try {
      if (!file) {
        throw new Error('Se requiere un archivo');
      }

      // Preparar formData para la subida
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

      // Subir a Cloudinary
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error('Error al subir imagen a Cloudinary');
      }

      const data = await response.json();
      
      // Actualizar perfil en tu backend con la nueva URL
      await ApiService.usuarios.actualizarImagen({
        imageUrl: data.secure_url
      });
      
      return data.secure_url;
    } catch (error) {
      console.error('Error al subir imagen de perfil:', error);
      throw error;
    }
  }
};

export default CloudinaryService;