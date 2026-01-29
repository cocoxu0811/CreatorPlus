import { GoogleGenAI } from '@google/genai';

const getAi = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const err = new Error('Missing GEMINI_API_KEY on server.');
    err.statusCode = 500;
    throw err;
  }
  return new GoogleGenAI({ apiKey });
};

const toInlineData = (input) => {
  if (!input) return null;
  if (input.startsWith('data:')) {
    const [meta, data] = input.split(',');
    const mimeType = meta?.slice(5).split(';')[0] || 'image/png';
    return { inlineData: { data: data || '', mimeType } };
  }
  return { inlineData: { data: input, mimeType: 'image/png' } };
};

const extractBase64Image = (response) => {
  const parts = response?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return null;
  for (const part of parts) {
    if (part.inlineData?.data) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  return null;
};

export const vision = async ({ images = [], lang = 'zh' }) => {
  if (!Array.isArray(images) || images.length === 0) {
    const err = new Error('images required');
    err.statusCode = 400;
    throw err;
  }
  const ai = getAi();
  const visionPrompt = lang === 'zh'
    ? '识别图中展示的一组产品。请基于这些图片，用简短的关键词组合作为描述。不要写长句，只返回2-4个核心词。'
    : 'Identify the product in these images. Provide a brief combination of keywords. Return ONLY 2-4 keywords.';
  const parts = images.map(toInlineData).filter(Boolean);
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: { parts: [...parts, { text: visionPrompt }] },
  });
  return { text: response.text?.trim() || '' };
};

export const hashtags = async ({ productDesc, lang = 'zh' }) => {
  if (!productDesc) {
    const err = new Error('productDesc required');
    err.statusCode = 400;
    throw err;
  }
  const ai = getAi();
  const prompt = `Based on: "${productDesc}", extract 3-5 highly relevant hashtags in ${lang === 'zh' ? 'Chinese' : 'English'}. Return ONLY a JSON array of strings.`;
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: { responseMimeType: 'application/json' },
  });
  let tags = [];
  try {
    tags = JSON.parse(response.text || '[]');
  } catch {
    tags = [];
  }
  return { tags: Array.isArray(tags) ? tags : [] };
};

export const generate = async (payload) => {
  const {
    images = [],
    modelImage = null,
    platform,
    stylePreference = '',
    potentialHashtags = [],
    isCustomizable = false,
    lang = 'zh',
    voiceStyle = '',
    feedbackText = '',
    platformName = 'Instagram',
    productDesc = '',
  } = payload || {};

  if (!Array.isArray(images) || images.length === 0) {
    const err = new Error('images required');
    err.statusCode = 400;
    throw err;
  }

  const ai = getAi();
  const styleContext = stylePreference ? `Style: ${stylePreference}.` : 'High-end social media visuals.';
  const keywordContext = potentialHashtags.length > 0 ? `Tags: ${potentialHashtags.join(', ')}.` : '';
  const customContext = isCustomizable ? 'STRESS that the product is CUSTOMIZABLE and bespoke.' : '';
  const feedbackContext = feedbackText ? `User requested changes: "${feedbackText}".` : '';
  const noTextInstruction = 'IMPORTANT: THE GENERATED IMAGE MUST NOT CONTAIN ANY TEXT, LOGOS, OR WATERMARKS. JUST A CLEAN PHOTO.';

  const primaryProduct = toInlineData(images[0]);
  const modelImageData = modelImage ? toInlineData(modelImage) : null;
  const baseImagePrompt = `Clean professional lifestyle photo for ${platformName}. ${styleContext} ${keywordContext} ${customContext} ${feedbackContext} ${noTextInstruction}`;

  let contentsForImageGen = [];
  if (modelImageData) {
    contentsForImageGen = [
      { parts: [modelImageData, primaryProduct, { text: `VIRTUAL TRY-ON: Show this model wearing this product. ${baseImagePrompt}` }] },
      { parts: [modelImageData, primaryProduct, { text: `A different elegant pose for the same model. ${baseImagePrompt}` }] },
    ];
  } else {
    contentsForImageGen = [
      { parts: [primaryProduct, { text: `Modern model showcasing this product. ${baseImagePrompt}` }] },
      { parts: [primaryProduct, { text: `A high-end product lifestyle shot. ${baseImagePrompt}` }] },
    ];
  }

  const imagePromises = contentsForImageGen.map((c) =>
    ai.models.generateContent({ model: 'gemini-2.5-flash-image', contents: c })
  );

  const textPrompt = `
Language: ${lang === 'zh' ? 'Chinese' : 'English'}
Product: ${productDesc}
Platform: ${platformName}
Tone: ${voiceStyle}
${customContext}
${feedbackContext}
Return JSON ONLY: { "xiaohongshu": { "title": "...", "body": "...", "hashtags": [] }, "instagram": { ... }, "facebook": { ... } }
  `;

  const textParts = images.map(toInlineData).filter(Boolean);
  const textPromise = ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: { parts: [...textParts, { text: textPrompt }] },
    config: { responseMimeType: 'application/json' },
  });

  const results = await Promise.all([...imagePromises, textPromise]);
  const newImages = results.slice(0, 2).map(extractBase64Image).filter(Boolean);

  let content = {};
  try {
    content = JSON.parse(results[2]?.text || '{}');
  } catch {
    content = {};
  }

  return { images: newImages, content, platform };
};
