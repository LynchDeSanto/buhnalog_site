const calculator = document.querySelector('#priceCalculator');
const taxSystem = document.querySelector('#taxSystem');
const operations = document.querySelector('#operations');
const employees = document.querySelector('#employees');
const hrDocs = document.querySelector('#hrDocs');
const consulting = document.querySelector('#consulting');
const operationsValue = document.querySelector('#operationsValue');
const employeesValue = document.querySelector('#employeesValue');
const totalPrice = document.querySelector('#totalPrice');

const currencyFormatter = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  maximumFractionDigits: 0,
});

function updateCalculator() {
  const base = Number(taxSystem.value);
  const operationCost = Math.max(Number(operations.value) - 30, 0) * 70;
  const employeeCost = Number(employees.value) * 850;
  const hrCost = hrDocs.checked ? 2500 : 0;
  const consultingCost = consulting.checked ? 4000 : 0;
  const total = base + operationCost + employeeCost + hrCost + consultingCost;

  operationsValue.textContent = operations.value;
  employeesValue.textContent = employees.value;
  totalPrice.textContent = `${currencyFormatter.format(total)}/мес.`;
}

calculator.addEventListener('input', updateCalculator);
updateCalculator();
