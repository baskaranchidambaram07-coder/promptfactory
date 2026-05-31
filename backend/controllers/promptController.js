const { Request, Prompt, Webhook } = require('../models');
const { processImage } = require('../services/aiService');
const { sendWebhook } = require('../services/webhookService');
const path = require('path');

const generate = async (req, res) => {
  try {
    const { prompt_text, prompt_id, webhook_url } = req.body;

    if (!req.file) return res.status(400).json({ error: 'Image is required' });

    // Resolve prompt text
    let finalPrompt = prompt_text;
    if (prompt_id && !prompt_text) {
      const prompt = await Prompt.findByPk(prompt_id);
      if (!prompt) return res.status(404).json({ error: 'Prompt not found' });
      finalPrompt = prompt.text;
    }
    if (!finalPrompt) return res.status(400).json({ error: 'Prompt text is required' });

    const imageUrl = `/uploads/${req.file.filename}`;

    // Create request record
    const request = await Request.create({
      user_id: req.user.id,
      image_url: imageUrl,
      prompt_text: finalPrompt,
      status: 'processing',
      webhook_url: webhook_url || null,
    });

    // Process with AI service
    const result = await processImage(imageUrl, finalPrompt);

    await request.update({
      output_url: result.output_url,
      ai_response: result.ai_response,
      status: 'completed',
    });

    // Trigger webhook if URL provided
    if (webhook_url) {
      const webhookPayload = {
        event: 'request.completed',
        request_id: request.id,
        output_url: result.output_url,
        ai_response: result.ai_response,
      };
      sendWebhook(webhook_url, webhookPayload).catch(console.error);
    }

    res.json({
      request_id: request.id,
      image_url: imageUrl,
      output_url: result.output_url,
      ai_response: result.ai_response,
      status: 'completed',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { generate };
