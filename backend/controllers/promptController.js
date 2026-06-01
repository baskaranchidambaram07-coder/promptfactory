const supabase = require('../supabase');
const { processImage } = require('../services/aiService');
const { sendWebhook } = require('../services/webhookService');

// GET /api/prompt/categories — top 5 categories by total usedcount
const getTopCategories = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('PromptCollection')
      .select('Categories, usedcount');
    if (error) throw error;

    const grouped = {};
    data.forEach((r) => {
      const cat = r.Categories || 'Other';
      grouped[cat] = (grouped[cat] || 0) + (r.usedcount || 0);
    });

    const top5 = Object.entries(grouped)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([category, total_used]) => ({ category, total_used }));

    res.json(top5);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/prompt — browse with optional category filter, ranked by usedcount
const getPrompts = async (req, res) => {
  try {
    const { category } = req.query;
    let query = supabase
      .from('PromptCollection')
      .select('*')
      .order('usedcount', { ascending: false });
    if (category) query = query.ilike('Categories', category);
    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/prompt/top?limit=20
const getTopPrompts = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const { data, error } = await supabase
      .from('PromptCollection')
      .select('*')
      .order('usedcount', { ascending: false })
      .limit(limit);
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/prompt/trending?limit=4
const getTrending = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 4;
    const { data, error } = await supabase
      .from('PromptCollection')
      .select('*')
      .order('usedcount', { ascending: false })
      .limit(limit);
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/prompt/by-category — one prompt per unique category
const getOnePerCategory = async (req, res) => {
  try {
    const { data: all, error } = await supabase
      .from('PromptCollection')
      .select('*')
      .order('usedcount', { ascending: false });
    if (error) throw error;

    // Pick one per unique category
    const seen = new Set();
    const result = all.filter((p) => {
      const cat = (p.Categories || '').toLowerCase();
      if (seen.has(cat)) return false;
      seen.add(cat);
      return true;
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/prompt/:id
const getPromptById = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('PromptCollection')
      .select('*')
      .eq('PromptId', req.params.id)
      .single();
    if (error || !data) return res.status(404).json({ error: 'Prompt not found' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/prompt/:id/click — increment usedcount
const recordClick = async (req, res) => {
  try {
    const { data: prompt } = await supabase
      .from('PromptCollection')
      .select('usedcount')
      .eq('PromptId', req.params.id)
      .single();
    if (!prompt) return res.status(404).json({ error: 'Prompt not found' });
    const { error } = await supabase
      .from('PromptCollection')
      .update({ usedcount: (prompt.usedcount || 0) + 1 })
      .eq('PromptId', req.params.id);
    if (error) throw error;
    res.json({ usedcount: (prompt.usedcount || 0) + 1 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/prompt/generate
const generate = async (req, res) => {
  try {
    const { prompt_text, prompt_id, webhook_url } = req.body;
    const userId = req.user.id;

    const { data: user } = await supabase.from('users').select('*').eq('id', userId).single();

    // Reset daily counter if new day
    const now = new Date();
    const resetAt = new Date(user.daily_reset_at);
    if (now.toDateString() !== resetAt.toDateString()) {
      await supabase.from('users').update({ daily_generations_used: 0, daily_reset_at: now.toISOString() }).eq('id', userId);
      user.daily_generations_used = 0;
    }

    const dailyLimit = user.is_premium ? Infinity : 3;
    if (user.daily_generations_used >= dailyLimit) {
      return res.status(429).json({ error: 'Daily generation limit reached. Upgrade to Premium.' });
    }

    if (!req.file) return res.status(400).json({ error: 'Image is required' });

    let finalPrompt = prompt_text;
    if (prompt_id && !prompt_text) {
      const { data: p } = await supabase
        .from('PromptCollection').select('promptdescription').eq('PromptId', prompt_id).single();
      if (!p) return res.status(404).json({ error: 'Prompt not found' });
      finalPrompt = p.promptdescription;
    }
    if (!finalPrompt) return res.status(400).json({ error: 'Prompt text is required' });

    const imageUrl = `/uploads/${req.file.filename}`;

    const { data: request } = await supabase.from('requests').insert({
      user_id: userId, image_url: imageUrl, prompt_text: finalPrompt,
      status: 'processing', webhook_url: webhook_url || null,
    }).select().single();

    const result = await processImage(imageUrl, finalPrompt, user.is_premium);

    await supabase.from('requests').update({
      output_url: result.output_url, ai_response: result.ai_response, status: 'completed',
    }).eq('id', request.id);

    await supabase.from('users').update({
      daily_generations_used: user.daily_generations_used + 1,
    }).eq('id', userId);

    if (webhook_url) {
      sendWebhook(webhook_url, { event: 'request.completed', request_id: request.id, output_url: result.output_url }).catch(console.error);
    }

    res.json({
      request_id: request.id, image_url: imageUrl,
      output_url: result.output_url, ai_response: result.ai_response,
      status: 'completed', daily_generations_used: user.daily_generations_used + 1,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getTopCategories, getPrompts, getTopPrompts, getTrending, getOnePerCategory, getPromptById, recordClick, generate };
