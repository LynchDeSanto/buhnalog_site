# Баланс Профи — лендинг бухгалтерских услуг

Лендинг для бухгалтерской компании с полным набором функций: блоки «О компании», «Услуги», «Калькулятор услуг», «Связаться с нами», форма обратной связи с защитой от спама, отправка заявок в Telegram через Node.js backend, интеграция с Яндекс.Метрикой и SEO-оптимизация.

## Возможности

✅ **Адаптивный дизайн** — корректно отображается на всех устройствах  
✅ **Интерактивный калькулятор услуг** — пользователи могут рассчитать стоимость онлайн  
✅ **Защита от спама** — Cloudflare Turnstile CAPTCHA  
✅ **Отправка заявок в Telegram** — моментальные уведомления о новых лидах  
✅ **Безопасность** — CSP заголовки, валидация данных, токены только на сервере  
✅ **SEO-оптимизация** — метатеги, микроразметка Schema.org, sitemap.xml, robots.txt  
✅ **Аналитика** — готовая интеграция с Яндекс.Метрикой и отслеживанием целей  
✅ **Страница благодарности** — для отслеживания конверсий  
✅ **Политика конфиденциальности** — в соответствии с законодательством РФ (152-ФЗ)  

## Структура проекта

### Основные файлы
- `index.html` — главная страница лендинга с метатегами, микроразметкой Schema.org и интеграцией аналитики
- `thank-you.html` — страница благодарности после успешной отправки заявки (для отслеживания конверсий)
- `privacy.html` — полноценная политика конфиденциальности в соответствии с 152-ФЗ
- `styles.css` — адаптивные стили с поддержкой мобильных устройств
- `script.js` — логика калькулятора, отправка формы, интеграция с Turnstile CAPTCHA и отслеживание событий для Яндекс.Метрики
- `server.js` — Node.js backend с валидацией данных, проверкой Turnstile CAPTCHA и отправкой в Telegram

### SEO и метаданные
- `favicon.svg` — векторная иконка сайта для современных браузеров
- `robots.txt` — правила индексации для поисковых систем
- `sitemap.xml` — карта сайта для поисковиков

### Конфигурация
- `package.json` — зависимости и npm-скрипты
- `.env.example` — пример переменных окружения (Telegram, Turnstile, порт)
- `deploy/balance-profi.service` — systemd unit для автозапуска backend

### Документация
- `README.md` — общая информация о проекте и быстрый старт
- `SETUP.md` — подробная инструкция по настройке всех функций

## Калькулятор услуг

Калькулятор находится в блоке `#calculator` в `index.html`, а расчёт выполняется в `script.js`.

### Формула расчёта

```text
Итого = базовый тариф + стоимость операций + стоимость сотрудников + дополнительные услуги
```

Где:

- **Базовый тариф** берётся из выбранной системы налогообложения в `index.html`:
  - `6000` — УСН / патент;
  - `9000` — ОСНО;
  - `7500` — НПД + ИП.
- **Стоимость операций** считается только сверх бесплатного лимита:

```text
max(операции - operationFreeLimit, 0) × operationPrice
```

- **Стоимость сотрудников**:

```text
сотрудники × employeePrice
```

- **Дополнительные услуги** добавляются, если отмечены чекбоксы:
  - `hrDocsPrice` — кадровое сопровождение;
  - `consultingPrice` — ежемесячная налоговая консультация.

### Как изменить тарифы

1. Базовые тарифы меняются в `index.html` в списке `#taxSystem`:

```html
<option value="6000">УСН / патент</option>
```

Число в `value` — цена базового тарифа в рублях.

2. Лимит бесплатных операций и доплаты меняются в `script.js` в объекте `calculatorConfig`:

```js
const calculatorConfig = {
  operationFreeLimit: 30,
  operationPrice: 70,
  employeePrice: 850,
  hrDocsPrice: 2500,
  consultingPrice: 4000,
};
```

3. Диапазоны ползунков меняются в `index.html`:

```html
<input id="operations" type="range" min="10" max="400" step="10" value="50" />
<input id="employees" type="range" min="0" max="50" step="1" value="3" />
```

## Форма обратной связи и Telegram

Форма находится в блоке `#contacts` в `index.html`. После нажатия «Отправить заявку» пользователь остаётся на сайте: `script.js` отправляет JSON-запрос на `/api/send`, а `server.js` пересылает заявку в Telegram через Bot API.

Frontend отправляет JSON такого вида:

```json
{
  "name": "Иван Иванов",
  "contact": "+7 999 000-00-00",
  "message": "Нужно вести ООО на УСН",
  "privacy": true,
  "source": "https://example.ru/"
}
```

Backend:

- принимает только `POST /api/send`;
- хранит `TELEGRAM_BOT_TOKEN` и `TELEGRAM_CHAT_ID` только на сервере в `.env`;
- валидирует обязательные поля и согласие с политикой;
- очищает управляющие символы, убирает `<`/`>`, ограничивает длину полей;
- экранирует текст перед отправкой в Telegram HTML-сообщением;
- возвращает JSON с кодом `200` при успехе и понятные ошибки при неудаче.

## Быстрый старт

### Требования
- Node.js 18+ (проверить: `node --version`)
- Telegram-бот с токеном (получить через [@BotFather](https://t.me/BotFather))
- Cloudflare Turnstile ключи (опционально, для защиты от спама)
- Яндекс.Метрика счётчик (опционально, для аналитики)

### Установка

1. **Клонируйте репозиторий и установите зависимости:**
   ```bash
   cd /путь/к/проекту
   npm install
   ```

2. **Создайте файл `.env` из примера:**
   ```bash
   cp .env.example .env
   ```

3. **Заполните `.env` файл:**
   ```bash
   # Обязательные параметры
   TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
   TELEGRAM_CHAT_ID=123456789
   PORT=3000

   # Опционально (но рекомендуется)
   TURNSTILE_SECRET_KEY=0x4AAAAAAA...
   ```

4. **Настройте Cloudflare Turnstile (рекомендуется):**
   - Зарегистрируйтесь на https://dash.cloudflare.com/
   - Создайте новый сайт в разделе **Turnstile**
   - Добавьте Site Key в `index.html` (найдите `YOUR_TURNSTILE_SITE_KEY`)
   - Добавьте Secret Key в `.env`
   - В `script.js` измените `turnstileEnabled: false` на `turnstileEnabled: true`

5. **Настройте Яндекс.Метрику (опционально):**
   - Создайте счётчик на https://metrika.yandex.ru/
   - Раскомментируйте код Метрики в `index.html`
   - Замените `ВАШ_ID_СЧЁТЧИКА` на ваш ID
   - Настройте цели: `form_submit`, `phone_click`, `email_click`, `calculator_used`

6. **Замените тестовые контакты на реальные:**
   - Телефон `+79990000000` → ваш номер (3 файла: index.html, thank-you.html, privacy.html)
   - Email `hello@balance-profi.ru` → ваш email (если нужно изменить)
   - ИНН, ОГРН, адрес в `privacy.html`

7. **Создайте OG-изображение:**
   - Создайте изображение 1200×630px с логотипом и названием
   - Сохраните как `og-image.jpg` в корень проекта

8. **Запустите сервер:**
   ```bash
   npm start
   ```
   Сайт будет доступен по адресу: http://localhost:3000

### Подробная инструкция

Полная документация по настройке всех функций находится в файле **[SETUP.md](./SETUP.md)**.

Там вы найдёте:
- Пошаговую настройку Cloudflare Turnstile
- Интеграцию с Яндекс.Метрикой и настройку целей
- Создание Telegram-бота и получение Chat ID
- Настройку production-окружения с nginx и HTTPS
- Чек-листы для тестирования

## Локальный запуск

Требования: Node.js 18+.

1. Установите зависимости:

```bash
npm install
```

2. Создайте `.env` из примера:

```bash
cp .env.example .env
```

3. Заполните `.env`:

```text
TELEGRAM_BOT_TOKEN=123456:telegram-bot-token
TELEGRAM_CHAT_ID=123456789
PORT=3000
```

4. Запустите сервер:

```bash
npm start
```

5. Откройте сайт:

```text
http://localhost:3000
```

## Развертывание на Linux-сервере с Nginx

Пример ниже предполагает, что проект находится в `/var/www/balance-profi`, backend слушает `127.0.0.1:3000`, а Nginx принимает внешние запросы.

### 1. Подготовить проект

```bash
cd /var/www/balance-profi
npm install --omit=dev
cp .env.example .env
nano .env
```

В `.env` укажите:

```text
TELEGRAM_BOT_TOKEN=...
TELEGRAM_CHAT_ID=...
PORT=3000
```

### 2. Запустить backend через systemd

В репозитории есть пример unit-файла: `deploy/balance-profi.service`.

```bash
sudo cp deploy/balance-profi.service /etc/systemd/system/balance-profi.service
sudo systemctl daemon-reload
sudo systemctl enable --now balance-profi
sudo systemctl status balance-profi
```

Если путь проекта, пользователь или Node.js отличаются, поправьте `WorkingDirectory`, `EnvironmentFile`, `ExecStart`, `User` и `Group` в unit-файле.

### 3. Настроить Nginx reverse proxy

Минимальный конфиг:

```nginx
server {
    listen 80;
    server_name example.ru www.example.ru;

    root /var/www/balance-profi;
    index index.html;

    gzip on;
    gzip_types text/plain text/css application/javascript application/json text/html;

    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;

    location /api/send {
        proxy_pass http://127.0.0.1:3000/api/send;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 15s;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Проверка и перезагрузка Nginx:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

Для production включите HTTPS через Certbot или другой ACME-клиент.

## Оптимизация, скорость и ИБ

Что уже сделано:

- сайт отдаётся как статические файлы, а backend обрабатывает только `/api/send`;
- внешний шрифт заменён на системный стек, чтобы убрать лишние сетевые запросы и передачу данных третьей стороне;
- скрипт подключён с `defer`, не блокирует первичный рендеринг страницы;
- добавлен базовый `Content-Security-Policy` без `upgrade-insecure-requests`, чтобы тестовый HTTP-стенд не ломался;
- Telegram-токен не попадает в браузерный JavaScript и читается только сервером из `.env`;
- backend работает без внешних npm-зависимостей, ограничивает размер JSON до `16kb`, валидирует и очищает данные;
- форма использует HTML5-валидацию, `maxlength` для текстовых полей и обязательное согласие с политикой.

Рекомендации для production:

- включите HTTPS и редирект с HTTP на HTTPS;
- храните `.env` вне git и ограничьте права на чтение;
- добавьте rate limiting для `/api/send` на уровне Nginx или backend;
- при спаме подключите CAPTCHA/Turnstile;
- настройте журнал ошибок backend и мониторинг доставки в Telegram;
- включите gzip или brotli-сжатие для `html`, `css`, `js`, `json`;
- задайте кеширование для статических файлов и аккуратно обновляйте имена файлов при релизах.

## Что ещё можно улучшить

- Добавить блок «Тарифы» с 3 пакетами: «Старт», «Бизнес», «Комплекс» — это поможет пользователю быстрее сравнить варианты до калькулятора.
- Добавить FAQ с ответами про сроки сдачи отчётности, переход от другого бухгалтера, ЭДО и ответственность сторон.
- Добавить мини-квиз перед формой: система налогообложения, оборот, сотрудники, текущие боли — его ответы можно отправлять в Telegram вместе с заявкой.
- Подключить аналитику событий без персональных данных: клики по телефону, отправка формы, использование калькулятора.
- Добавить страницу «Спасибо» после успешной отправки, если понадобится отслеживать конверсии.
