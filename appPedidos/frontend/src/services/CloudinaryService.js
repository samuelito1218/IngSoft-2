// src/services/CloudinaryService.js - Con compresión de imágenes
import ApiService from './api';

const CLOUDINARY_UPLOAD_PRESET = 'perfil_usuarios';
const CLOUDINARY_CLOUD_NAME = 'dwubcvtsh';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB en bytes

const CloudinaryService = {
    // Método para comprimir imagen
    async compressImage(file, maxSizeMB = 1) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = function(event) {
          const img = new Image();
          img.src = event.target.result;
          
          img.onload = function() {
            let width = img.width;
            let height = img.height;
            let quality = 0.7; // Calidad inicial: 70%
            
            // Factor de escala para redimensionar si la imagen es muy grande
            if (file.size > MAX_FILE_SIZE) {
              const scale = Math.sqrt(MAX_FILE_SIZE / (file.size * 2)); // Redimensionar con margen
              width *= scale;
              height *= scale;
            }
            
            // Crear canvas para comprimir
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            
            // Dibujar imagen en el canvas
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            
            // Convertir a Blob
            canvas.toBlob(
              (blob) => {
                if (blob) {
                  // Crear nuevo archivo
                  const compressedFile = new File([blob], file.name, {
                    type: file.type,
                    lastModified: Date.now()
                  });
                  resolve(compressedFile);
                } else {
                  reject(new Error('Error al comprimir la imagen'));
                }
              },
              file.type,
              quality
            );
          };
          
          img.onerror = function() {
            reject(new Error('Error al cargar la imagen'));
          };
        };
        
        reader.onerror = function() {
          reject(new Error('Error al leer el archivo'));
        };
      });
    },

    // Método original para imágenes de perfil
    async uploadProfileImage(file) {
      try {
        if (!file) {
          throw new Error('Se requiere un archivo');
        }
  
        // Comprimir imagen si es demasiado grande
        let fileToUpload = file;
        if (file.size > MAX_FILE_SIZE) {
          fileToUpload = await this.compressImage(file);
          console.log(`Imagen comprimida: ${file.size} → ${fileToUpload.size} bytes`);
        }
        
        // Preparar formData para la subida
        const formData = new FormData();
        formData.append('file', fileToUpload);
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
          const errorData = await response.json().catch(() => ({}));
          console.error('Error detallado de Cloudinary:', errorData);
          throw new Error(`Error al subir imagen a Cloudinary: ${errorData.error?.message || response.statusText}`);
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
    },

    // Método general para subir cualquier imagen a Cloudinary - CORREGIDO con compresión
    async uploadImage(file, folder = '') {
      try {
        if (!file) {
          throw new Error('Se requiere un archivo');
        }
  
        // Comprimir imagen si es demasiado grande
        let fileToUpload = file;
        if (file.size > MAX_FILE_SIZE) {
          console.log(`Comprimiendo imagen: tamaño original = ${(file.size / 1024 / 1024).toFixed(2)} MB`);
          fileToUpload = await this.compressImage(file);
          console.log(`Imagen comprimida: ${(fileToUpload.size / 1024 / 1024).toFixed(2)} MB`);
        }
        
        // IMPORTANTE: Usar el mismo preset que funciona para uploadProfileImage
        const formData = new FormData();
        formData.append('file', fileToUpload);
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
        
        // Añadir folder solo si se proporciona
        if (folder) {
          formData.append('folder', folder);
        }
  
        console.log('Enviando solicitud a Cloudinary:', {
          cloudName: CLOUDINARY_CLOUD_NAME,
          preset: CLOUDINARY_UPLOAD_PRESET,
          fileType: fileToUpload.type,
          fileSize: (fileToUpload.size / 1024 / 1024).toFixed(2) + ' MB'
        });
  
        // Subir a Cloudinary
        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
          {
            method: 'POST',
            body: formData,
          }
        );
  
        // Manejar errores con más detalle
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('Error detallado de Cloudinary:', errorData);
          throw new Error(`Error al subir imagen a Cloudinary: ${errorData.error?.message || response.statusText}`);
        }
  
        const data = await response.json();
        console.log('Imagen subida con éxito:', data.secure_url);
        return data.secure_url;
      } catch (error) {
        console.error('Error al subir imagen:', error);
        throw error;
      }
    },
    
    // Método para subir imagen de restaurante - usa uploadImage para reutilizar código
    async uploadRestaurantImage(file, restaurantId) {
      try {
        if (!file) {
          throw new Error('Se requiere un archivo');
        }
        
        // Usar el método general uploadImage para evitar duplicar código
        const secureUrl = await this.uploadImage(
          file, 
          restaurantId ? `restaurantes/${restaurantId}` : 'restaurantes'
        );
        
        // Si se proporcionó un ID de restaurante y tenemos un endpoint, actualizar en el backend
        if (restaurantId && ApiService.restaurantes && ApiService.restaurantes.actualizarImagen) {
          try {
            await ApiService.restaurantes.actualizarImagen(restaurantId, {
              imageUrl: secureUrl
            });
          } catch (err) {
            console.warn('No se pudo actualizar la imagen en el backend, pero se subió correctamente', err);
          }
        }
        
        return secureUrl;
      } catch (error) {
        console.error('Error al subir imagen de restaurante:', error);
        throw error;
      }
    },
    
    // Método para subir imagen de producto - usa uploadImage para reutilizar código
    async uploadProductImage(file, productId, restaurantId) {
      try {
        if (!file) {
          throw new Error('Se requiere un archivo');
        }
        
        // Usar el método general uploadImage
        const folder = restaurantId ? `productos/${restaurantId}` : 'productos';
        const secureUrl = await this.uploadImage(file, folder);
        
        // Si se proporcionó un ID de producto y tenemos un endpoint, actualizar en el backend
        if (productId && ApiService.productos && ApiService.productos.actualizarImagen) {
          try {
            await ApiService.productos.actualizarImagen(productId, {
              imageUrl: secureUrl
            });
          } catch (err) {
            console.warn('No se pudo actualizar la imagen en el backend, pero se subió correctamente', err);
          }
        }
        
        return secureUrl;
      } catch (error) {
        console.error('Error al subir imagen de producto:', error);
        throw error;
      }
    }
};

export default CloudinaryService;