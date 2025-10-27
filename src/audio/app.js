import { GoogleGenAI } from '@google/genai/web';

const MODEL_NAME = 'models/gemini-2.5-pro-preview-tts';
const VOICE_NAME = 'Zephyr';
const TEMPERATURE = 1.0;
const MAX_CHARACTERS = 2400;

window.__ENV__ = window.__ENV__ || {};

const stylePrompts = {
  neutral:
    'Genera la narración con voz cálida y profesional en español neutro latino, respetando el texto sin añadir frases adicionales.',
  'es-es':
    'Entrega el guion en castellano de España con una dicción clara y cercana. Mantén la voz Zephyr y evita anglicismos innecesarios.',
  'en-us':
    'Read the script in American English with a natural conversational tone. Keep Zephyr as the speaker and do not add extra content.',
  'pt-br':
    'Fale o texto em português do Brasil com entonação amistosa. Mantenha a voz Zephyr e evita adicionar conteúdo fora do roteiro.',
};

const textarea = document.getElementById('script-text');
const generateButton = document.getElementById('generate-button');
const downloadButton = document.getElementById('download-button');
const statusMessage = document.getElementById('status-message');
const audioPlayer = document.getElementById('audio-player');
const charCount = document.getElementById('char-count');
const styleSelect = document.getElementById('style-select');

let currentAudioBlob = null;
let currentAudioUrl = null;

function getApiKey() {
  const apiKey = (window.__ENV__ && window.__ENV__.GEMINI_API_KEY) || '';
  if (!apiKey || apiKey.trim() === '' || apiKey.startsWith('TU_')) {
    throw new Error(
      'Falta la clave GEMINI_API_KEY. Crea public/env-config.js con la clave o define la variable de entorno antes del build.'
    );
  }
  return apiKey.trim();
}

function updateStatus(message, tone = 'idle') {
  statusMessage.textContent = message;
  statusMessage.dataset.tone = tone;
}

function updateCharCount() {
  const currentLength = textarea.value.length;
  charCount.textContent = `${currentLength} / ${MAX_CHARACTERS}`;
  if (currentLength > MAX_CHARACTERS) {
    charCount.classList.add('over-limit');
  } else {
    charCount.classList.remove('over-limit');
  }
}

function setLoadingState(isLoading) {
  generateButton.disabled = isLoading;
  downloadButton.disabled = isLoading || !currentAudioBlob;
  textarea.disabled = isLoading;
  styleSelect.disabled = isLoading;
  if (isLoading) {
    updateStatus('Generando audio…', 'progress');
  }
}

function renderPlayer(blob) {
  if (currentAudioUrl) {
    URL.revokeObjectURL(currentAudioUrl);
  }
  currentAudioBlob = blob;
  currentAudioUrl = URL.createObjectURL(blob);
  audioPlayer.src = currentAudioUrl;
  audioPlayer.hidden = false;
  audioPlayer.load();
  downloadButton.disabled = false;
  updateStatus('Audio listo. Reproduce o descarga el MP3.', 'success');
}

function resetAudio() {
  if (currentAudioUrl) {
    URL.revokeObjectURL(currentAudioUrl);
    currentAudioUrl = null;
  }
  currentAudioBlob = null;
  audioPlayer.src = '';
  audioPlayer.hidden = true;
  downloadButton.disabled = true;
}

function extractAudioPart(response) {
  const candidates = response?.candidates ?? [];
  for (const candidate of candidates) {
    const parts = candidate?.content?.parts ?? [];
    for (const part of parts) {
      if (part?.inlineData?.data) {
        return part.inlineData;
      }
    }
  }
  return null;
}

function base64ToUint8Array(base64) {
  const cleaned = base64.replace(/\s+/g, '');
  const binary = atob(cleaned);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function generateTTS() {
  resetAudio();
  updateCharCount();

  const script = textarea.value.trim();
  if (!script) {
    updateStatus('Escribe un texto antes de generar el audio.', 'error');
    textarea.focus();
    return;
  }
  if (script.length > MAX_CHARACTERS) {
    updateStatus('El texto supera el límite de 2 400 caracteres.', 'error');
    textarea.focus();
    return;
  }

  let apiKey;
  try {
    apiKey = getApiKey();
  } catch (error) {
    console.error(error);
    updateStatus(error.message, 'error');
    return;
  }

  const styleKey = styleSelect.value;
  const stylePrompt = stylePrompts[styleKey] ?? stylePrompts.neutral;

  setLoadingState(true);

  try {
    const client = new GoogleGenAI({ apiKey });
    const response = await client.models.generateContent({
      model: MODEL_NAME,
      contents: [{
        role: 'user',
        parts: [{ text: script }],
      }],
      config: {
        temperature: TEMPERATURE,
        responseModalities: ['AUDIO'],
        responseMimeType: 'audio/mp3',
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: VOICE_NAME,
            },
          },
        },
        systemInstruction: stylePrompt,
      },
    });

    const inlineAudio = extractAudioPart(response);
    if (!inlineAudio?.data) {
      throw new Error('La respuesta no incluye datos de audio.');
    }

    const mimeType = (inlineAudio.mimeType || 'audio/mp3').toLowerCase();
    const bytes = base64ToUint8Array(inlineAudio.data);
    const normalizedMime = mimeType === 'audio/mpeg' ? 'audio/mp3' : mimeType;
    const blob = new Blob([bytes], { type: normalizedMime === 'audio/mp3' ? 'audio/mp3' : 'audio/mp3' });
    renderPlayer(blob);
  } catch (error) {
    console.error(error);
    const message =
      error instanceof Error
        ? error.message
        : 'No se pudo generar el audio. Revisa la consola para más detalles.';
    updateStatus(message, 'error');
    resetAudio();
  } finally {
    setLoadingState(false);
  }
}

function downloadMp3() {
  if (!currentAudioBlob) {
    updateStatus('No hay un audio disponible para descargar.', 'warning');
    return;
  }

  const url = URL.createObjectURL(currentAudioBlob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'output.mp3';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

function init() {
  updateCharCount();
  textarea.addEventListener('input', updateCharCount);
  textarea.addEventListener('focus', () => {
    if (statusMessage.dataset.tone === 'error') {
      updateStatus('Escribe tu texto y presiona “Generar audio”.');
    }
  });

  generateButton.addEventListener('click', (event) => {
    event.preventDefault();
    void generateTTS();
  });

  downloadButton.addEventListener('click', (event) => {
    event.preventDefault();
    downloadMp3();
  });

  updateStatus('Listo para generar audio.');
}

init();
