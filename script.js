const calculatorConfig = {
  operationFreeLimit: 30,
  operationPrice: 70,
  employeePrice: 850,
  hrDocsPrice: 2500,
  consultingPrice: 4000,
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

function handleContactSubmit(event) {
  event.preventDefault();

  if (!contactForm.checkValidity()) {
    contactForm.reportValidity();
    return;
  }

  const data = new FormData(contactForm);
  const subject = encodeURIComponent('Заявка с сайта Баланс Профи');
  const body = encodeURIComponent(
    `Имя: ${data.get('name')}\nКонтакт: ${data.get('contact')}\nЗадача: ${data.get('message')}`,
  );

  formStatus.textContent = 'Спасибо! Открываем почтовый клиент для отправки заявки.';
  window.location.href = `mailto:hello@balance-profi.ru?subject=${subject}&body=${body}`;
}

calculator.addEventListener('input', updateCalculator);
contactForm.addEventListener('submit', handleContactSubmit);
updateCalculator();
