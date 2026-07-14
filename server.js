const fs = require('fs');
const http = require('http');
const path = require('path');

const TELEGRAM_API = 'https://api.telegram.org';
const PUBLIC_DIR = __dirname;
const MAX_JSON_SIZE = 16 * 1024;

function loadEnv(filePath = path.join(PUBLIC_DIR, '.env')) {
  if (!fs.existsSync(filePath)) return;

  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, '');
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadEnv();

const PORT = Number(process.env.PORT || 3000);

function securityHeaders(extraHeaders = {}) {
  return {
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
    ...extraHeaders,
  };
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, securityHeaders({
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  }));
  response.end(JSON.stringify(payload));
}

function cleanValue(value, maxLength) {
  return String(value || '')
    .replace(/[<>]/g, '')
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function validateLead(payload) {
  const name = cleanValue(payload.name, 80);
  const contact = cleanValue(payload.contact, 120);
  const message = cleanValue(payload.message, 800);
  const source = cleanValue(payload.source, 200);
  const privacy = payload.privacy === true;

  if (!name) return { error: 'Укажите имя' };
  if (!contact) return { error: 'Укажите телефон или email' };
  if (!message) return { error: 'Опишите задачу' };
  if (!privacy) return { error: 'Подтвердите согласие с политикой конфиденциальности' };

  return { lead: { name, contact, message, source, privacy } };
}

function buildTelegramMessage(lead) {
  return [
    '<b>Новая заявка с сайта Баланс Профи</b>',
    `<b>Имя:</b> ${escapeHtml(lead.name)}`,
    `<b>Контакт:</b> ${escapeHtml(lead.contact)}`,
    `<b>Задача:</b> ${escapeHtml(lead.message)}`,
    lead.source ? `<b>Источник:</b> ${escapeHtml(lead.source)}` : '',
  ].filter(Boolean).join('\n');
}

async function sendToTelegram(text) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    return { ok: false, status: 500, message: 'Отправка заявок не настроена на сервере' };
  }

  let response;
  try {
    response = await fetch(`${TELEGRAM_API}/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });
  } catch (error) {
    return { ok: false, status: 502, message: 'Telegram временно недоступен. Попробуйте позже.' };
  }

  if (!response.ok) {
    return { ok: false, status: 502, message: 'Telegram не принял заявку. Попробуйте позже.' };
  }

  return { ok: true };
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let body = '';

    request.on('data', (chunk) => {
      body += chunk;
      if (Buffer.byteLength(body) > MAX_JSON_SIZE) {
        reject(new Error('payload_too_large'));
        request.destroy();
      }
    });

    request.on('end', () => {
      try {
        resolve(JSON.parse(body || '{}'));
      } catch (error) {
        reject(new Error('invalid_json'));
      }
    });

    request.on('error', reject);
  });
}

async function handleApiSend(request, response) {
  if (request.method !== 'POST') {
    return sendJson(response, 405, { message: 'Метод не поддерживается' });
  }

  let payload;
  try {
    payload = await readJsonBody(request);
  } catch (error) {
    if (error.message === 'payload_too_large') {
      return sendJson(response, 413, { message: 'Слишком большой запрос' });
    }
    return sendJson(response, 400, { message: 'Некорректный JSON в запросе' });
  }

  const { lead, error } = validateLead(payload);
  if (error) {
    return sendJson(response, 422, { message: error });
  }

  const telegramResult = await sendToTelegram(buildTelegramMessage(lead));
  if (!telegramResult.ok) {
    return sendJson(response, telegramResult.status, { message: telegramResult.message });
  }

  return sendJson(response, 200, { message: 'Заявка отправлена. Мы скоро свяжемся с вами.' });
}

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

function sendStaticFile(response, requestPath) {
  const safePath = path.normalize(decodeURIComponent(requestPath)).replace(/^(\.\.[/\\])+/, '');
  const filePath = path.join(PUBLIC_DIR, safePath === '/' ? 'index.html' : safePath);

  if (!filePath.startsWith(PUBLIC_DIR) || ['.env', '.env.example', 'server.js', 'package.json'].includes(path.basename(filePath))) {
    return sendJson(response, 404, { message: 'Файл не найден' });
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      fs.readFile(path.join(PUBLIC_DIR, 'index.html'), (indexError, indexContent) => {
        if (indexError) return sendJson(response, 404, { message: 'Файл не найден' });
        response.writeHead(200, securityHeaders({ 'Content-Type': 'text/html; charset=utf-8' }));
        return response.end(indexContent);
      });
      return;
    }

    const contentType = mimeTypes[path.extname(filePath)] || 'application/octet-stream';
    response.writeHead(200, securityHeaders({ 'Content-Type': contentType, 'Cache-Control': 'public, max-age=3600' }));
    response.end(content);
  });
}

function createServer() {
  return http.createServer(async (request, response) => {
    const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);

    if (url.pathname === '/api/send') {
      return handleApiSend(request, response);
    }

    if (url.pathname.startsWith('/api/')) {
      return sendJson(response, 404, { message: 'API endpoint не найден' });
    }

    return sendStaticFile(response, url.pathname);
  });
}

if (require.main === module) {
  createServer().listen(PORT, '127.0.0.1', () => {
    console.log(`Баланс Профи запущен на http://127.0.0.1:${PORT}`);
  });
}

module.exports = { createServer, cleanValue, validateLead, buildTelegramMessage, readJsonBody };
