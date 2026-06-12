const OpenAI = require('openai');
const supabase = require('../supabase');

// Fetch the active OpenAI key from llm_keys table, fallback to env
const getOpenAIKey = async () => {
  try {
    // Try both 'openai' and 'OpenAI' provider names
    const { data } = await supabase
      .from('llm_keys')
      .select('api_key')
      .ilike('provider', 'openai')
      .eq('is_active', true)
      .limit(1)
      .single();
    if (data?.api_key && !data.api_key.startsWith('••')) return data.api_key;
  } catch {}
  return process.env.OPENAI_API_KEY;
};

const listModels = async () => {
  const apiKey = await getOpenAIKey();
  const OpenAI = require('openai');
  const client = new OpenAI({ apiKey });
  const models = await client.models.list();
  return models.data.map(m => m.id).filter(id => id.includes('dall') || id.includes('image') || id.includes('gpt-image'));
};

const generateImage = async (promptText) => {
  const apiKey = await getOpenAIKey();
  console.log('[imageGen] key source:', apiKey ? `${apiKey.slice(0, 12)}...${apiKey.slice(-4)}` : 'NONE');
  if (!apiKey || apiKey === 'your_openai_api_key_here') {
    throw new Error('No active OpenAI API key found. Add one in Admin → LLM Keys.');
  }
  const client = new OpenAI({ apiKey });
  const response = await client.images.generate({
    model: 'gpt-image-1',
    prompt: promptText.slice(0, 4000),
    n: 1,
    size: '1024x1024',
  });
  // gpt-image-1 returns base64, convert to data URI for Cloudinary upload
  const b64 = response.data[0].b64_json;
  if (b64) return `data:image/png;base64,${b64}`;
  // fallback if URL is returned
  return response.data[0].url;
};

module.exports = { generateImage, listModels };
