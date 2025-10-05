# KI AGENT SEKRETAR — Быстрый старт (Windows, PowerShell)

Это пошаговая инструкция «с нуля до первого ответа в WhatsApp». Делай по порядку.

---

## 0) Перед началом — проверь, что установлено
- **Node.js 20+**: `node -v` → должно показать v20.x (или выше)
- **Docker Desktop**: `docker --version`
- **ngrok**: `ngrok --version` и `ngrok config add-authtoken <твой_токен>` (делается один раз)

Полезно иметь: **VS Code** (редактор), **Git** (не обязательно).

---

## 1) Зайди в корень проекта
```powershell
cd "C:\Users\impor\KI AGENT SEKRETAR"
```

---

## 2) Поднять Postgres и Redis (если не подняты)
Проверь:
```powershell
docker ps
```
Если контейнеров нет, подними:
```powershell
docker run -d --name pg -e POSTGRES_PASSWORD=pass -p 5432:5432 postgres:15
docker run -d --name redis -p 6379:6379 redis:7
```

> ❗ Если в твоём `.env` порт базы **5433**, а контейнер проброшен на **5432**, либо:
> - поменяй `.env` на `...@127.0.0.1:5432/...`, либо
> - пересоздай контейнер Postgres на 5433:
>   ```powershell
>   docker rm -f pg
>   docker run -d --name pg -e POSTGRES_PASSWORD=pass -p 5433:5432 postgres:15
>   ```
>   и в `.env`: `DATABASE_URL=...@127.0.0.1:5433/...&sslmode=disable`

Проверь доступ к базе:
```powershell
docker exec -it pg psql -U postgres -d postgres -c "SELECT version();"
```

---

## 3) Настрой `.env`
Создай/открой `.env` и проверь **минимальные** переменные:
```
OPENAI_API_KEY=...

TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_WHATSAPP_NUMBER=whatsapp:+1XXXXXXXXXX

DATABASE_URL=postgresql://postgres:pass@127.0.0.1:5432/postgres?schema=public&sslmode=disable
REDIS_URL=redis://localhost:6379
ENCRYPTION_KEY=<32-байта base64, см. ниже>

# Голосовые ответы (необязательно)
ELEVENLABS_API_KEY=...
```
Сгенерировать `ENCRYPTION_KEY` (одна строка):
```powershell
$bytes = New-Object Byte[] 32; [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes); [Convert]::ToBase64String($bytes)
```
Проверь, что Node видит переменные:
```powershell
node -e "console.log(process.env.DATABASE_URL)" -r dotenv/config
```

---

## 4) Установи зависимости и прогоняй Prisma
```powershell
npm install
npx prisma migrate dev
npx prisma generate
```

---

## 5) Запусти сервер
```powershell
npm run dev
```
Оставь это окно **открытым** (тут будут логи). В другом окне проверь:
```powershell
curl http://127.0.0.1:3000/healthz
```
Ожидаемо: статус 200 и `{"status":"ok",...}`.

---

## 6) Проброс наружу (ngrok)
В новом окне:
```powershell
ngrok http 3000
```
Скопируй HTTPS-URL вида:
```
https://<твой-сабдомен>.ngrok-free.dev
```

> Если пишет, что туннель уже запущен — используй старый URL или останови старый процесс в `http://127.0.0.1:4040` (кнопка **Stop**) либо:
> ```powershell
> taskkill /IM ngrok.exe /F
> ngrok http 3000
> ```

---

## 7) Пропиши webhook в Twilio WhatsApp Sandbox
В Twilio Console → **Messaging → Try it out → WhatsApp Sandbox** → **Sandbox Configuration**:
- **When a message comes in** → поставь:
```
https://<твой-ngrok-URL>/webhook/whatsapp
```
Метод: **HTTP POST**, **Save**.

Привяжи свой WhatsApp к песочнице (отправь join-код на номер Twilio, он указан там же).

---

## 8) Первый тест в WhatsApp
Напиши на номер Twilio:
```
Привет! Создай встречу завтра в 14:00 в Zoom на 30 минут.
```
Для голосового ответа добавь:
```
Ответь голосом.
```
(Нужно `ELEVENLABS_API_KEY`.)

Отправь **голосовое** на RU/DE/EN/ZH — ассистент распознает через Whisper и ответит на том же языке.

---

## 9) Логи и диагностика
- Логи сервера смотри в окне `npm run dev`.
- Логи ngrok и последние вызовы: `http://127.0.0.1:4040`.
- Логи доставки в Twilio: **Console → Logs → Messaging** (ищи код 200).

---

## 10) Частые проблемы и решения
- **Twilio не достучался** → ngrok закрыт или URL сменился → перезапусти ngrok, обнови webhook в Twilio.
- **P1000/P1012 Prisma** → проверь `DATABASE_URL`, контейнер `pg` Up, пароль `pass`, порт совпадает.
- **OpenAI 401/429** → проверь ключ и Billing.
- **Голос не приходит** → проверь `ELEVENLABS_API_KEY`, и что в сообщении просишь «ответь голосом».
- **Подпись Twilio (401/403)** → верный `TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN`, метод POST, точный путь `/webhook/whatsapp`.

---

## 11) Перезапуск сервера
В окне сервера: **Ctrl+C** → `Y` → снова `npm run dev`.
После правок в `.env` — перезапусти сервер.

---

## 12) Следующие шаги (календарь/почта/Zoom)
- Заполни `ZOOM_*` и пройди `/oauth/zoom` (или кнопку в UI).
- Заполни `GOOGLE_*` и пройди `/oauth/google` (включи Google Calendar/Gmail API).
- Заполни `MS_*` и пройди `/oauth/microsoft` (Graph permissions: Calendars.ReadWrite, Mail.ReadWrite, Mail.Send, и т.д.).
После подключения проверь: «Создай встречу завтра в 14:00 в Zoom».

---

## 13) Безопасность (важно)
- Ключи **никому не отправлять**. То, что уже утекло — **ротируй** (создай новые).
- `.env` не коммить в репозиторий. Держи только `.env.example` без секретов.
