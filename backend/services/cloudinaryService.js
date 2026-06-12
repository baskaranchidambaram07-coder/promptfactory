const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name:  process.env.CLOUDINARY_CLOUD_NAME,
  api_key:     process.env.CLOUDINARY_API_KEY,
  api_secret:  process.env.CLOUDINARY_API_SECRET,
});

// Upload from a remote URL (OpenAI generated image URL)
const uploadFromUrl = async (imageUrl, folder = 'PromptFactory/PromptConverted/After') => {
  const result = await cloudinary.uploader.upload(imageUrl, {
    folder,
    resource_type: 'image',
  });
  return result.secure_url;
};

// Upload from base64
const uploadFromBase64 = async (base64Data, folder = 'PromptFactory/PromptConverted/After') => {
  const result = await cloudinary.uploader.upload(base64Data, {
    folder,
    resource_type: 'image',
  });
  return result.secure_url;
};

module.exports = { uploadFromUrl, uploadFromBase64 };
