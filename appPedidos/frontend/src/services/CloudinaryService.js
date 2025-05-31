import ApiService from './api';

const CLOUDINARY_UPLOAD_PRESET = 'perfil_usuarios';
const CLOUDINARY_CLOUD_NAME = 'dwubcvtsh';
const MAX_FILE_SIZE = 10 * 1024 * 1024; 

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
            let quality = 0.7; 
            
            if (file.size > MAX_FILE_SIZE) {
              const scale = Math.sqrt(MAX_FILE_SIZE / (file.size * 2)); 
              width *= scale;
              height *= scale;
            }
            
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            
            canvas.toBlob(
              (blob) => {
                if (blob) {
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

async uploadProfileImage(file) {
  try {
    if (!file) {
      throw new Error('Se requiere un archivo');
    }
    
    const secureUrl = await this.uploadImage(file, 'perfiles');

    const formDataToBackend = new FormData();
    formDataToBackend.append('imageUrl', secureUrl);
    
    try {
      await ApiService.usuarios.actualizarImagen({
        imageUrl: secureUrl});
    } catch (backendError) {
      console.warn('No se pudo actualizar la imagen en el backend, pero se subió correctamente a Cloudinary', backendError);
    }
    
    return secureUrl;
  } catch (error) {
    console.error('Error al subir imagen de perfil:', error);
    throw error;
  }
},

    async uploadImage(file, folder = '') {
      try {
        if (!file) {
          throw new Error('Se requiere un archivo');
        }
  
        let fileToUpload = file;
        if (file.size > MAX_FILE_SIZE) {
          console.log(`Comprimiendo imagen: tamaño original = ${(file.size / 1024 / 1024).toFixed(2)} MB`);
          fileToUpload = await this.compressImage(file);
          console.log(`Imagen comprimida: ${(fileToUpload.size / 1024 / 1024).toFixed(2)} MB`);
        }
        
        const formData = new FormData();
        formData.append('file', fileToUpload);
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
        
        if (folder) {
          formData.append('folder', folder);
        }
  
        console.log('Enviando solicitud a Cloudinary:', {
          cloudName: CLOUDINARY_CLOUD_NAME,
          preset: CLOUDINARY_UPLOAD_PRESET,
          fileType: fileToUpload.type,
          fileSize: (fileToUpload.size / 1024 / 1024).toFixed(2) + ' MB'
        });
  
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
        console.log('Imagen subida con éxito:', data.secure_url);
        return data.secure_url;
      } catch (error) {
        console.error('Error al subir imagen:', error);
        throw error;
      }
    },
    
    async uploadRestaurantImage(file, restaurantId) {
      try {
        if (!file) {
          throw new Error('Se requiere un archivo');
        }
        
        const secureUrl = await this.uploadImage(
          file, 
          restaurantId ? `restaurantes/${restaurantId}` : 'restaurantes'
        );
        
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
    
    async uploadProductImage(file, productId, restaurantId) {
      try {
        if (!file) {
          throw new Error('Se requiere un archivo');
        }
        
        const folder = restaurantId ? `productos/${restaurantId}` : 'productos';
        const secureUrl = await this.uploadImage(file, folder);
        
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