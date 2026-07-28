const calculatorConfig = {
  operationFreeLimit: 30,
  operationPrice: 70,
  employeePrice: 850,
  hrDocsPrice: 2500,
  consultingPrice: 4000,
};

const contactConfig = {
  endpoint: '/api/send',
  turnstileEnabled: false, // Установите true после получения ключей Cloudflare Turnstile
};

let turnstileToken = null;

// Callback для Turnstile
window.onTurnstileSuccess = function(token) {
  turnstileToken = token;
};

const calculator = document.querySelector('#priceCalculator');
const taxSystem = document.querySelector('#taxSystem');
const operations = document.querySelector('#operations');
const employees = document.querySelector('#employees');
const hrDocs = document.querySelector('#hrDocs');
const consulting = document.querySelector('#consulting');
const operationsValue = document.querySelector('#operationsValue');
const employeesValue = document.querySelector('#employeesValue');
const totalPrice = document.querySelector('#totalPrice');
const contactForm = document.querySelector('#contactForm');
const formStatus = document.querySelector('#formStatus');

const currencyFormatter = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  maximumFractionDigits: 0,
});

function updateCalculator() {
  const base = Number(taxSystem.value);
  const operationCost = Math.max(Number(operations.value) - calculatorConfig.operationFreeLimit, 0) * calculatorConfig.operationPrice;
  const employeeCost = Number(employees.value) * calculatorConfig.employeePrice;
  const hrCost = hrDocs.checked ? calculatorConfig.hrDocsPrice : 0;
  const consultingCost = consulting.checked ? calculatorConfig.consultingPrice : 0;
  const total = base + operationCost + employeeCost + hrCost + consultingCost;

  operationsValue.textContent = operations.value;
  employeesValue.textContent = employees.value;
  totalPrice.textContent = `${currencyFormatter.format(total)}/мес.`;
}

function setFormState(isLoading, message) {
  const submitButton = contactForm.querySelector('button[type="submit"]');
  submitButton.disabled = isLoading;
  submitButton.textContent = isLoading ? 'Отправляем...' : 'Отправить заявку';
  formStatus.textContent = message;
}

async function handleContactSubmit(event) {
  event.preventDefault();

  if (!contactForm.checkValidity()) {
    contactForm.reportValidity();
    return;
  }

  // Проверка Turnstile токена, если включен
  if (contactConfig.turnstileEnabled && !turnstileToken) {
    setFormState(false, 'Пожалуйста, подтвердите, что вы не робот.');
    return;
  }

  const data = new FormData(contactForm);
  const payload = {
    name: data.get('name'),
    contact: data.get('contact'),
    message: data.get('message'),
    privacy: data.get('privacy') === 'on',
    source: window.location.href,
    turnstileToken: turnstileToken || undefined,
  };

  setFormState(true, 'Отправляем заявку...');

  try {
    const response = await fetch(contactConfig.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(result.message || 'Не удалось отправить заявку');
    }

    // Редирект на страницу благодарности
    window.location.href = './thank-you.html';
  } catch (error) {
    setFormState(false, `${error.message}. Если ошибка повторится, напишите на hello@balance-profi.ru.`);

    // Сброс Turnstile при ошибке
    if (contactConfig.turnstileEnabled && window.turnstile) {
      turnstileToken = null;
      window.turnstile.reset();
    }
  }
}

calculator.addEventListener('input', updateCalculator);
contactForm.addEventListener('submit', handleContactSubmit);
updateCalculator();

// Отслеживание событий для Яндекс.Метрики
document.addEventListener('DOMContentLoaded', function() {
  // Клик по телефону
  const phoneLinks = document.querySelectorAll('a[href^="tel:"]');
  phoneLinks.forEach(link => {
    link.addEventListener('click', function() {
      if (typeof ym !== 'undefined') {
        ym(window.YANDEX_METRIKA_ID, 'reachGoal', 'phone_click');
      }
    });
  });

  // Клик по email
  const emailLinks = document.querySelectorAll('a[href^="mailto:"]');
  emailLinks.forEach(link => {
    link.addEventListener('click', function() {
      if (typeof ym !== 'undefined') {
        ym(window.YANDEX_METRIKA_ID, 'reachGoal', 'email_click');
      }
    });
  });

  // Использование калькулятора
  let calculatorUsed = false;
  calculator.addEventListener('input', function() {
    if (!calculatorUsed && typeof ym !== 'undefined') {
      ym(window.YANDEX_METRIKA_ID, 'reachGoal', 'calculator_used');
      calculatorUsed = true;
    }
  });
});
