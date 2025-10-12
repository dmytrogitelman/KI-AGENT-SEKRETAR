# 🚀 KI AGENT SEKRETAR - Setup & Start To-Do Liste

## ✅ **PROJEKT STATUS**
- ✅ Build erfolgreich (keine TypeScript-Fehler)
- ✅ Alle Dependencies installiert
- ✅ Prisma Schema vorhanden
- ✅ Docker Compose Konfiguration vorhanden
- ⚠️ Docker Desktop muss gestartet werden
- ⚠️ Umgebungsvariablen müssen konfiguriert werden

---

## 📋 **SETUP TO-DO LISTE**

### **Phase 1: Grundlegende Infrastruktur** ⚡ PRIORITÄT HOCH

#### ☐ **1.1 Docker Desktop starten**
```powershell
# Docker Desktop manuell starten (Windows-Startmenü)
# Warten bis Docker vollständig gestartet ist
docker ps  # Testen ob Docker läuft
```
**Status**: ⚠️ Docker ist installiert aber nicht gestartet  
**Wichtigkeit**: KRITISCH - Ohne Docker keine Datenbank/Redis

---

#### ☐ **1.2 Umgebungsvariablen konfigurieren**
```powershell
# .env Datei erstellen
cp env.example .env

# .env Datei bearbeiten mit echten API-Keys
notepad .env
```

**Erforderliche API-Keys** (Mindestanforderungen für Start):
- ✅ **OPENAI_API_KEY** - KRITISCH für KI-Funktionen
- ✅ **TWILIO_ACCOUNT_SID** - KRITISCH für WhatsApp
- ✅ **TWILIO_AUTH_TOKEN** - KRITISCH für WhatsApp
- ✅ **TWILIO_WHATSAPP_NUMBER** - KRITISCH für WhatsApp
- ⚠️ **DATABASE_URL** - Wird automatisch gesetzt wenn Docker läuft
- ⚠️ **REDIS_URL** - Wird automatisch gesetzt wenn Docker läuft

**Optionale API-Keys** (für erweiterte Funktionen):
- ⭕ **ELEVENLABS_API_KEY** - Für Text-zu-Sprache (optional)
- ⭕ **AZURE_TTS_KEY** - Fallback TTS (optional)
- ⭕ **GOOGLE_CLIENT_ID** - Für Google Calendar/Gmail (optional)
- ⭕ **MS_CLIENT_ID** - Für Microsoft 365 (optional)
- ⭕ **ZOOM_CLIENT_ID** - Für Zoom Meetings (optional)
- ⭕ **TODOIST_TOKEN** - Für Todoist Integration (optional)
- ⭕ **NOTION_TOKEN** - Für Notion Integration (optional)

**Status**: ⚠️ Muss konfiguriert werden  
**Wichtigkeit**: KRITISCH

---

#### ☐ **1.3 Docker Services starten**
```powershell
# PostgreSQL und Redis Container starten
docker-compose up -d

# Prüfen ob Container laufen
docker ps

# Logs anzeigen (bei Problemen)
docker-compose logs -f
```

**Erwartete Container**:
- `postgres` - PostgreSQL Datenbank (Port 5432)
- `redis` - Redis Cache (Port 6379)

**Status**: ⏳ Wartet auf Docker Desktop  
**Wichtigkeit**: KRITISCH

---

#### ☐ **1.4 Datenbank initialisieren**
```powershell
# Prisma Client generieren
npm run db:generate

# Datenbank-Migrationen ausführen
npm run db:migrate

# Optional: Prisma Studio öffnen (Datenbank-GUI)
npm run db:studio
```

**Status**: ⏳ Wartet auf Docker Services  
**Wichtigkeit**: KRITISCH

---

### **Phase 2: API-Keys beschaffen** 🔑

#### ☐ **2.1 OpenAI API Key**
1. Gehe zu: https://platform.openai.com/api-keys
2. Login/Registrierung
3. "Create new secret key" klicken
4. Key kopieren und in `.env` einfügen: `OPENAI_API_KEY=sk-...`
5. Guthaben aufladen (mindestens $5 empfohlen)

**Kosten**: ~$0.002 pro Nachricht (GPT-4o-mini)  
**Status**: ⚠️ Erforderlich  
**Wichtigkeit**: KRITISCH

---

#### ☐ **2.2 Twilio WhatsApp Setup**
1. Gehe zu: https://www.twilio.com/
2. Registrierung/Login
3. Console öffnen: https://console.twilio.com/
4. **WhatsApp Sandbox aktivieren**:
   - Messaging → Try it out → Send a WhatsApp message
   - QR-Code scannen oder Code an WhatsApp-Nummer senden
   - Sandbox-Nummer notieren (z.B. `whatsapp:+14155238886`)
5. **Credentials notieren**:
   - Account SID (auf Dashboard)
   - Auth Token (auf Dashboard)
6. In `.env` eintragen:
   ```env
   TWILIO_ACCOUNT_SID=ACxxxxxxxxxx
   TWILIO_AUTH_TOKEN=xxxxxxxxxx
   TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
   ```

**Kosten**: Sandbox kostenlos, Production ~$0.005 pro Nachricht  
**Status**: ⚠️ Erforderlich  
**Wichtigkeit**: KRITISCH

---

#### ☐ **2.3 ElevenLabs TTS (Optional)**
1. Gehe zu: https://elevenlabs.io/
2. Registrierung/Login
3. Profile → API Keys
4. Key kopieren und in `.env`: `ELEVENLABS_API_KEY=...`

**Kosten**: 10.000 Zeichen/Monat kostenlos  
**Status**: ⭕ Optional  
**Wichtigkeit**: NIEDRIG (Fallback vorhanden)

---

#### ☐ **2.4 Google Cloud APIs (Optional)**
**Für Google Calendar & Gmail Integration**

1. Gehe zu: https://console.cloud.google.com/
2. Neues Projekt erstellen
3. APIs aktivieren:
   - Google Calendar API
   - Gmail API
4. OAuth 2.0 Credentials erstellen:
   - Credentials → Create Credentials → OAuth client ID
   - Application type: Web application
   - Authorized redirect URIs: `http://localhost:3000/oauth/google/callback`
5. Client ID und Secret in `.env` eintragen

**Status**: ⭕ Optional  
**Wichtigkeit**: NIEDRIG (für Kalender/E-Mail Features)

---

#### ☐ **2.5 Microsoft Graph APIs (Optional)**
**Für Outlook Calendar & Microsoft 365 Integration**

1. Gehe zu: https://portal.azure.com/
2. Azure Active Directory → App registrations
3. New registration
4. API permissions hinzufügen:
   - Microsoft Graph → Calendars.ReadWrite
   - Microsoft Graph → Mail.ReadWrite
5. Certificates & secrets → New client secret
6. Client ID und Secret in `.env` eintragen

**Status**: ⭕ Optional  
**Wichtigkeit**: NIEDRIG

---

### **Phase 3: Webhook Setup** 🌐

#### ☐ **3.1 ngrok installieren**
```powershell
# Option 1: Mit Chocolatey
choco install ngrok

# Option 2: Manuell von https://ngrok.com/download
# Herunterladen und in PATH einfügen
```

**Status**: ⚠️ Erforderlich für WhatsApp-Tests  
**Wichtigkeit**: HOCH

---

#### ☐ **3.2 ngrok Account erstellen**
1. Gehe zu: https://dashboard.ngrok.com/signup
2. Registrierung
3. Authtoken kopieren
4. Authtoken konfigurieren:
   ```powershell
   ngrok config add-authtoken <your-token>
   ```

**Status**: ⚠️ Erforderlich  
**Wichtigkeit**: HOCH

---

#### ☐ **3.3 ngrok starten**
```powershell
# In separatem Terminal-Fenster
ngrok http 3000

# Oder mit PowerShell-Script
.\start-ngrok.ps1
```

**Wichtig**: 
- ngrok URL notieren (z.B. `https://abc123.ngrok.io`)
- URL ändert sich bei jedem Start (außer mit bezahltem Plan)
- Terminal-Fenster offen lassen!

**Status**: ⏳ Wartet auf Server-Start  
**Wichtigkeit**: HOCH

---

#### ☐ **3.4 Twilio Webhook konfigurieren**
1. Gehe zu: https://console.twilio.com/
2. Messaging → Try it out → WhatsApp Sandbox Settings
3. **Webhook URL eintragen**:
   - When a message comes in: `https://abc123.ngrok.io/webhook/whatsapp`
   - HTTP Method: POST
4. Save klicken

**Wichtig**: URL muss bei jedem ngrok-Neustart aktualisiert werden!

**Status**: ⏳ Wartet auf ngrok  
**Wichtigkeit**: HOCH

---

### **Phase 4: Server starten** 🚀

#### ☐ **4.1 Development Server starten**
```powershell
# Backend Server starten
npm run dev

# Server läuft auf http://localhost:3000
```

**Erwartete Ausgabe**:
```
🚀 WhatsApp AI Secretary Server running on port 3000
📱 Environment: development
```

**Status**: ⏳ Wartet auf alle vorherigen Schritte  
**Wichtigkeit**: KRITISCH

---

#### ☐ **4.2 Health Check testen**
```powershell
# In neuem Terminal
curl http://localhost:3000/health

# Oder im Browser öffnen
start http://localhost:3000/health
```

**Erwartete Antwort**:
```json
{
  "status": "ok",
  "timestamp": "2025-10-12T...",
  "uptime": 123.45,
  "version": "1.0.0"
}
```

**Status**: ⏳ Wartet auf Server  
**Wichtigkeit**: HOCH

---

#### ☐ **4.3 Web UI starten (Optional)**
```powershell
# In neuem Terminal
cd web
npm install
npm start

# Web UI läuft auf http://localhost:3001
```

**Status**: ⭕ Optional  
**Wichtigkeit**: NIEDRIG (für Monitoring)

---

### **Phase 5: Erste Tests** 🧪

#### ☐ **5.1 WhatsApp Sandbox beitreten**
1. WhatsApp öffnen
2. Sandbox-Code an Twilio-Nummer senden (aus Twilio Console)
3. Bestätigung erhalten: "You are all set!"

**Status**: ⏳ Wartet auf Twilio Setup  
**Wichtigkeit**: HOCH

---

#### ☐ **5.2 Erste Textnachricht testen**
**Test 1 - Begrüßung (Deutsch)**:
```
Hallo!
```
**Erwartete Antwort**: Begrüßung vom KI-Sekretär

**Test 2 - Termin erstellen (Deutsch)**:
```
Erstelle einen Termin für morgen um 14:00 Uhr
```

**Test 3 - Aufgabe erstellen (Deutsch)**:
```
Erstelle eine Aufgabe: Bericht schreiben
```

**Test 4 - Mehrsprachig (Englisch)**:
```
Create a meeting for tomorrow at 2 PM
```

**Status**: ⏳ Wartet auf Server & Webhook  
**Wichtigkeit**: HOCH

---

#### ☐ **5.3 Sprachnachricht testen**
1. WhatsApp-Sprachnachricht aufnehmen
2. Nachricht senden
3. Transkription und Antwort erhalten

**Hinweis**: Benötigt OPENAI_API_KEY für Whisper STT

**Status**: ⏳ Wartet auf OpenAI Setup  
**Wichtigkeit**: MITTEL

---

#### ☐ **5.4 Logs überprüfen**
```powershell
# Server-Logs im Terminal anzeigen
# Suche nach:
# - "Received message from..."
# - "Intent classified: ..."
# - "Response sent: ..."

# ngrok Logs anzeigen
# Browser: http://127.0.0.1:4040
# Zeigt alle Webhook-Requests
```

**Status**: ⏳ Nach ersten Tests  
**Wichtigkeit**: HOCH (für Debugging)

---

### **Phase 6: Vercel Deployment (Optional)** ☁️

#### ☐ **6.1 Vercel Account erstellen**
1. Gehe zu: https://vercel.com/signup
2. Mit GitHub verbinden
3. Repository importieren

**Status**: ⭕ Optional  
**Wichtigkeit**: NIEDRIG (für Production)

---

#### ☐ **6.2 Environment Variables in Vercel setzen**
1. Vercel Dashboard → Project → Settings → Environment Variables
2. Alle Keys aus `.env` hinzufügen
3. **Wichtig**: Production-Datenbank URL verwenden!

**Status**: ⭕ Optional  
**Wichtigkeit**: NIEDRIG

---

#### ☐ **6.3 Deploy**
```powershell
# Mit Vercel CLI
npm i -g vercel
vercel

# Oder via GitHub Push (automatisches Deployment)
git add .
git commit -m "feat: production ready"
git push origin main
```

**Status**: ⭕ Optional  
**Wichtigkeit**: NIEDRIG

---

## 🔧 **TROUBLESHOOTING**

### **Problem: Docker startet nicht**
```powershell
# Docker Desktop neu starten
# Oder WSL2 aktualisieren
wsl --update
```

---

### **Problem: Prisma Migration schlägt fehl**
```powershell
# Datenbank zurücksetzen
docker-compose down -v
docker-compose up -d
npm run db:push
```

---

### **Problem: Twilio Webhook erhält keine Nachrichten**
1. ✅ ngrok läuft?
2. ✅ Webhook URL in Twilio korrekt?
3. ✅ Server läuft auf Port 3000?
4. ✅ ngrok Dashboard zeigt Requests? (http://127.0.0.1:4040)

---

### **Problem: OpenAI API Fehler**
```powershell
# API Key testen
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $env:OPENAI_API_KEY"

# Guthaben prüfen
# https://platform.openai.com/account/billing/overview
```

---

### **Problem: Build-Fehler**
```powershell
# Dependencies neu installieren
rm -r node_modules
rm package-lock.json
npm install

# TypeScript neu kompilieren
npm run build
```

---

## 📊 **SYSTEM-ANFORDERUNGEN**

### **Software**
- ✅ Node.js 22.20.0 (installiert)
- ✅ npm 10.9.3 (installiert)
- ✅ Docker 28.4.0 (installiert, aber nicht gestartet)
- ⚠️ Docker Desktop (muss gestartet werden)
- ⚠️ ngrok (muss installiert werden)

### **Hardware (Empfohlen)**
- CPU: 4+ Cores
- RAM: 8+ GB
- Disk: 10+ GB frei

### **Netzwerk**
- Internetverbindung (für APIs)
- Offene Ports: 3000, 5432, 6379
- ngrok für Webhook-Tunneling

---

## 📈 **KOSTEN-ÜBERSICHT**

### **Kostenlose Tier**
- ✅ Twilio WhatsApp Sandbox: Kostenlos
- ✅ OpenAI: $5 Startguthaben (bei neuen Accounts)
- ✅ ElevenLabs: 10.000 Zeichen/Monat kostenlos
- ✅ ngrok: Kostenlos (mit Einschränkungen)

### **Geschätzte monatliche Kosten (bei aktiver Nutzung)**
- OpenAI GPT-4o-mini: ~$5-20/Monat (je nach Nutzung)
- Twilio WhatsApp: ~$0.005 pro Nachricht
- ElevenLabs TTS: ~$5/Monat (nach Free Tier)
- Vercel Hosting: Kostenlos (Hobby Plan)
- **Total**: ~$10-30/Monat

---

## 🎯 **SCHNELLSTART-CHECKLISTE**

Minimale Schritte für ersten Test:

1. ☐ Docker Desktop starten
2. ☐ `.env` erstellen und OPENAI_API_KEY + Twilio Credentials eintragen
3. ☐ `docker-compose up -d` ausführen
4. ☐ `npm run db:migrate` ausführen
5. ☐ `npm run dev` starten
6. ☐ ngrok starten: `ngrok http 3000`
7. ☐ Twilio Webhook konfigurieren mit ngrok URL
8. ☐ WhatsApp Sandbox beitreten
9. ☐ Erste Nachricht senden: "Hallo!"

**Geschätzte Zeit**: 30-60 Minuten

---

## 📞 **SUPPORT & HILFE**

### **Logs anzeigen**
```powershell
# Server Logs
# Im Terminal wo npm run dev läuft

# Docker Logs
docker-compose logs -f

# ngrok Requests
# Browser: http://127.0.0.1:4040
```

### **Health Endpoints**
- `http://localhost:3000/health` - Basis Status
- `http://localhost:3000/health/detailed` - Detaillierter Status
- `http://localhost:3000/health/ready` - Readiness Check
- `http://localhost:3000/health/live` - Liveness Check

### **Debugging Tools**
```powershell
# Prisma Studio (Datenbank GUI)
npm run db:studio

# Type Check
npm run type-check

# Linting
npm run lint
```

---

## ✅ **PROJEKT IST BEREIT WENN...**

- ✅ Build erfolgreich: `npm run build`
- ✅ Docker Container laufen: `docker ps`
- ✅ Datenbank erreichbar: `npm run db:studio`
- ✅ Server läuft: `http://localhost:3000/health`
- ✅ ngrok aktiv: `https://xyz.ngrok.io`
- ✅ Twilio Webhook konfiguriert
- ✅ WhatsApp Nachricht empfangen und beantwortet

---

**Viel Erfolg! 🚀**

*Letzte Aktualisierung: 12.10.2025*

