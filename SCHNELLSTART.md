# ⚡ KI AGENT SEKRETAR - Schnellstart-Anleitung

## 🎯 **In 10 Minuten zum ersten Test**

### **Schritt 1: Docker starten** (2 Min)
```powershell
# Docker Desktop über Windows-Startmenü starten
# Warten bis Docker-Icon grün ist
docker ps  # Testen
```

---

### **Schritt 2: API-Keys eintragen** (3 Min)
```powershell
# .env Datei erstellen
cp env.example .env
notepad .env
```

**Minimal erforderlich**:
```env
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxx
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxx
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

**Wo bekomme ich die Keys?**
- OpenAI: https://platform.openai.com/api-keys
- Twilio: https://console.twilio.com/ (Dashboard)

---

### **Schritt 3: Datenbank starten** (2 Min)
```powershell
# PostgreSQL + Redis starten
docker-compose up -d

# Datenbank initialisieren
npm run db:migrate
```

---

### **Schritt 4: Server starten** (1 Min)
```powershell
# Backend starten
npm run dev
```

**Erwartete Ausgabe**:
```
🚀 WhatsApp AI Secretary Server running on port 3000
```

---

### **Schritt 5: ngrok starten** (2 Min)
```powershell
# In NEUEM Terminal-Fenster
ngrok http 3000

# URL kopieren (z.B. https://abc123.ngrok.io)
```

---

### **Schritt 6: Twilio Webhook konfigurieren** (1 Min)
1. Öffne: https://console.twilio.com/
2. Messaging → WhatsApp Sandbox Settings
3. "When a message comes in": `https://abc123.ngrok.io/webhook/whatsapp`
4. Save

---

### **Schritt 7: WhatsApp Sandbox beitreten** (1 Min)
1. WhatsApp öffnen
2. Sandbox-Code an Twilio-Nummer senden (aus Console)
3. Bestätigung erhalten

---

### **Schritt 8: Erste Nachricht senden!** 🎉
```
Hallo!
```

**Erwartete Antwort**: Begrüßung vom KI-Sekretär

---

## 🧪 **Test-Nachrichten**

### **Deutsch**
```
Hallo!
Erstelle einen Termin für morgen um 14:00 Uhr
Erstelle eine Aufgabe: Bericht schreiben
```

### **Englisch**
```
Hello!
Create a meeting for tomorrow at 2 PM
Add task: Write report
```

### **Russisch**
```
Привет!
Создай встречу завтра в 14:00
```

---

## ❌ **Probleme?**

### **Server startet nicht**
```powershell
# Dependencies neu installieren
npm install
```

### **Docker Fehler**
```powershell
# Docker Desktop neu starten
# Dann:
docker-compose down
docker-compose up -d
```

### **Keine WhatsApp-Antwort**
1. ✅ Server läuft? (Terminal prüfen)
2. ✅ ngrok läuft? (anderes Terminal)
3. ✅ Webhook URL korrekt in Twilio?
4. ✅ Sandbox beigetreten?

**ngrok Dashboard**: http://127.0.0.1:4040 (zeigt alle Requests)

---

## 📊 **Status prüfen**

```powershell
# Health Check
curl http://localhost:3000/health

# Docker Container
docker ps

# Server Logs
# Im Terminal wo "npm run dev" läuft
```

---

## 🎯 **Nächste Schritte**

Nach erfolgreichem Test:
1. 📖 Vollständige Setup-Anleitung: `PROJEKT_SETUP_TODO.md`
2. 🔧 Weitere Integrationen aktivieren (Google, Microsoft, etc.)
3. 🎨 Web UI starten: `cd web && npm start`
4. ☁️ Vercel Deployment vorbereiten

---

**Viel Erfolg! 🚀**

