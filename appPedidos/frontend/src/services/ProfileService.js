// src/services/ProfileService.js
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase/config';
import api from './api';

class ProfileService {
  // Subir imagen de perfil
  async uploadProfileImage(userId, file) {
    try {
      if (!file || !userId) {
        throw new Error('Se requiere un archivo y un ID de usuario');
      }

      // Crear referencia en Firebase Storage
      const storageRef = ref(storage, `profile-images/${userId}/${Date.now()}_${file.name}`);
      
      // Subir imagen
      const snapshot = await uploadBytes(storageRef, file);
      
      // Obtener URL de descarga
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      // Actualizar perfil en el backend
      await api.put('/usuarios/perfil/imagen', {
        imageUrl: downloadURL
      });
      
      return downloadURL;
    } catch (error) {
      console.error('Error al subir imagen de perfil:', error);
      throw error;
    }
  }

  // Obtener perfil del usuario
  async getUserProfile() {
    try {
      const response = await api.get('/usuarios/perfil');
      return response.data;
    } catch (error) {
      console.error('Error al obtener perfil:', error);
      throw error;
    }
  }

  // Actualizar perfil del usuario
  async updateUserProfile(profileData) {
    try {
      const response = await api.put('/usuarios/perfil', profileData);
      return response.data;
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      throw error;
    }
  }
}

export default new ProfileService();