const { Op } = require('sequelize');
const { Request, Prompt, User } = require('../models');
const { processImage } = require('../services/aiService');
const { sendWebhook } = require('../services/webhookService');

// GET /api/prompt — browse with optional category filter, ranked by click_count
const getPrompts = async (req, res) => {
  try {
    const { category } = req.query;
    const where = { is_active: true };
    if (category) where.category = category;

    const prompts = await Prompt.findAll({
      where,
      order: [['click_count', 'DESC']],
    });
    res.json(prompts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/prompt/top?limit=20 — top N across all categories
const getTopPrompts = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const prompts = await Prompt.findAll({
      where: { is_active: true },
      order: [['click_count', 'DESC']],
      limit,
    });
    res.json(prompts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/prompt/trending?limit=4 — top N by click_count
const getTrending = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 4;
    const prompts = await Prompt.findAll({
      where: { is_active: true },
      order: [['click_count', 'DESC']],
      limit,
    });
    res.json(prompts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/prompt/by-category — one prompt per category, ascending order
const getOnePerCategory = async (req, res) => {
  try {
    const categories = ['travel', 'music', 'invite', 'love'];
    const results = await Promise.all(
      categories.map((cat) =>
        Prompt.findOne({
          where: { is_active: true, category: cat },
          order: [['click_count', 'DESC']],
        })
      )
    );
    res.json(results.filter(Boolean));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/prompt/:id — single prompt detail
const getPromptById = async (req, res) => {
  try {
    const prompt = await Prompt.findOne({ where: { id: req.params.id, is_active: true } });
    if (!prompt) return res.status(404).json({ error: 'Prompt not found' });
    res.json(prompt);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/prompt/:id/click — increment click count (public)
const recordClick = async (req, res) => {
  try {
    const prompt = await Prompt.findByPk(req.params.id);
    if (!prompt) return res.status(404).json({ error: 'Prompt not found' });
    await prompt.increment('click_count');
    res.json({ click_count: prompt.click_count + 1 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/prompt/generate — generate image, enforce daily limit
const generate = async (req, res) => {
  try {
    const { prompt_text, prompt_id, webhook_url } = req.body;
    const user = req.user;

    // Reset daily counter if it's a new day
    const now = new Date();
    const resetAt = new Date(user.daily_reset_at);
    if (now.toDateString() !== resetAt.toDateString()) {
      await User.update(
        { daily_generations_used: 0, daily_reset_at: now },
        { where: { id: user.id } }
      );
      user.daily_generations_used = 0;
    }

    const dailyLimit = user.is_premium ? Infinity : 3;
    if (user.daily_generations_used >= dailyLimit) {
      return res.status(429).json({ error: 'Daily generation limit reached. Upgrade to Premium for unlimited generations.' });
    }

    if (!req.file) return res.status(400).json({ error: 'Image is required' });

    let finalPrompt = prompt_text;
    if (prompt_id && !prompt_text) {
      const prompt = await Prompt.findByPk(prompt_id);
      if (!prompt) return res.status(404).json({ error: 'Prompt not found' });
      finalPrompt = prompt.text;
    }
    if (!finalPrompt) return res.status(400).json({ error: 'Prompt text is required' });

    const imageUrl = `/uploads/${req.file.filename}`;

    const request = await Request.create({
      user_id: user.id,
      image_url: imageUrl,
      prompt_text: finalPrompt,
      status: 'processing',
      webhook_url: webhook_url || null,
    });

    // Premium: 3-stage pipeline; Free: single stage
    const result = await processImage(imageUrl, finalPrompt, user.is_premium);

    await request.update({
      output_url: result.output_url,
      ai_response: result.ai_response,
      status: 'completed',
    });

    await User.increment('daily_generations_used', { where: { id: user.id } });

    if (webhook_url) {
      sendWebhook(webhook_url, {
        event: 'request.completed',
        request_id: request.id,
        output_url: result.output_url,
        ai_response: result.ai_response,
      }).catch(console.error);
    }

    res.json({
      request_id: request.id,
      image_url: imageUrl,
      output_url: result.output_url,
      ai_response: result.ai_response,
      status: 'completed',
      daily_generations_used: user.daily_generations_used + 1,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getPrompts, getTopPrompts, getTrending, getOnePerCategory, getPromptById, recordClick, generate };
