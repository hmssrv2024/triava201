// api/transform.js — Vercel (Node 18+)
// ENV requeridas: API_KEY (OpenRouter), opcional MODEL (default abajo)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.OPENROUTER_API_KEY || process.env.API_KEY;
  const modelFromEnv = process.env.MODEL || 'google/gemini-2.5-flash-image-preview';
  if (!apiKey) {
    return res.status(500).json({ error: 'Missing OPENROUTER_API_KEY or API_KEY' });
  }

  try {
    const {
      image,                 // data URL
      ratio = '3:4',
      model,
      strict = true,         // << nuevo: “modo identidad estricta”
      extra = ''             // << nuevo: instrucciones extra opcionales
    } = req.body || {};

    if (!image || typeof image !== 'string' || !image.startsWith('data:image/')) {
      return res.status(400).json({ error: 'Field "image" must be a data URL: data:image/...;base64,...' });
    }

    const chosenModel = (model || modelFromEnv).trim();

    // “Candados” de identidad: mensaje de sistema + negativos explícitos
    const systemPrompt = strict ? [
      'You are an IMAGE EDITOR.',
      'Edit ONLY the provided photo. NEVER change or replace the person.',
      'Lock identity: same face, features, sex, skin tone, hair, glasses, expression and age.',
      'No beautification, no makeup, no retouch except basic exposure/white balance.',
      'Forbidden: generating a different person, swapping identity, cartoonizing, ethnicity/sex/age changes, adding suit/tie/jacket.',
      'Only do the requested background clean-up and crop. Keep head geometry exactly the same.'
    ].join(' ') : 'You are an image editor.';

    // Instrucción de tarea (corta y concreta para que siempre haya tokens)
    const userPrompt = [
      `Make a passport/ID-style headshot from the input photo.`,
      `Plain pure white (#FFFFFF) background.`,
      `Portrait crop ${ratio}. Center face, front-facing.`,
      `Preserve identity exactly. Natural tones. Clean edges. High quality.`,
      extra ? `Extra: ${extra}` : ''
    ].join(' ');

    // Formato robusto para OpenRouter chat/completions
    const payload = {
      model: chosenModel,
      temperature: 0,                    // << evita creatividad = menos riesgo de “otra persona”
      modalities: ['image', 'text'],
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: userPrompt,
          images: [{ type: 'image_url', image_url: { url: image } }]
        }
      ]
    };

    const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const raw = await r.text();
    let data; try { data = JSON.parse(raw); } catch { data = { raw }; }

    if (!r.ok) {
      return res.status(r.status).json({ error: data?.error?.message || raw || `OpenRouter error ${r.status}` });
    }

    // Normalización de salida (varias formas posibles)
    let resultUrl =
      data?.choices?.[0]?.message?.images?.[0]?.image_url?.url ||
      data?.choices?.[0]?.message?.image_url?.url;

    if (!resultUrl) {
      const s = data?.choices?.[0]?.message?.content;
      if (typeof s === 'string' && s.startsWith('data:image/')) resultUrl = s;
    }
    if (!resultUrl) {
      const b64 = data?.choices?.[0]?.message?.images?.[0]?.b64_json;
      if (b64) resultUrl = `data:image/png;base64,${b64}`;
    }

    if (!resultUrl) {
      return res.status(200).json({ note: 'No image URL found in response', data });
    }
    return res.status(200).json({ resultBase64: resultUrl, provider: 'openrouter', model: chosenModel, strict });
  } catch (e) {
    return res.status(500).json({ error: e?.message || String(e) });
  }
}
