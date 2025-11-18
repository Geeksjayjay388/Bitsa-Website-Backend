const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadToCloudinary = async (file, folder = 'bitsa') => {
  try {
    console.log('Upload starting for:', file.name);
    
    const result = await cloudinary.uploader.upload(file.tempFilePath, {
      folder: folder,
      resource_type: 'auto'
    });
    
    console.log('Upload successful:', result.secure_url);
    
    return {
      url: result.secure_url,
      publicId: result.public_id
    };
  } catch (error) {
    console.error('Upload failed:', error.message);
    throw new Error(`Image upload failed: ${error.message}`);
  }
};

const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Delete failed:', error);
    throw new Error(`Image deletion failed: ${error.message}`);
  }
};

module.exports = { uploadToCloudinary, deleteFromCloudinary };