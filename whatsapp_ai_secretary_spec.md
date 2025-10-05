# 📌 ТЗ для Cursor: WhatsApp AI Secretary (полное)

Ты — эксперт full-stack инженер. Нужно построить production-grade WhatsApp AI Secretary Agent на Node.js 20+ и TypeScript. Агент должен принимать задачи через WhatsApp в виде текста или голосовых сообщений, понимать любой язык (минимум русский, немецкий, английский, китайский), выполнять все функции ИИ-секретаря и выдавать ответы в WhatsApp текстом либо голосом (TTS).

## Основные требования:
1. Приём входящих сообщений из WhatsApp (Twilio WhatsApp Business API, Sandbox для разработки).  
2. Поддержка текста и голосовых сообщений. Голос → расшифровка через OpenAI Whisper (STT).  
3. Определение языка и автоматический перевод при необходимости. Ответы формируются на языке пользователя.  
4. Интеграция с OpenAI GPT-4o-mini для классификации намерений, планирования действий и генерации ответов.  
5. Функции секретаря:  
   – Календарь и планирование (Google Calendar, Microsoft Outlook, Zoom). Проверка занятости, предложение слотов, создание и отмена событий, генерация Zoom-ссылок.  
   – Почта (Gmail и Microsoft 365): чтение, резюмирование, подготовка черновиков писем. Перед отправкой всегда запрашивать подтверждение.  
   – Задачи и напоминания (Todoist и Notion). Поддержка повторяющихся задач на естественном языке.  
   – Заметки и протоколы (Notion или Google Drive). Сохранение резюме и конспектов.  
   – Контакты: поиск, сохранение, запоминание связей.  
   – Напоминания и уведомления.  
6. Поддержка голосового ответа (TTS). По умолчанию использовать ElevenLabs, как резерв – Azure Speech.  
7. Сохранение истории взаимодействий, пользовательских предпочтений и параметров (рабочие часы, язык ответа, способ ответа текст/голос).  
8. Все опасные действия (отправка писем, удаление событий, бронирования) должны выполняться только после подтверждения.  

## Технологический стек:
– Node.js 20+, TypeScript, Express или Fastify.  
– Twilio WhatsApp API.  
– OpenAI GPT-4o-mini и Whisper.  
– ElevenLabs TTS + Azure Speech fallback.  
– Google Calendar API, Microsoft Graph (Outlook Calendar и Mail), Zoom API.  
– Gmail API.  
– Todoist API, Notion API.  
– Postgres (через Prisma ORM) для хранения пользователей, сообщений, предпочтений.  
– Redis для кеша, сессий и очередей.  
– dotenv и Zod для валидации конфигурации.  
– Vitest и supertest для тестов.  
– pino logger, healthcheck endpoint, Prometheus metrics для мониторинга.  

## Структура проекта:
В корне должен быть src с подпапками: server (маршруты, middleware, сервисы), domain (orchestrator, planner, intent, memory), db (prismaClient и schema), utils (env, logger, errors). В server/routes должны быть whatsapp.webhook.ts, oauth.google.ts, oauth.microsoft.ts, oauth.zoom.ts, health.ts. В services – llm (agent, planner, intent, tools), stt (whisper.ts), tts (elevenlabs.ts, azure.ts), i18n (detect.ts, translate.ts), whatsapp (twilioClient.ts). Также должна быть web с минимальным UI (например, React), tests с unit и e2e тестами. В корне – prisma/schema.prisma, .env.example и README.md.  

## Переменные окружения (.env.example):
PORT, NODE_ENV, OPENAI_API_KEY, ELEVENLABS_API_KEY, AZURE_TTS_KEY, AZURE_TTS_REGION, TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_NUMBER, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI, MS_CLIENT_ID, MS_CLIENT_SECRET, MS_REDIRECT_URI, MS_TENANT, ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET, ZOOM_ACCOUNT_ID, ZOOM_REDIRECT_URI, TODOIST_TOKEN, NOTION_TOKEN, DATABASE_URL, REDIS_URL, ENCRYPTION_KEY.  

## Поток обработки сообщений:
1. Twilio передаёт сообщение в webhook.  
2. Если аудио – скачать, расшифровать Whisper, получить текст.  
3. Определить язык.  
4. Через GPT-4o-mini определить намерение: встреча, письмо, задача, заметка, информация.  
5. Planner решает, какие инструменты вызвать.  
6. Выполнить инструменты (например, создать Zoom meeting, подготовить черновик письма).  
7. Сформировать результат и ответить пользователю: текст или TTS-аудио через WhatsApp.  

## Примеры сценариев:
– Русский текст: «Создай встречу завтра в 14:00 в Zoom на 45 минут». → Проверка календаря → создание Zoom → подтверждение → событие создано → ответ голосом.  
– Немецкая голосовая: «Bitte erinnere mich jeden Dienstag um 9 an den Report». → Создание повторяющейся задачи в Todoist → ответ текстом.  
– Английский текст: «Summarize my last 5 emails from Alex and draft a reply». → Резюме → черновик → запрос подтверждения → ответ текстом.  
– Китайский текст: «下周三下午安排团队会议 Zoom 链接». → Проверка слотов → создание Zoom-ссылки → ответ по-китайски.  

## Тесты:
– Unit-тесты: распознавание намерений, планировщик, адаптеры.  
– Интеграционные: цепочка WhatsApp → STT → intent → календарь.  
– E2E: запуск через ngrok и Twilio sandbox, проверка текста и голоса.  

## README (обязательно в проекте):
README должен содержать пошаговую инструкцию для новичка:  
1. Установка Node.js, Docker, ngrok.  
2. Регистрация аккаунтов: Twilio, OpenAI (создание API Key в Dashboard → API Keys), ElevenLabs или Azure TTS, Zoom (OAuth App), Google и Microsoft (API креды), Todoist/Notion.  
3. Настройка .env.  
4. Запуск Postgres и Redis в Docker.  
5. Миграции Prisma.  
6. Запуск локального сервера npm run dev.  
7. Настройка ngrok, подключение webhook в Twilio Sandbox.  
8. Первые тесты (написать в WhatsApp, проверить ответ).  

## Результат:
Cursor должен сгенерировать полный TypeScript-проект с Prisma schema, .env.example, README с пошаговыми шагами, минимальным веб-интерфейсом для проверки статуса и минимум 10 тестами.  
