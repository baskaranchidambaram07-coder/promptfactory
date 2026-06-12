const { generateImage, listModels } = require('../services/imageGenService');
const { uploadFromUrl, uploadFromBase64 } = require('../services/cloudinaryService');

// POST /api/admin/generate-image
// Body: { prompt }
// Returns: { imageUrl } — temporary OpenAI URL
const generateImageForPrompt = async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ error: 'Prompt text is required' });
    }
    const imageUrl = await generateImage(prompt.trim());
    res.json({ imageUrl });
  } catch (err) {
    console.error('Image generation error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

// POST /api/admin/upload-to-cloudinary
// Body: { imageUrl } — accepts Cloudinary URL or base64 data URI
const uploadToCloudinary = async (req, res) => {
  try {
    const { imageUrl } = req.body;
    if (!imageUrl) return res.status(400).json({ error: 'imageUrl is required' });
    // base64 data URI from gpt-image-1
    const cloudinaryUrl = imageUrl.startsWith('data:')
      ? await uploadFromBase64(imageUrl)
      : await uploadFromUrl(imageUrl);
    res.json({ cloudinaryUrl });
  } catch (err) {
    console.error('Cloudinary upload error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

module.exports = { generateImageForPrompt, uploadToCloudinary, listAvailableModels: async (req, res) => {
  try {
    const models = await listModels();
    res.json({ models });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}};
