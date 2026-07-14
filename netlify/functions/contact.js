const TELEGRAM_API = 'https://api.telegram.org';
const MAX_FIELD_LENGTH = 1200;

function jsonResponse(statusCode, payload) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
    body: JSON.stringify(payload),
  };
}

function cleanValue(value, maxLength = MAX_FIELD_LENGTH) {
  return String(value || '')
    .replace(/[<>]/g, '')
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
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

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { message: 'Метод не поддерживается' });
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    return jsonResponse(500, { message: 'Отправка заявок не настроена' });
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch (error) {
    return jsonResponse(400, { message: 'Некорректный JSON в запросе' });
  }

  const name = cleanValue(payload.name, 80);
  const contact = cleanValue(payload.contact, 120);
  const message = cleanValue(payload.message, 800);
  const privacyAccepted = Boolean(payload.privacy);
  const source = cleanValue(payload.source, 120);

  if (!name || !contact || !message || !privacyAccepted) {
    return jsonResponse(422, { message: 'Заполните обязательные поля и подтвердите согласие' });
  }

  const telegramMessage = [
    '<b>Новая заявка с сайта Баланс Профи</b>',
    `<b>Имя:</b> ${escapeHtml(name)}`,
    `<b>Контакт:</b> ${escapeHtml(contact)}`,
    `<b>Задача:</b> ${escapeHtml(message)}`,
    source ? `<b>Источник:</b> ${escapeHtml(source)}` : '',
  ].filter(Boolean).join('\n');

  let response;
  try {
    response = await fetch(`${TELEGRAM_API}/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: telegramMessage,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });
  } catch (error) {
    return jsonResponse(502, { message: 'Telegram временно недоступен. Попробуйте позже.' });
  }

  if (!response.ok) {
    return jsonResponse(502, { message: 'Telegram не принял заявку. Попробуйте позже.' });
  }

  return jsonResponse(200, { message: 'Заявка отправлена. Мы скоро свяжемся с вами.' });
};
