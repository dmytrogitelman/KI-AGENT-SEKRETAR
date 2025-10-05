# WhatsApp AI Secretary — ТЗ для Cursor

Это техническое задание для генерации проекта в Cursor.  
Проект: WhatsApp AI Secretary Agent на Node.js + TypeScript.  
Агент принимает задачи через WhatsApp (текст или голос), понимает любой язык и выполняет функции ИИ-секретаря.

## Основные требования
1. Приём сообщений из WhatsApp (Twilio WhatsApp Business API, Sandbox).  
2. Поддержка текста и голосовых сообщений (STT — OpenAI Whisper).  
3. Автоопределение языка, перевод при необходимости, ответы на языке пользователя.  
4. OpenAI GPT-4o-mini для классификации намерений, планирования и генерации ответов.  
5. Функции секретаря:  
   – Календарь и планирование (Google, Outlook, Zoom).  
   – Почта (Gmail, Microsoft 365).  
   – Задачи и напоминания (Todoist, Notion).  
   – Заметки (Notion, Google Drive).  
   – Контакты.  
   – Напоминания и уведомления.  
6. Голосовые ответы (TTS: ElevenLabs, fallback Azure Speech).  
7. Сохранение истории взаимодействий и предпочтений пользователей.  
8. Все критичные действия требуют подтверждения.  

## Технологический стек
- Node.js 20+, TypeScript, Express/Fastify  
- Twilio WhatsApp API  
- OpenAI GPT-4o-mini, Whisper (STT)  
- ElevenLabs TTS + Azure Speech fallback  
- Google Calendar, Outlook Calendar, Zoom API  
- Gmail API, Microsoft Graph Mail API  
- Todoist API, Notion API  
- Postgres (Prisma ORM)  
- Redis (кеш и сессии)  
- dotenv, Zod  
- Vitest, supertest  
- pino logger, Prometheus metrics  

## Структура проекта
- src/server/routes: whatsapp.webhook.ts, oauth.google.ts, oauth.microsoft.ts, oauth.zoom.ts, health.ts  
- src/services: llm (agent, planner, intent, tools), stt (whisper.ts), tts (elevenlabs.ts, azure.ts), i18n (detect.ts, translate.ts), whatsapp (twilioClient.ts)  
- src/domain: orchestrator.ts, planner.ts, intent.ts, memory.ts  
- src/db: prismaClient.ts, schema.prisma  
- src/web: минимальный UI (React)  
- tests: unit и e2e  
- prisma/schema.prisma, .env.example, README.md  

## Переменные окружения (.env.example)
OPENAI_API_KEY, ELEVENLABS_API_KEY, AZURE_TTS_KEY, AZURE_TTS_REGION, TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_NUMBER, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI, MS_CLIENT_ID, MS_CLIENT_SECRET, MS_REDIRECT_URI, MS_TENANT, ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET, ZOOM_ACCOUNT_ID, ZOOM_REDIRECT_URI, TODOIST_TOKEN, NOTION_TOKEN, DATABASE_URL, REDIS_URL, ENCRYPTION_KEY.

## Поток обработки сообщений
1. Twilio → webhook.  
2. Если аудио → Whisper STT → текст.  
3. Определение языка.  
4. GPT-4o-mini → намерение.  
5. Planner → выбор инструментов.  
6. Вызов адаптеров (Zoom, календарь, email, задачи).  
7. Ответ: текст или TTS-аудио.  

## Примеры сценариев
- RU: «Создай встречу завтра в 14:00 в Zoom».  
- DE: «Bitte erinnere mich jeden Dienstag um 9 an den Report».  
- EN: «Summarize my last 5 emails from Alex and draft a reply».  
- ZH: «下周三下午安排团队会议 Zoom 链接».  

## Тестирование
- Unit-тесты: распознавание намерений, планировщик, адаптеры.  
- Интеграционные тесты: WhatsApp → STT → intent → календарь.  
- E2E: ngrok + Twilio sandbox.  

## README (в проекте)
README должен содержать пошаговые шаги:  
1. Установка Node.js, Docker, ngrok.  
2. Регистрация Twilio, OpenAI, ElevenLabs/Azure, Zoom, Google/Microsoft, Todoist/Notion.  
3. Настройка .env.  
4. Запуск Postgres + Redis.  
5. Prisma миграции.  
6. Запуск сервера `npm run dev`.  
7. Настройка ngrok и Twilio webhook.  
8. Тест в WhatsApp.  

## Результат
Cursor должен сгенерировать полный TypeScript-проект с Prisma schema, .env.example, README с инструкцией, минимальным UI и минимум 10 тестами.
