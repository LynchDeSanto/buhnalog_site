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
const contactInput = document.querySelector('input[name="contact"]');
const messageTextarea = document.querySelector('textarea[name="message"]');

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

// Получение данных из калькулятора
function getCalculatorData() {
  const taxSystemText = taxSystem.options[taxSystem.selectedIndex].text;
  const operationsCount = operations.value;
  const employeesCount = employees.value;
  const hasHrDocs = hrDocs.checked;
  const hasConsulting = consulting.checked;
  const price = totalPrice.textContent;

  return {
    taxSystemText,
    operationsCount,
    employeesCount,
    hasHrDocs,
    hasConsulting,
    price
  };
}

// Формирование сообщения с данными калькулятора
function formatCalculatorMessage() {
  const data = getCalculatorData();
  let message = `Расчёт стоимости:\n`;
  message += `• Система налогообложения: ${data.taxSystemText}\n`;
  message += `• Операций в месяц: ${data.operationsCount}\n`;
  message += `• Сотрудников: ${data.employeesCount}\n`;
  if (data.hasHrDocs) message += `• Кадровое сопровождение: да\n`;
  if (data.hasConsulting) message += `• Налоговая консультация: да\n`;
  message += `• Ориентировочная стоимость: ${data.price}\n\n`;
  return message;
}

// Вставка данных калькулятора в форму
function insertCalculatorDataToForm() {
  if (messageTextarea && messageTextarea.value.trim() === '') {
    messageTextarea.value = formatCalculatorMessage();
  }
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

  // Валидация контакта
  const data = new FormData(contactForm);
  const contactValue = data.get('contact');
  const contactValidation = validateContact(contactValue);

  if (!contactValidation.valid) {
    setFormState(false, 'Укажите корректный номер телефона (+7 XXX XXX-XX-XX) или email');
    return;
  }

  // Проверка Turnstile токена, если включен
  if (contactConfig.turnstileEnabled && !turnstileToken) {
    setFormState(false, 'Пожалуйста, подтвердите, что вы не робот.');
    return;
  }

  const payload = {
    name: data.get('name'),
    contact: contactValue,
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

// Маска для телефона
function formatPhoneNumber(value) {
  const digits = value.replace(/\D/g, '');

  if (digits.length === 0) return '';
  if (digits.length <= 1) return '+7';

  let formatted = '+7';
  if (digits.length > 1) formatted += ' ' + digits.substring(1, 4);
  if (digits.length >= 5) formatted += ' ' + digits.substring(4, 7);
  if (digits.length >= 8) formatted += '-' + digits.substring(7, 9);
  if (digits.length >= 10) formatted += '-' + digits.substring(9, 11);

  return formatted;
}

// Определение типа контакта и применение маски
function handleContactInput(event) {
  const value = event.target.value;

  // Если первый символ +, цифра или поле пустое - телефон
  if (value === '' || /^[\d+]/.test(value)) {
    const formatted = formatPhoneNumber(value);
    if (formatted !== value) {
      event.target.value = formatted;
    }
    event.target.type = 'tel';
    event.target.setAttribute('autocomplete', 'tel');
    event.target.setAttribute('inputmode', 'tel');
  } else if (value.includes('@') || /^[a-zA-Z]/.test(value)) {
    // Если содержит @ или начинается с буквы - email
    event.target.type = 'email';
    event.target.setAttribute('autocomplete', 'email');
    event.target.setAttribute('inputmode', 'email');
  }
}

// Валидация контакта перед отправкой
function validateContact(value) {
  // Проверка телефона (должно быть 11 цифр)
  const digits = value.replace(/\D/g, '');
  if (digits.length > 0 && digits.length === 11 && digits[0] === '7') {
    return { valid: true, type: 'phone' };
  }

  // Проверка email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (emailRegex.test(value)) {
    return { valid: true, type: 'email' };
  }

  return { valid: false, type: null };
}

calculator.addEventListener('input', updateCalculator);
contactForm.addEventListener('submit', handleContactSubmit);

// Автоматическая вставка данных калькулятора при фокусе на форме
if (messageTextarea) {
  messageTextarea.addEventListener('focus', function(e) {
    if (this.value.trim() === '') {
      insertCalculatorDataToForm();
    }
  });
}

// Кнопки "Рассчитать стоимость" ведут к калькулятору и затем к форме
document.querySelectorAll('a[href*="#calculator"]').forEach(link => {
  link.addEventListener('click', function(e) {
    setTimeout(() => {
      // Через 500мс после клика по калькулятору, прокрутить к форме
      const shouldScrollToForm = confirm('Хотите сразу отправить заявку с этим расчётом?');
      if (shouldScrollToForm) {
        insertCalculatorDataToForm();
        document.querySelector('#contactForm').scrollIntoView({ behavior: 'smooth', block: 'start' });
        setTimeout(() => {
          document.querySelector('input[name="name"]')?.focus();
        }, 800);
      }
    }, 1000);
  });
});

if (contactInput) {
  contactInput.addEventListener('input', handleContactInput);
  contactInput.addEventListener('focus', function() {
    if (this.value === '') {
      this.value = '+7';
    }
  });
  contactInput.addEventListener('blur', function() {
    if (this.value === '+7' || this.value === '+') {
      this.value = '';
    }
  });
}
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
