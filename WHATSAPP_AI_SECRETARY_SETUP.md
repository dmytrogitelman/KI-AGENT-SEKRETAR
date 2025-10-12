# WhatsApp AI Secretary - Setup Anleitung

## Übersicht
Dieses System implementiert einen vollständigen WhatsApp AI Secretary mit:
- **Twilio WhatsApp Business API** (Sandbox oder bezahlter Account)
- **OpenAI Whisper STT** für Spracherkennung
- **ElevenLabs TTS** für Sprachsynthese
- **ngrok** für öffentliche HTTPS-URLs

## Pipeline
```
WhatsApp → Twilio Webhook → Express Server → STT (Whisper) → Orchestrator → TTS (ElevenLabs) → WhatsApp Antwort
```

## 1. Umgebungsvariablen konfigurieren

Erstelle eine `.env` Datei im Projektroot:

```env
# ==== TWILIO (обязательно) ====
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
# ПЛАТНЫЙ АККАУНТ (реальный WhatsApp Sender):
# TWILIO_WHATSAPP_NUMBER=whatsapp:+49XXXXXXXXXX
# ИЛИ Песочница Twilio (для тестов):
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# ==== OPENAI (Whisper STT) ====
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# ==== ELEVENLABS (TTS) ====
ELEVENLABS_API_KEY=eleven_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
# Опционально — ID голоса (Rachel):
ELEVENLABS_VOICE_ID=21m00Tcm4TlvDq8ikWAM

# ==== Публичный базовый URL сервера (HTTPS ngrok или домен) ====
# Без конечного слеша. Обновляй при каждом перезапуске ngrok.
PUBLIC_BASE_URL=https://XXXX.ngrok-free.app

# ==== Токен для GET-верификации вебхука (если потребуется) ====
WHATSAPP_VERIFY_TOKEN=any-secret-string

# Server Configuration
PORT=3000
NODE_ENV=development
```

## 2. Server starten

```powershell
cd "C:\Users\purch\KI AGENT SEKRETAR"
npm run dev
```

## 3. ngrok starten

```powershell
# In einem neuen Terminal
& "C:\Users\purch\ngrok.exe" http 3000
```

Kopiere die HTTPS URL (z.B. `https://abc123.ngrok-free.app`)

## 4. Twilio konfigurieren

### Für Sandbox:
1. Gehe zu [Twilio Console](https://console.twilio.com/)
2. Navigiere zu **Messaging → Settings → WhatsApp Sandbox**
3. Setze **Webhook URL** auf: `https://abc123.ngrok-free.app/webhook/whatsapp`
4. Speichere die Konfiguration

### Für bezahlten Account:
1. Gehe zu **Messaging → WhatsApp Senders**
2. Wähle deinen verifizierten WhatsApp Sender
3. Setze **Webhook URL** auf: `https://abc123.ngrok-free.app/webhook/whatsapp`
4. Aktualisiere `.env` mit deiner echten WhatsApp Nummer

## 5. Testen

### Automatischer Test:
```powershell
.\test-ngrok.ps1
```

### Manueller Test:
```powershell
# Health Check
Invoke-WebRequest -Uri "https://abc123.ngrok-free.app/health" -Method GET

# Webhook Test
Invoke-WebRequest -Uri "https://abc123.ngrok-free.app/webhook/whatsapp" -Method POST -ContentType "application/x-www-form-urlencoded" -Body "Body=Привет! Озвучи меня&From=whatsapp:%2B491779640741&To=whatsapp:%2B14155238886"
```

### WhatsApp Test:
1. Sende eine Textnachricht an die Sandbox Nummer
2. Sende eine Sprachnachricht an die Sandbox Nummer
3. Du solltest eine Textantwort + Sprachantwort erhalten

## 6. Funktionalitäten

### Textnachrichten:
- ✅ Echo-Orchestrator antwortet mit "✅ Понял: [dein Text]"
- ✅ TTS generiert MP3-Audio über ElevenLabs
- ✅ Audio wird über `/media/` Route bereitgestellt

### Sprachnachrichten:
- ✅ Twilio Media wird heruntergeladen
- ✅ Whisper STT transkribiert Audio zu Text
- ✅ Echo-Orchestrator verarbeitet transkribierten Text
- ✅ TTS generiert Antwort-Audio

## 7. Troubleshooting

### Twilio Warning 12200:
- Webhook muss `<Response></Response>` zurückgeben ✅

### 63007 (Channel not found):
- Falsche `from` Nummer
- Sandbox: immer `whatsapp:+14155238886`
- Produktion: deine verifizierte WhatsApp Nummer

### ERR_NGROK_3200:
- ngrok nicht aktiv
- Neustart ngrok und URL aktualisieren

### Medien kommen nicht an:
- Prüfe `/media/` Route: `https://abc123.ngrok-free.app/media/dateiname.mp3`
- Prüfe `./tmp` Ordner für generierte Dateien

## 8. API Keys

### OpenAI (Whisper):
- Gehe zu [OpenAI Platform](https://platform.openai.com/)
- Erstelle API Key
- Füge zu `.env` hinzu

### ElevenLabs:
- Gehe zu [ElevenLabs](https://elevenlabs.io/)
- Erstelle Account und API Key
- Füge zu `.env` hinzu

### Twilio:
- Gehe zu [Twilio Console](https://console.twilio.com/)
- Kopiere Account SID und Auth Token
- Füge zu `.env` hinzu

## 9. Erweiterte Konfiguration

### Messaging Service (optional):
```javascript
// In whatsapp.webhook.ts
await twilioClient.messages.create({
  messagingServiceSid: 'MGxxxxxxxxxxxxxxxx', // statt from
  to: From,
  body: replyText,
});
```

### Verschiedene Stimmen:
```env
ELEVENLABS_VOICE_ID=21m00Tcm4TlvDq8ikWAM  # Rachel
ELEVENLABS_VOICE_ID=AZnzlk1XvdvUeBnXmlld  # Domi
ELEVENLABS_VOICE_ID=EXAVITQu4vr4xnSDxMaL  # Bella
```

## 10. Produktions-Deployment

1. Verwende echte Domain statt ngrok
2. Setze `NODE_ENV=production`
3. Konfiguriere SSL-Zertifikat
4. Verwende bezahlten Twilio Account
5. Implementiere echten Orchestrator statt Echo

---

**Status: ✅ Vollständig implementiert und getestet**

