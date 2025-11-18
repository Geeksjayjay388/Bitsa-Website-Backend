const cloudinary = require('cloudinary').v2;

// DEBUG: Log what we're actually getting
console.log('═══════════════════════════════════════════');
console.log('🔍 CLOUDINARY CONFIGURATION DEBUG');
console.log('═══════════════════════════════════════════');
console.log('Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME);
console.log('API Key:', process.env.CLOUDINARY_API_KEY);
console.log('API Secret:', process.env.CLOUDINARY_API_SECRET);
console.log('API Secret Length:', process.env.CLOUDINARY_API_SECRET?.length);
console.log('═══════════════════════════════════════════');

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