const calculatorConfig = {
  operationFreeLimit: 30,
  operationPrice: 70,
  employeePrice: 850,
  hrDocsPrice: 2500,
  consultingPrice: 4000,
};

const contactConfig = {
  endpoint: '/.netlify/functions/contact',
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

  const data = new FormData(contactForm);
  const payload = {
    name: data.get('name'),
    contact: data.get('contact'),
    message: data.get('message'),
    privacy: data.get('privacy') === 'on',
    source: window.location.href,
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

    contactForm.reset();
    setFormState(false, result.message || 'Заявка отправлена. Мы скоро свяжемся с вами.');
  } catch (error) {
    setFormState(false, `${error.message}. Если ошибка повторится, напишите на hello@balance-profi.ru.`);
  }
}

calculator.addEventListener('input', updateCalculator);
contactForm.addEventListener('submit', handleContactSubmit);
updateCalculator();
