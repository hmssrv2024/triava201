import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..');
const EXAMPLE_PATH = path.join(ROOT_DIR, 'public', 'env-config.example.js');
const TARGET_PATH = path.join(ROOT_DIR, 'public', 'env-config.js');
const PAYPAL_PLACEHOLDER = 'TU_CLIENT_ID_DE_PAYPAL';
const GEMINI_PLACEHOLDER = 'TU_GEMINI_API_KEY';

function escapeForSingleQuotedJsString(value) {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

async function ensureEnvConfig() {
  const clientId = process.env.PAYPAL_CLIENT_ID?.trim();
  const geminiApiKey = process.env.GEMINI_API_KEY?.trim();

  if (!clientId && !geminiApiKey) {
    console.warn('[generate-env-config] PAYPAL_CLIENT_ID and GEMINI_API_KEY are not defined; skipping env-config.js generation.');
    return;
  }

  const exampleContent = await fs.readFile(EXAMPLE_PATH, 'utf8');

  if (!exampleContent.includes(PAYPAL_PLACEHOLDER)) {
    throw new Error(`Placeholder ${PAYPAL_PLACEHOLDER} not found in ${EXAMPLE_PATH}.`);
  }
  if (!exampleContent.includes(GEMINI_PLACEHOLDER)) {
    throw new Error(`Placeholder ${GEMINI_PLACEHOLDER} not found in ${EXAMPLE_PATH}.`);
  }

  const escapedClientId = clientId ? escapeForSingleQuotedJsString(clientId) : '';
  const escapedGeminiKey = geminiApiKey ? escapeForSingleQuotedJsString(geminiApiKey) : '';

  const generatedContent = exampleContent
    .replace(new RegExp(PAYPAL_PLACEHOLDER, 'g'), escapedClientId)
    .replace(new RegExp(GEMINI_PLACEHOLDER, 'g'), escapedGeminiKey);

  await fs.writeFile(TARGET_PATH, generatedContent, 'utf8');
  const messages = [];
  if (clientId) {
    messages.push('PAYPAL_CLIENT_ID');
  } else {
    console.warn('[generate-env-config] PAYPAL_CLIENT_ID not provided. The generated file mantiene el campo vacío.');
  }
  if (geminiApiKey) {
    messages.push('GEMINI_API_KEY');
  } else {
    console.warn('[generate-env-config] GEMINI_API_KEY not provided. La página audio mostrará un error hasta definirla.');
  }
  console.log(
    `[generate-env-config] Generated ${path.relative(ROOT_DIR, TARGET_PATH)} using ${messages.join(' y ') || 'valores vacíos'}.`
  );
}

ensureEnvConfig().catch((error) => {
  console.error('[generate-env-config] Failed to generate env-config.js');
  console.error(error);
  process.exitCode = 1;
});
