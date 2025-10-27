import crypto from 'node:crypto';
import { readRegistrations, saveRegistration } from './registro-storage.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DEFAULT_MAX_RECORDS = 200;

function getMaxRecordsFromEnv() {
  const fromEnv = process.env.REGISTRO_MAX_RECORDS;
  if (!fromEnv) {
    return DEFAULT_MAX_RECORDS;
  }
  const parsed = Number.parseInt(fromEnv, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_MAX_RECORDS;
}

function safeString(value) {
  if (value === null || value === undefined) {
    return null;
  }
  const normalized = String(value).trim();
  return normalized.length ? normalized : null;
}

function normalizeEmail(value) {
  const normalized = safeString(value);
  if (!normalized) {
    return null;
  }
  const lower = normalized.toLowerCase();
  return EMAIL_REGEX.test(lower) ? lower : null;
}

function normalizeCountry(value) {
  const normalized = safeString(value);
  return normalized ? normalized.toUpperCase() : null;
}

function normalizeBirthPart(value, { pad = 2 } = {}) {
  const normalized = safeString(value);
  if (!normalized) {
    return null;
  }
  const digits = normalized.replace(/[^0-9]/g, '');
  if (!digits) {
    return null;
  }
  if (pad === 2 && digits.length === 1) {
    return `0${digits}`;
  }
  return digits;
}

function normalizePhoneNumber(value) {
  const normalized = safeString(value);
  if (!normalized) {
    return null;
  }
  return normalized.replace(/\s+/g, '');
}

function normalizeFullPhoneNumber(value) {
  const normalized = normalizePhoneNumber(value);
  if (!normalized) {
    return null;
  }
  return normalized.startsWith('+') ? normalized : `+${normalized}`;
}

function normalizeRegistration(input = {}) {
  const email = normalizeEmail(input.email);
  const firstName = safeString(input.first_name ?? input.firstName);
  const lastName = safeString(input.last_name ?? input.lastName);
  const preferredName = safeString(input.preferred_name ?? input.preferredName ?? input.nickname);
  const nickname = safeString(input.nickname);
  const fullNameFromPayload = safeString(input.full_name ?? input.fullName);
  const country = normalizeCountry(input.country);
  const state = safeString(input.state);
  const gender = safeString(input.gender);
  const documentType = safeString(input.document_type ?? input.documentType);
  const documentNumber = safeString(input.document_number ?? input.documentNumber);
  const phoneCountryCode = normalizePhoneNumber(input.phone_country_code ?? input.phoneCountryCode)?.replace(/^\+/, '') ?? null;
  const phonePrefix = normalizePhoneNumber(input.phone_prefix ?? input.phonePrefix ?? input.phone_country_prefix);
  const phoneNumber = normalizePhoneNumber(input.phone_number ?? input.phoneNumber ?? input.nationalPhoneNumber);
  const fullPhoneNumber = normalizeFullPhoneNumber(
    input.full_phone_number ?? input.fullPhoneNumber ?? input.phoneNumberFull ?? input.fullPhone
  );
  const createdAtRaw = safeString(input.created_at ?? input.createdAt);
  const createdAt = createdAtRaw && !Number.isNaN(Date.parse(createdAtRaw))
    ? new Date(createdAtRaw).toISOString()
    : new Date().toISOString();

  const birthDay = normalizeBirthPart(input.birth_day ?? input.birthDay, { pad: 2 });
  const birthMonth = normalizeBirthPart(input.birth_month ?? input.birthMonth, { pad: 2 });
  const birthYear = normalizeBirthPart(input.birth_year ?? input.birthYear, { pad: 4 });

  const fullName = fullNameFromPayload
    || [firstName, lastName].filter(Boolean).join(' ').trim()
    || null;

  return {
    id: safeString(input.id) ?? crypto.randomUUID(),
    email,
    first_name: firstName,
    last_name: lastName,
    full_name: fullName,
    preferred_name: preferredName,
    nickname,
    country,
    state,
    gender,
    birth_day: birthDay,
    birth_month: birthMonth,
    birth_year: birthYear,
    document_type: documentType,
    document_number: documentNumber,
    phone_country_code: phoneCountryCode,
    phone_prefix: phonePrefix,
    phone_number: phoneNumber,
    full_phone_number: fullPhoneNumber,
    created_at: createdAt,
    updated_at: createdAt,
    presence: input.presence ?? null
  };
}

async function parseJsonBody(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
    return req.body;
  }
  if (typeof req.body === 'string') {
    return JSON.parse(req.body || '{}');
  }
  if (Buffer.isBuffer(req.body)) {
    return JSON.parse(req.body.toString('utf8'));
  }

  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  if (!chunks.length) {
    return {};
  }
  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
}

function extractQueryParams(req) {
  const params = new URL(req.url || '', 'http://localhost').searchParams;
  const pageParam = params.get('page') ?? req.query?.page;
  const pageSizeParam = params.get('pageSize') ?? params.get('per_page') ?? req.query?.pageSize ?? req.query?.per_page;

  const page = Number.parseInt(pageParam ?? '1', 10);
  const requestedPageSize = Number.parseInt(pageSizeParam ?? String(DEFAULT_MAX_RECORDS), 10);
  const maxRecords = getMaxRecordsFromEnv();
  const sanitizedSize = Number.isFinite(requestedPageSize) && requestedPageSize > 0
    ? Math.min(requestedPageSize, maxRecords)
    : maxRecords;

  return {
    page: Number.isFinite(page) && page > 0 ? page : 1,
    pageSize: sanitizedSize
  };
}

function paginate(items, { page, pageSize }) {
  const safePageSize = pageSize > 0 ? pageSize : getMaxRecordsFromEnv();
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / safePageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * safePageSize;
  const end = start + safePageSize;
  return {
    page: currentPage,
    pageSize: safePageSize,
    total,
    totalPages,
    items: items.slice(start, end)
  };
}

function toPresenceList(registrations) {
  if (!Array.isArray(registrations) || registrations.length === 0) {
    return [];
  }

  const latestByKey = new Map();

  registrations.forEach((registration, index) => {
    const key = registration?.email || registration?.id || `registro-${index + 1}`;
    const lastSeen = registration?.created_at || registration?.createdAt || registration?.updated_at || null;
    const detailsSource = registration?.presence || registration;

    const details = typeof detailsSource === 'string' ? detailsSource : JSON.stringify(detailsSource ?? {});

    if (!latestByKey.has(key)) {
      latestByKey.set(key, { key, details, lastSeen });
      return;
    }

    const current = latestByKey.get(key);
    const currentTime = current.lastSeen ? new Date(current.lastSeen).getTime() : 0;
    const incomingTime = lastSeen ? new Date(lastSeen).getTime() : 0;

    if (incomingTime >= currentTime) {
      latestByKey.set(key, { key, details, lastSeen });
    }
  });

  return Array.from(latestByKey.values()).sort((a, b) => {
    const timeA = a.lastSeen ? new Date(a.lastSeen).getTime() : 0;
    const timeB = b.lastSeen ? new Date(b.lastSeen).getTime() : 0;
    return timeB - timeA;
  });
}

async function forwardRegistration(normalized) {
  const apiKey = process.env.OPENROUTER_API_KEY || process.env.API_KEY;
  const forwardUrl = process.env.OPENROUTER_REGISTRATION_URL
    || process.env.REGISTRO_FORWARD_URL
    || process.env.OPENROUTER_FLOW_URL;

  if (!apiKey) {
    const error = new Error('Missing OPENROUTER_API_KEY environment variable.');
    error.statusCode = 500;
    throw error;
  }

  if (!forwardUrl) {
    const error = new Error('Missing OpenRouter forward URL (OPENROUTER_REGISTRATION_URL or REGISTRO_FORWARD_URL).');
    error.statusCode = 500;
    throw error;
  }

  const headers = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  };

  if (process.env.OPENROUTER_REFERRER) {
    headers['HTTP-Referer'] = process.env.OPENROUTER_REFERRER;
  }
  if (process.env.OPENROUTER_TITLE) {
    headers['X-Title'] = process.env.OPENROUTER_TITLE;
  }

  const payload = {
    type: 'homevisa.registration',
    data: normalized
  };

  const response = await fetch(forwardUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
  });

  const raw = await response.text();
  let parsed;
  try {
    parsed = raw ? JSON.parse(raw) : null;
  } catch (error) {
    parsed = { raw };
  }

  if (!response.ok) {
    const message = parsed?.error?.message || parsed?.error || raw || `OpenRouter error ${response.status}`;
    const error = new Error(message);
    error.statusCode = response.status;
    error.response = parsed;
    throw error;
  }

  return {
    status: response.status,
    body: parsed,
    raw
  };
}

function validateNormalizedRegistration(normalized) {
  const errors = [];
  if (!normalized.email) {
    errors.push('email');
  }
  if (!normalized.full_name && !normalized.first_name && !normalized.last_name) {
    errors.push('nombre');
  }

  if (errors.length) {
    const error = new Error(`Faltan campos obligatorios: ${errors.join(', ')}.`);
    error.statusCode = 400;
    throw error;
  }
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const registrations = await readRegistrations();
      const { page, pageSize } = extractQueryParams(req);
      const pagination = paginate(registrations, { page, pageSize });
      const presence = toPresenceList(registrations);
      const updatedAt = registrations[0]?.created_at || registrations[0]?.updated_at || new Date().toISOString();

      res.status(200).json({
        ok: true,
        data: {
          registrations: pagination.items,
          presence,
          pagination: {
            page: pagination.page,
            pageSize: pagination.pageSize,
            total: pagination.total,
            totalPages: pagination.totalPages
          },
          updatedAt
        }
      });
    } catch (error) {
      console.error('[registro] Error al leer registros', error);
      res.status(500).json({ ok: false, error: 'No fue posible obtener los registros.' });
    }
    return;
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).json({ ok: false, error: 'Method not allowed' });
    return;
  }

  let payload;
  try {
    payload = await parseJsonBody(req);
  } catch (error) {
    res.status(400).json({ ok: false, error: 'Cuerpo JSON inválido.' });
    return;
  }

  try {
    const normalized = normalizeRegistration(payload);
    validateNormalizedRegistration(normalized);

    const forwardResult = await forwardRegistration(normalized);
    const remoteId = forwardResult.body?.id
      || forwardResult.body?.data?.id
      || forwardResult.body?.result?.id
      || normalized.id;

    const storedRecord = {
      ...normalized,
      id: remoteId,
      forwarded_at: new Date().toISOString(),
      external_reference: remoteId !== normalized.id ? normalized.id : null
    };

    await saveRegistration(storedRecord);

    res.setHeader('Set-Cookie', 'visaRegistered=true; HttpOnly; SameSite=Lax; Path=/');
    res.status(200).json({ ok: true, id: remoteId });
  } catch (error) {
    const statusCode = error.statusCode && Number.isInteger(error.statusCode) ? error.statusCode : 500;
    console.error('[registro] Error al procesar registro', error);
    res.status(statusCode).json({ ok: false, error: error.message || 'Error al procesar el registro.' });
  }
}
