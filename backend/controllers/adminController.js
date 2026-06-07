const supabase = require('../supabase');

// Helper: safely extract count from a Supabase count query result (returns 0 on error)
const safeCount = (result) => (result?.status === 'fulfilled' && !result.value?.error ? (result.value?.count ?? 0) : 0);

/* ═══════════════════════════════════════════════
   DASHBOARD / STATS
═══════════════════════════════════════════════ */
const getStats = async (req, res) => {
  try {
    // Use allSettled so a missing table doesn't crash the whole dashboard
    const [users, premium, requests, completed, failed, prompts] = await Promise.allSettled([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('is_premium', true),
      supabase.from('requests').select('*', { count: 'exact', head: true }),
      supabase.from('requests').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
      supabase.from('requests').select('*', { count: 'exact', head: true }).eq('status', 'failed'),
      supabase.from('PromptCollection').select('*', { count: 'exact', head: true }),
    ]);

    const totalUsers    = safeCount(users);
    const premiumUsers  = safeCount(premium);
    const totalRequests = safeCount(requests);

    // new users in last 7 days — graceful fallback
    let newUsers7d = 0;
    try {
      const since7d = new Date(Date.now() - 7 * 86400000).toISOString();
      const { count } = await supabase.from('users').select('*', { count: 'exact', head: true }).gte('created_at', since7d);
      newUsers7d = count ?? 0;
    } catch {}

    // sum daily_generations_used — graceful fallback
    let totalGenerationsToday = 0;
    try {
      const { data: usageData } = await supabase.from('users').select('daily_generations_used');
      totalGenerationsToday = (usageData || []).reduce((s, u) => s + (u.daily_generations_used || 0), 0);
    } catch {}

    res.json({
      totalUsers,
      premiumUsers,
      freeUsers:           totalUsers - premiumUsers,
      totalRequests,
      completedRequests:   safeCount(completed),
      failedRequests:      safeCount(failed),
      totalPrompts:        safeCount(prompts),
      newUsers7d,
      totalGenerationsToday,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ═══════════════════════════════════════════════
   USER MANAGEMENT
═══════════════════════════════════════════════ */
const getAllUsers = async (req, res) => {
  try {
    const { search, role, premium } = req.query;
    let query = supabase
      .from('users')
      .select('id,name,email,role,avatar,is_premium,daily_generations_used,daily_reset_at,created_at')
      .order('created_at', { ascending: false });

    if (role) query = query.eq('role', role);
    if (premium === 'true') query = query.eq('is_premium', true);
    if (premium === 'false') query = query.eq('is_premium', false);
    if (search) query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);

    const { data, error } = await query;
    if (error) return res.json([]);   // table doesn't exist yet → return empty
    res.json(data || []);
  } catch (err) {
    res.json([]);
  }
};

const getUserById = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id,name,email,role,avatar,is_premium,daily_generations_used,daily_reset_at,created_at')
      .eq('id', req.params.id)
      .single();
    if (error || !data) return res.status(404).json({ error: 'User not found' });
    // Attach request history — ignore errors if requests table doesn't exist
    let reqs = [];
    try {
      const { data: r } = await supabase
        .from('requests').select('id,status,created_at,prompt_text').eq('user_id', req.params.id)
        .order('created_at', { ascending: false }).limit(20);
      reqs = r || [];
    } catch {}
    res.json({ ...data, requests: reqs });
  } catch (err) {
    res.status(404).json({ error: 'User not found' });
  }
};

const updateUser = async (req, res) => {
  try {
    const { name, email, role, is_premium } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (email !== undefined) updates.email = email;
    if (role !== undefined) updates.role = role;
    if (is_premium !== undefined) updates.is_premium = is_premium;
    const { data, error } = await supabase
      .from('users').update(updates).eq('id', req.params.id).select().single();
    if (error || !data) return res.status(404).json({ error: 'User not found' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    if (req.params.id === req.user.id) return res.status(400).json({ error: 'Cannot delete yourself' });
    const { error } = await supabase.from('users').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const togglePremium = async (req, res) => {
  try {
    const { data: user } = await supabase.from('users').select('is_premium').eq('id', req.params.id).single();
    if (!user) return res.status(404).json({ error: 'User not found' });
    const { data, error } = await supabase
      .from('users').update({ is_premium: !user.is_premium }).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json({ id: data.id, is_premium: data.is_premium });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const resetUserUsage = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .update({ daily_generations_used: 0, daily_reset_at: new Date().toISOString() })
      .eq('id', req.params.id).select().single();
    if (error || !data) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'Usage reset', daily_generations_used: 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ═══════════════════════════════════════════════
   PROMPT COLLECTION MANAGEMENT
   (drives the customer-facing home page)
═══════════════════════════════════════════════ */
const getCollection = async (req, res) => {
  try {
    const { search, category, page = 1, limit = 50 } = req.query;
    const from = (parseInt(page) - 1) * parseInt(limit);
    const to = from + parseInt(limit) - 1;

    let query = supabase
      .from('PromptCollection')
      .select('*', { count: 'exact' })
      .order('usedcount', { ascending: false })
      .range(from, to);

    if (category) query = query.ilike('Categories', category);
    if (search) query = query.or(`promptdescription.ilike.%${search}%,Categories.ilike.%${search}%,tags.ilike.%${search}%`);

    const { data, error, count } = await query;
    if (error) throw error;
    res.json({ data, total: count, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createCollectionItem = async (req, res) => {
  try {
    const { promptdescription, FromURL, ToURL, Categories, tags, usedcount } = req.body;
    const payload = {
      promptdescription: promptdescription || null,
      FromURL: FromURL || null,
      ToURL: ToURL || null,
      Categories: Categories || null,
      tags: tags || null,
      usedcount: usedcount || 0,
    };
    const { data, error } = await supabase.from('PromptCollection').insert(payload).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateCollectionItem = async (req, res) => {
  try {
    const { promptdescription, FromURL, ToURL, Categories, tags, usedcount } = req.body;
    const updates = {};
    if (promptdescription !== undefined) updates.promptdescription = promptdescription;
    if (FromURL !== undefined) updates.FromURL = FromURL;
    if (ToURL !== undefined) updates.ToURL = ToURL;
    if (Categories !== undefined) updates.Categories = Categories;
    if (tags !== undefined) updates.tags = tags;
    if (usedcount !== undefined) updates.usedcount = usedcount;

    const { data, error } = await supabase
      .from('PromptCollection').update(updates).eq('PromptId', req.params.id).select().single();
    if (error || !data) return res.status(404).json({ error: 'Prompt not found' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteCollectionItem = async (req, res) => {
  try {
    const { error } = await supabase.from('PromptCollection').delete().eq('PromptId', req.params.id);
    if (error) throw error;
    res.json({ message: 'Prompt deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const bulkUpdateUsedCount = async (req, res) => {
  try {
    const { id, usedcount } = req.body;
    const { data, error } = await supabase
      .from('PromptCollection').update({ usedcount }).eq('PromptId', id).select().single();
    if (error || !data) return res.status(404).json({ error: 'Prompt not found' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ═══════════════════════════════════════════════
   IMAGE MANAGEMENT (FromURL / ToURL per prompt)
═══════════════════════════════════════════════ */
const updatePromptImages = async (req, res) => {
  try {
    const { FromURL, ToURL } = req.body;
    const updates = {};
    if (FromURL !== undefined) updates.FromURL = FromURL;
    if (ToURL !== undefined) updates.ToURL = ToURL;
    const { data, error } = await supabase
      .from('PromptCollection').update(updates).eq('PromptId', req.params.id).select().single();
    if (error || !data) return res.status(404).json({ error: 'Prompt not found' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ═══════════════════════════════════════════════
   SUBSCRIPTION MANAGEMENT
═══════════════════════════════════════════════ */
const getSubscriptions = async (req, res) => {
  try {
    const { status } = req.query;
    let query = supabase
      .from('users')
      .select('id,name,email,is_premium,daily_generations_used,created_at,role')
      .order('created_at', { ascending: false });
    if (status === 'premium') query = query.eq('is_premium', true);
    if (status === 'free') query = query.eq('is_premium', false);
    const { data, error } = await query;
    if (error) return res.json([]);   // users table not yet created
    res.json(data || []);
  } catch (err) {
    res.json([]);
  }
};

const updateSubscription = async (req, res) => {
  try {
    const { is_premium } = req.body;
    const { data, error } = await supabase
      .from('users').update({ is_premium }).eq('id', req.params.id).select().single();
    if (error || !data) return res.status(404).json({ error: 'User not found' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ═══════════════════════════════════════════════
   USAGE MANAGEMENT
═══════════════════════════════════════════════ */
const getAllRequests = async (req, res) => {
  try {
    const { status, user_id, page = 1, limit = 50 } = req.query;
    const from = (parseInt(page) - 1) * parseInt(limit);
    const to = from + parseInt(limit) - 1;

    let query = supabase
      .from('requests')
      .select('id,user_id,status,prompt_text,output_url,created_at,ai_response', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (status) query = query.eq('status', status);
    if (user_id) query = query.eq('user_id', user_id);

    const { data, error, count } = await query;
    if (error) return res.json({ data: [], total: 0, page: parseInt(page), limit: parseInt(limit) });

    // Attach user emails
    const userIds = [...new Set((data || []).map((r) => r.user_id))];
    let usersMap = {};
    if (userIds.length) {
      try {
        const { data: usersData } = await supabase.from('users').select('id,name,email').in('id', userIds);
        (usersData || []).forEach((u) => { usersMap[u.id] = u; });
      } catch {}
    }
    const enriched = (data || []).map((r) => ({ ...r, user: usersMap[r.user_id] || null }));

    res.json({ data: enriched, total: count ?? 0, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    res.json({ data: [], total: 0, page: 1, limit: 50 });
  }
};

const getUsageSummary = async (req, res) => {
  try {
    // Each query is independent — ignore errors for missing tables
    const [usersRes, totalRes, completedRes, failedRes, pendingRes] = await Promise.allSettled([
      supabase.from('users').select('id,name,email,is_premium,daily_generations_used,daily_reset_at').order('daily_generations_used', { ascending: false }),
      supabase.from('requests').select('*', { count: 'exact', head: true }),
      supabase.from('requests').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
      supabase.from('requests').select('*', { count: 'exact', head: true }).eq('status', 'failed'),
      supabase.from('requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    ]);

    const users = (usersRes.status === 'fulfilled' && !usersRes.value?.error) ? (usersRes.value?.data || []) : [];

    res.json({
      totalRequests:     safeCount(totalRes),
      completedRequests: safeCount(completedRes),
      failedRequests:    safeCount(failedRes),
      pendingRequests:   safeCount(pendingRes),
      topUsers:          users.slice(0, 20),
    });
  } catch (err) {
    res.json({ totalRequests: 0, completedRequests: 0, failedRequests: 0, pendingRequests: 0, topUsers: [] });
  }
};

/* ═══════════════════════════════════════════════
   LLM KEY MANAGEMENT
═══════════════════════════════════════════════ */
const getLLMKeys = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('llm_keys')
      .select('id,provider,is_active,notes,created_at,updated_at')
      .order('provider');
    if (error) return res.json([]);   // llm_keys table not yet created
    const masked = (data || []).map((k) => ({ ...k, api_key: '••••••••••••••••' }));
    res.json(masked);
  } catch (err) {
    res.json([]);
  }
};

const upsertLLMKey = async (req, res) => {
  try {
    const { provider, api_key, is_active, notes } = req.body;
    if (!provider || !api_key) return res.status(400).json({ error: 'provider and api_key required' });
    // Quick check: does the table exist?
    const { error: chk } = await supabase.from('llm_keys').select('id').limit(1);
    if (chk) return res.status(503).json({ error: 'llm_keys table not found. Run the schema migration in Supabase SQL Editor first.' });

    // Check existing
    const { data: existing } = await supabase
      .from('llm_keys').select('id').eq('provider', provider).single();

    let result;
    if (existing) {
      const updates = { is_active: is_active !== undefined ? is_active : true, updated_at: new Date().toISOString() };
      if (api_key && !api_key.startsWith('••')) updates.api_key = api_key;
      if (notes !== undefined) updates.notes = notes;
      const { data, error } = await supabase
        .from('llm_keys').update(updates).eq('id', existing.id).select('id,provider,is_active,notes,created_at,updated_at').single();
      if (error) throw error;
      result = data;
    } else {
      const { data, error } = await supabase
        .from('llm_keys').insert({ provider, api_key, is_active: true, notes: notes || null })
        .select('id,provider,is_active,notes,created_at,updated_at').single();
      if (error) throw error;
      result = data;
    }
    res.json({ ...result, api_key: '••••••••••••••••' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteLLMKey = async (req, res) => {
  try {
    const { error } = await supabase.from('llm_keys').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'Key deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const toggleLLMKey = async (req, res) => {
  try {
    const { data: key } = await supabase.from('llm_keys').select('is_active').eq('id', req.params.id).single();
    if (!key) return res.status(404).json({ error: 'Key not found' });
    const { data, error } = await supabase
      .from('llm_keys').update({ is_active: !key.is_active, updated_at: new Date().toISOString() })
      .eq('id', req.params.id).select('id,provider,is_active,notes').single();
    if (error) throw error;
    res.json({ ...data, api_key: '••••••••••••••••' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ═══════════════════════════════════════════════
   LEGACY — kept for backward compatibility
═══════════════════════════════════════════════ */
const getPrompts = async (req, res) => {
  try {
    const { data, error } = await supabase.from('prompts').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
const createPrompt = async (req, res) => {
  try {
    const { title, text, negative_prompt, category, tags, thumbnail_url, images } = req.body;
    const { data, error } = await supabase.from('prompts').insert({
      title, text, negative_prompt, category,
      tags: tags || [], thumbnail_url: thumbnail_url || null,
      images: images || [], created_by: req.user.id,
    }).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
const updatePrompt = async (req, res) => {
  try {
    const { data, error } = await supabase.from('prompts').update(req.body).eq('id', req.params.id).select().single();
    if (error || !data) return res.status(404).json({ error: 'Prompt not found' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
const deletePrompt = async (req, res) => {
  try {
    const { error } = await supabase.from('prompts').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'Prompt deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getStats,
  getAllUsers, getUserById, updateUser, deleteUser, togglePremium, resetUserUsage,
  getCollection, createCollectionItem, updateCollectionItem, deleteCollectionItem, bulkUpdateUsedCount,
  updatePromptImages,
  getSubscriptions, updateSubscription,
  getAllRequests, getUsageSummary,
  getLLMKeys, upsertLLMKey, deleteLLMKey, toggleLLMKey,
  // legacy
  getPrompts, createPrompt, updatePrompt, deletePrompt,
};
