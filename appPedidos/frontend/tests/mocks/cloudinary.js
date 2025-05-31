export const mockCloudinaryService = {
  uploadImage: jest.fn().mockResolvedValue('https://cloudinary.com/uploaded-image.jpg'),
  uploadProfileImage: jest.fn().mockResolvedValue('https://cloudinary.com/profile-image.jpg')
};