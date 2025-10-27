import fs from 'fs';
import path from 'path';
import pdf from 'pdf-parse';

let guidesText = '';
async function loadGuides() {
  const files = ['guia1.pdf', 'guia2.pdf'];
  for (const file of files) {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      try {
        const data = fs.readFileSync(filePath);
        const parsed = await pdf(data);
        guidesText += '\n' + parsed.text;
      } catch (err) {
        console.error('Error reading', file, err);
      }
    }
  }
}
await loadGuides();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  const { message } = req.body || {};
  if (!message) {
    res.status(400).json({ error: 'Missing message' });
    return;
  }
  const apiKey = process.env.OPENROUTER_API_KEY || process.env.API_KEY;
  const model = (process.env.OPENROUTER_CHAT_MODEL || 'anthropic/claude-3-haiku').trim();
  if (!apiKey) {
    res.status(500).json({ error: 'OpenRouter API key not configured' });
    return;
  }
  const systemPrompt = 'Eres Ana, la asistente virtual oficial de Remeex Visa. Responde con un tono cálido, cordial y empático.';
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        temperature: 0,
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: `Información de las guías:\n${guidesText}\nPregunta: ${message}`
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    let reply = data?.choices?.[0]?.message?.content || '';
    if (Array.isArray(reply)) {
      reply = reply[0]?.text || '';
    }
    if (!reply) {
      reply = data?.choices?.[0]?.message?.content?.[0]?.text || '';
    }
    res.status(200).json({ reply });
  } catch (err) {
    console.error('OpenRouter error', err);
    res.status(500).json({ error: 'Error generating response from OpenRouter' });
  }
}
