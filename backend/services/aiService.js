/**
 * AI Service — simulates image generation pipeline.
 * Premium: 3 stages (Generate → Evaluate → Final Check)
 * Free: single stage (Generate only)
 * Replace simulate* functions with real API calls in production.
 */

const simulateGenerate = async (imageUrl, promptText) => {
  await new Promise((r) => setTimeout(r, 800));
  const filename = imageUrl.split('/').pop();
  return {
    output_url: imageUrl.replace(filename, `gen-${filename}`),
    model: 'dall-e-3',
    prompt_adherence: Math.floor(Math.random() * 10 + 88),
  };
};

const simulateEvaluate = async (outputUrl) => {
  await new Promise((r) => setTimeout(r, 600));
  return {
    visual_quality: Math.floor(Math.random() * 10 + 82),
    brand_safety: 100,
    passed: true,
  };
};

const simulateFinalCheck = async (outputUrl) => {
  await new Promise((r) => setTimeout(r, 400));
  return {
    final_output_url: outputUrl.replace('gen-', 'final-'),
    model: 'claude-3-5',
    passed: true,
  };
};

const processImage = async (imageUrl, promptText, isPremium = false) => {
  const stage1 = await simulateGenerate(imageUrl, promptText);

  if (!isPremium) {
    return {
      output_url: stage1.output_url,
      ai_response: {
        pipeline: 'single-stage',
        stage_generate: stage1,
        processed_at: new Date().toISOString(),
      },
    };
  }

  const stage2 = await simulateEvaluate(stage1.output_url);
  const stage3 = await simulateFinalCheck(stage1.output_url);

  return {
    output_url: stage3.final_output_url,
    ai_response: {
      pipeline: 'three-stage',
      stage_generate: stage1,
      stage_evaluate: stage2,
      stage_final_check: stage3,
      processed_at: new Date().toISOString(),
    },
  };
};

module.exports = { processImage };
