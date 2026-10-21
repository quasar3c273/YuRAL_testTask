# Поиск автозапчастей

React, Redux Toolkit, JavaScript и Bootstrap. Введите артикул, выберите производителя и получите таблицу аналогов и предложений с ценами и остатками по складам.

## Установка

Требуется Node.js 22.12+ и npm или pnpm.

```sh
npm install
```

## Деморежим

Работает без ключа и запросов к API:

```sh
npm run dev:demo
```

Цены, остатки и связи товаров между брендами вымышлены.

## Работа с API

Скопируйте `.env.example` в `.env` и заполните настройки:

```dotenv
VITE_API_KEY=ваш_ключ
VITE_DEMO_MODE=false
```

Ключ покупателя получить из ЛК

```sh
npm run dev
```

При вводе артикула начнутся реальные запросы. Чтобы включить деморежим через `.env`, задайте `VITE_DEMO_MODE=true`. После изменения настроек перезапустите сервер.

Команда `dev:demo` всегда включает деморежим.

## Команды npm и pnpm

| Действие | npm | pnpm |
| --- | --- | --- |
| Установка зависимостей | `npm install` | `pnpm install` |
| Обычный запуск | `npm run dev` | `pnpm dev` |
| Деморежим | `npm run dev:demo` | `pnpm dev:demo` |
| Тесты без API | `npm test` | `pnpm test` |
| Сборка | `npm run build` | `pnpm build` |
| Сборка деморежима | `npm run build:demo` | `pnpm build:demo` |
| Просмотр сборки | `npm run preview` | `pnpm preview` |
