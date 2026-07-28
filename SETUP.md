# Инструкция по настройке и запуску

Этот документ описывает настройку всех новых функций, добавленных в проект.

## Что нового

- ✅ Favicon и метатеги (Open Graph, Twitter Cards)
- ✅ Микроразметка Schema.org для LocalBusiness
- ✅ Cloudflare Turnstile CAPTCHA для защиты от спама
- ✅ robots.txt и sitemap.xml для SEO
- ✅ Страница "Спасибо" после отправки формы
- ✅ Интеграция с Яндекс.Метрикой (с отслеживанием событий)
- ✅ Полноценная политика конфиденциальности по законодательству РФ
- ✅ SEO-оптимизация контента и метатегов

---

## 1. Настройка Cloudflare Turnstile (CAPTCHA)

### Получение ключей

1. Зарегистрируйтесь на https://dash.cloudflare.com/
2. Перейдите в раздел **Turnstile**
3. Создайте новый сайт:
   - Domain: `balance-profi.ru` (или ваш домен)
   - Widget Mode: **Managed** (рекомендуется)
4. Скопируйте:
   - **Site Key** (публичный ключ)
   - **Secret Key** (секретный ключ)

### Установка ключей

1. Откройте `index.html` и найдите строку:
   ```html
   <div class="cf-turnstile" data-sitekey="YOUR_TURNSTILE_SITE_KEY" data-callback="onTurnstileSuccess"></div>
   ```
   Замените `YOUR_TURNSTILE_SITE_KEY` на ваш Site Key.

2. Добавьте в `.env` файл:
   ```bash
   TURNSTILE_SECRET_KEY=ваш_секретный_ключ
   ```

3. В файле `script.js` измените:
   ```javascript
   turnstileEnabled: false, // Было
   turnstileEnabled: true,  // Стало
   ```

### Тестирование

Для тестирования можно использовать специальные тестовые ключи Cloudflare:
- **Site Key**: `1x00000000000000000000AA`
- **Secret Key**: `1x0000000000000000000000000000000AA`

Эти ключи всегда проходят проверку в режиме разработки.

---

## 2. Настройка Яндекс.Метрики

### Создание счётчика

1. Зайдите на https://metrika.yandex.ru/
2. Нажмите **Добавить счётчик**
3. Заполните данные:
   - Название: `Баланс Профи`
   - Адрес сайта: `https://balance-profi.ru`
   - Часовой пояс: `Москва`
4. Включите опции:
   - ✅ Вебвизор
   - ✅ Карта кликов
   - ✅ Отслеживание хеша
5. Сохраните и скопируйте **ID счётчика** (например, `12345678`)

### Установка кода

1. Откройте `index.html`
2. Найдите закомментированный блок `<!-- Яндекс.Метрика -->`
3. Раскомментируйте его (удалите `<!--` и `-->`)
4. Замените `ВАШ_ID_СЧЁТЧИКА` на ваш реальный ID счётчика (дважды в коде)

**Пример:**
```javascript
ym(12345678, "init", {
    clickmap:true,
    trackLinks:true,
    accurateTrackBounce:true,
    webvisor:true,
    ecommerce:"dataLayer"
});
```

И в noscript:
```html
<img src="https://mc.yandex.ru/watch/12345678" style="position:absolute; left:-9999px;" alt="" />
```

5. Откройте `thank-you.html` и замените `YANDEX_METRIKA_ID` на ваш ID:
   ```javascript
   if (typeof ym !== 'undefined') {
     ym(12345678, 'reachGoal', 'form_submit');
   }
   ```

6. В `script.js` добавьте глобальную переменную в начале файла:
   ```javascript
   window.YANDEX_METRIKA_ID = 12345678; // Ваш ID
   ```

### Настройка целей в Яндекс.Метрике

После установки кода настройте цели для отслеживания конверсий:

1. Зайдите в настройки счётчика → **Цели**
2. Создайте следующие цели типа **JavaScript-событие**:

| Название цели | Идентификатор цели | Описание |
|---------------|-------------------|----------|
| Отправка формы | `form_submit` | Пользователь отправил заявку |
| Клик по телефону | `phone_click` | Клик по ссылке с телефоном |
| Клик по email | `email_click` | Клик по ссылке с email |
| Использование калькулятора | `calculator_used` | Пользователь взаимодействовал с калькулятором |

---

## 3. Настройка переменных окружения (.env)

Создайте файл `.env` в корне проекта:

```bash
cp .env.example .env
```

Заполните все переменные:

```bash
# Telegram Bot (обязательно)
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_CHAT_ID=123456789

# Cloudflare Turnstile (опционально, но рекомендуется)
TURNSTILE_SECRET_KEY=0x4AAAAAAA...

# Порт сервера
PORT=3000
```

### Как получить Telegram Bot Token

1. Откройте Telegram и найдите бота [@BotFather](https://t.me/BotFather)
2. Отправьте команду `/newbot`
3. Придумайте имя бота (например, `Баланс Профи Заявки`)
4. Придумайте username бота (например, `balance_profi_leads_bot`)
5. Скопируйте токен, который выдаст BotFather

### Как получить Chat ID

**Вариант 1: Через бота**
1. Найдите бота [@userinfobot](https://t.me/userinfobot)
2. Нажмите **Start**
3. Бот пришлёт ваш Chat ID

**Вариант 2: Через группу**
1. Создайте группу в Telegram
2. Добавьте в неё вашего бота (созданного через BotFather)
3. Откройте в браузере: `https://api.telegram.org/bot<ВАШ_ТОКЕН>/getUpdates`
4. Найдите в ответе `"chat":{"id":-123456789}` — это Chat ID группы

---

## 4. Обновление политики конфиденциальности

В файле `privacy.html` замените плейсхолдеры на реальные данные вашей компании:

1. **ИНН компании** (строка ~30):
   ```html
   ИНН: [укажите ИНН]
   ```

2. **ОГРН компании** (строка ~31):
   ```html
   ОГРН: [укажите ОГРН]
   ```

3. **Юридический адрес** (строка ~32):
   ```html
   Юридический адрес: [укажите адрес]
   ```

Эти данные нужно указать в трёх местах:
- В разделе «1. Основные понятия»
- В разделе «12. Контактная информация»

---

## 5. Настройка sitemap.xml

Откройте `sitemap.xml` и обновите даты последнего изменения:

```xml
<lastmod>2026-07-28</lastmod>
```

Замените на текущую дату в формате `YYYY-MM-DD`.

Если у вас есть дополнительные страницы, добавьте их в sitemap по аналогии:

```xml
<url>
  <loc>https://balance-profi.ru/services.html</loc>
  <lastmod>2026-07-28</lastmod>
  <changefreq>monthly</changefreq>
  <priority>0.8</priority>
</url>
```

---

## 6. Создание OG-изображения

Для корректного отображения ссылок в соцсетях создайте изображение `og-image.jpg`:

**Требования:**
- Размер: **1200×630 пикселей** (стандарт Open Graph)
- Формат: JPG или PNG
- Размер файла: до 8 МБ (рекомендуется до 1 МБ)
- Содержание: логотип компании, название, слоган

**Инструменты для создания:**
- Canva (шаблоны Open Graph): https://www.canva.com/
- Figma (бесплатный редактор): https://www.figma.com/

Сохраните изображение как `og-image.jpg` в корень проекта.

**Альтернатива:** Используйте онлайн-генератор:
- https://www.opengraph.xyz/
- https://metatags.io/

После создания проверьте, как будет выглядеть ссылка:
- Facebook: https://developers.facebook.com/tools/debug/
- Telegram: просто отправьте ссылку в Saved Messages

---

## 7. Замена тестовых контактов

В проекте используются тестовые контакты. Замените их на реальные:

### Телефон: `+79990000000`

**Где заменить:**
- `index.html` (3 места):
  - Строка ~183: `<a class="button" href="tel:+79990000000">`
  - Строка ~217: логотип в футере (не требует замены)
  - Schema.org (строка ~244): `"telephone": "+7-999-000-00-00"`
- `thank-you.html` (строка ~34):
  - `<a href="tel:+79990000000" style="color: var(--green); font-weight: 700;">+7 999 000-00-00</a>`
- `privacy.html` (строка ~177):
  - `<a href="tel:+79990000000">+7 999 000-00-00</a>`

### Email: `hello@balance-profi.ru`

Этот email используется во всех файлах и, скорее всего, уже корректный. Если нужно изменить:

**Где заменить:**
- `index.html` (строки ~184, ~244)
- `thank-you.html` (нет упоминаний email)
- `privacy.html` (строки ~176, ~129)
- `script.js` (строка ~86)
- `server.js` (не используется в коде)

---

## 8. Запуск проекта

### Локальный запуск

```bash
# 1. Установите зависимости (если ещё не установлены)
npm install

# 2. Создайте .env файл
cp .env.example .env

# 3. Заполните .env (см. раздел 3)
nano .env

# 4. Запустите сервер
npm start
```

Сайт будет доступен по адресу: http://localhost:3000

### Production-запуск на сервере

См. раздел **"Развертывание на Linux-сервере с Nginx"** в `README.md`.

**Важные дополнения для production:**

1. **Обновите nginx конфиг** — добавьте обработку новых файлов:
   ```nginx
   location = /robots.txt {
       access_log off;
       log_not_found off;
   }

   location = /sitemap.xml {
       access_log off;
       log_not_found off;
   }

   location = /favicon.svg {
       access_log off;
       expires 1y;
       add_header Cache-Control "public, immutable";
   }
   ```

2. **Настройте HTTPS** через Let's Encrypt:
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d balance-profi.ru -d www.balance-profi.ru
   ```

3. **Проверьте права на .env**:
   ```bash
   chmod 600 .env
   chown www-data:www-data .env
   ```

---

## 9. Тестирование

### Чек-лист перед запуском

- [ ] Все контакты заменены на реальные (телефон, email)
- [ ] `.env` файл заполнен корректными данными
- [ ] Telegram бот отправляет заявки в нужный чат
- [ ] Turnstile CAPTCHA включена и работает
- [ ] Яндекс.Метрика установлена и цели настроены
- [ ] OG-изображение создано и загружено
- [ ] Политика конфиденциальности содержит реальные ИНН/ОГРН/адрес
- [ ] sitemap.xml содержит актуальные даты
- [ ] Сайт доступен по HTTPS (для production)

### Как протестировать форму

1. Откройте сайт
2. Прокрутите до секции "Связаться с нами"
3. Заполните форму:
   - Имя: `Тест Тестов`
   - Контакт: `+7 999 123-45-67`
   - Задача: `Тестовая заявка`
   - Поставьте галочку согласия
   - Пройдите CAPTCHA (если включена)
4. Нажмите "Отправить заявку"
5. Должен произойти редирект на страницу `/thank-you.html`
6. Проверьте Telegram — должно прийти сообщение с данными

### Как протестировать Яндекс.Метрику

1. Откройте сайт с включённой Метрикой
2. Зайдите в панель Яндекс.Метрики → **Отчёты в реальном времени**
3. Выполните действия на сайте:
   - Кликните по телефону
   - Кликните по email
   - Измените значение в калькуляторе
   - Отправьте форму
4. Проверьте, что события отображаются в реальном времени

---

## 10. Полезные ссылки

### Для разработки
- Проверка Open Graph: https://www.opengraph.xyz/url/https://balance-profi.ru/
- Проверка микроразметки: https://search.google.com/test/rich-results
- Проверка robots.txt: https://www.google.com/webmasters/tools/robots-testing-tool
- Валидатор HTML: https://validator.w3.org/

### Для аналитики
- Яндекс.Метрика: https://metrika.yandex.ru/
- Google Search Console: https://search.google.com/search-console

### Для SEO
- Проверка скорости: https://pagespeed.web.dev/
- Проверка мобильной версии: https://search.google.com/test/mobile-friendly

---

## Поддержка

Если возникли вопросы или проблемы:

1. Проверьте логи сервера: `journalctl -u balance-profi -n 50`
2. Проверьте логи nginx: `tail -f /var/log/nginx/error.log`
3. Проверьте консоль браузера на наличие ошибок JavaScript

По техническим вопросам пишите на: dev@balance-profi.ru
