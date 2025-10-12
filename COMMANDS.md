# 🎮 KI AGENT SEKRETAR - Alle Commands

## 🚀 **Start & Stop**

### **Automatischer Start (empfohlen)**
```powershell
.\start-all.ps1
```
Startet automatisch:
- Docker Services (PostgreSQL, Redis)
- Datenbank-Migrationen
- Development Server

### **Manueller Start**
```powershell
# 1. Docker Services
docker-compose up -d

# 2. Datenbank initialisieren (nur beim ersten Mal)
npm run db:migrate

# 3. Server starten
npm run dev
```

### **Server stoppen**
```powershell
# Strg+C im Terminal

# Docker Services stoppen
docker-compose down

# Docker Services stoppen + Daten löschen
docker-compose down -v
```

---

## 📦 **NPM Scripts**

### **Development**
```powershell
npm run dev              # Development Server mit Hot Reload
npm run build            # TypeScript kompilieren
npm run start            # Production Server starten
npm run type-check       # TypeScript Typen prüfen (ohne Build)
```

### **Datenbank**
```powershell
npm run db:generate      # Prisma Client generieren
npm run db:push          # Schema zu DB pushen (ohne Migration)
npm run db:migrate       # Migration erstellen und ausführen
npm run db:studio        # Prisma Studio öffnen (Datenbank GUI)
```

### **Testing**
```powershell
npm test                 # Unit Tests ausführen
npm run test:coverage    # Tests mit Coverage Report
npm run test:e2e         # End-to-End Tests
```

### **Code Quality**
```powershell
npm run lint             # ESLint ausführen
npm run lint:fix         # ESLint mit Auto-Fix
```

### **Vercel**
```powershell
npm run postinstall      # Prisma generieren (automatisch bei npm install)
npm run vercel-build     # Build für Vercel Deployment
```

---

## 🐳 **Docker Commands**

### **Container Management**
```powershell
docker-compose up -d              # Services im Hintergrund starten
docker-compose down               # Services stoppen
docker-compose down -v            # Services stoppen + Volumes löschen
docker-compose restart            # Services neu starten
docker-compose ps                 # Laufende Container anzeigen
docker ps                         # Alle laufenden Container
```

### **Logs**
```powershell
docker-compose logs               # Alle Logs anzeigen
docker-compose logs -f            # Logs live verfolgen
docker-compose logs postgres      # Nur PostgreSQL Logs
docker-compose logs redis         # Nur Redis Logs
```

### **Einzelne Services**
```powershell
docker-compose up -d postgres     # Nur PostgreSQL starten
docker-compose up -d redis        # Nur Redis starten
docker-compose restart postgres   # PostgreSQL neu starten
```

### **Cleanup**
```powershell
docker-compose down -v            # Alle Daten löschen
docker system prune -a            # Docker komplett aufräumen
docker volume prune               # Ungenutzte Volumes löschen
```

---

## 🗄️ **Prisma Commands**

### **Schema Management**
```powershell
npx prisma generate               # Client generieren
npx prisma db push                # Schema ohne Migration pushen
npx prisma db pull                # Schema von DB pullen
npx prisma migrate dev            # Migration erstellen und ausführen
npx prisma migrate deploy         # Migrationen in Production ausführen
npx prisma migrate reset          # DB zurücksetzen (VORSICHT!)
```

### **Database Tools**
```powershell
npx prisma studio                 # Prisma Studio öffnen (GUI)
npx prisma db seed                # Seed-Daten einfügen
npx prisma validate               # Schema validieren
npx prisma format                 # Schema formatieren
```

### **Debugging**
```powershell
npx prisma db execute --stdin     # SQL direkt ausführen
npx prisma db execute --file query.sql
```

---

## 🌐 **ngrok Commands**

### **Basis**
```powershell
ngrok http 3000                   # Tunnel zu localhost:3000
ngrok http 3000 --region eu       # Mit EU-Region
ngrok http 3000 --log=stdout      # Mit Logs im Terminal
```

### **Mit Subdomain (bezahlter Plan)**
```powershell
ngrok http 3000 --subdomain=my-secretary
```

### **Konfiguration**
```powershell
ngrok config add-authtoken <token>    # Auth Token setzen
ngrok config check                     # Konfiguration prüfen
ngrok config edit                      # Konfiguration bearbeiten
```

### **PowerShell Script (empfohlen)**
```powershell
.\start-ngrok.ps1                 # Startet ngrok mit Logging
```

---

## 🧪 **Test Commands**

### **Unit Tests**
```powershell
npm test                          # Alle Tests
npm test -- intent                # Nur Intent-Tests
npm test -- --watch               # Watch Mode
npm test -- --coverage            # Mit Coverage
```

### **Integration Tests**
```powershell
npm run test:e2e                  # E2E Tests
```

### **Manuelle Tests**
```powershell
# Health Check
curl http://localhost:3000/health

# Detailed Health Check
curl http://localhost:3000/health/detailed

# API Status (Vercel Endpoint)
curl http://localhost:3000/api/status
```

---

## 🔍 **Debugging Commands**

### **Logs anzeigen**
```powershell
# Server Logs (im Terminal wo npm run dev läuft)

# Docker Logs
docker-compose logs -f

# ngrok Requests (Browser)
start http://127.0.0.1:4040
```

### **Datenbank prüfen**
```powershell
# Prisma Studio öffnen
npm run db:studio

# PostgreSQL direkt verbinden
docker exec -it ki-agent-sekretar-postgres-1 psql -U postgres -d whatsapp_ai_secretary
```

### **Redis prüfen**
```powershell
# Redis CLI öffnen
docker exec -it ki-agent-sekretar-redis-1 redis-cli

# Redis Keys anzeigen
docker exec -it ki-agent-sekretar-redis-1 redis-cli KEYS "*"
```

### **Environment Variables prüfen**
```powershell
.\check-env.ps1                   # Prüft alle erforderlichen Variablen
```

---

## 🛠️ **Maintenance Commands**

### **Dependencies aktualisieren**
```powershell
npm update                        # Dependencies aktualisieren
npm outdated                      # Veraltete Packages anzeigen
npm audit                         # Security Audit
npm audit fix                     # Security Fixes anwenden
```

### **Cache leeren**
```powershell
npm cache clean --force           # NPM Cache leeren
rm -r node_modules                # node_modules löschen
rm package-lock.json              # Lock-File löschen
npm install                       # Neu installieren
```

### **Build-Artefakte löschen**
```powershell
rm -r dist                        # Build-Ordner löschen
rm -r .tmp                        # Temporäre Dateien löschen
npm run build                     # Neu builden
```

---

## 🚀 **Deployment Commands**

### **Vercel**
```powershell
# Vercel CLI installieren
npm i -g vercel

# Login
vercel login

# Deploy
vercel                            # Deploy zu Preview
vercel --prod                     # Deploy zu Production

# Environment Variables
vercel env add                    # Variable hinzufügen
vercel env ls                     # Variablen auflisten
vercel env rm                     # Variable löschen
```

### **Git**
```powershell
git status                        # Status anzeigen
git add .                         # Alle Änderungen stagen
git commit -m "message"           # Commit erstellen
git push origin main              # Zu GitHub pushen
```

---

## 📊 **Monitoring Commands**

### **System Status**
```powershell
# Server Status
curl http://localhost:3000/health

# Detailed Status (mit Dependencies)
curl http://localhost:3000/health/detailed

# Readiness Check
curl http://localhost:3000/health/ready

# Liveness Check
curl http://localhost:3000/health/live
```

### **Performance**
```powershell
# Node.js Memory Usage
node --inspect src/index.ts

# Docker Stats
docker stats

# PostgreSQL Performance
docker exec -it ki-agent-sekretar-postgres-1 psql -U postgres -c "SELECT * FROM pg_stat_activity;"
```

---

## 🔐 **Security Commands**

### **API Keys prüfen**
```powershell
# OpenAI API Key testen
curl https://api.openai.com/v1/models -H "Authorization: Bearer $env:OPENAI_API_KEY"

# Twilio Credentials testen
curl -X GET "https://api.twilio.com/2010-04-01/Accounts/$env:TWILIO_ACCOUNT_SID.json" -u "$env:TWILIO_ACCOUNT_SID:$env:TWILIO_AUTH_TOKEN"
```

### **Environment Variables validieren**
```powershell
.\check-env.ps1                   # Alle Variablen prüfen
```

---

## 📝 **Nützliche Kombinationen**

### **Kompletter Neustart**
```powershell
# Alles stoppen
docker-compose down -v
taskkill /F /IM node.exe

# Neu starten
.\start-all.ps1
```

### **Fresh Install**
```powershell
# Alles löschen
rm -r node_modules, dist, .tmp
docker-compose down -v

# Neu aufsetzen
npm install
docker-compose up -d
npm run db:migrate
npm run build
npm run dev
```

### **Schneller Test-Zyklus**
```powershell
# Terminal 1: Server
npm run dev

# Terminal 2: ngrok
ngrok http 3000

# Terminal 3: Tests
npm test -- --watch
```

---

## 🆘 **Troubleshooting Commands**

### **Port bereits belegt**
```powershell
# Prozess auf Port 3000 finden
netstat -ano | findstr :3000

# Prozess beenden
taskkill /PID <PID> /F
```

### **Docker Probleme**
```powershell
# Docker neu starten
docker-compose restart

# Docker komplett neu aufsetzen
docker-compose down -v
docker system prune -a
docker-compose up -d
```

### **Prisma Probleme**
```powershell
# Prisma Client neu generieren
rm -r node_modules/.prisma
npx prisma generate

# Datenbank zurücksetzen
npx prisma migrate reset
npx prisma migrate dev
```

---

## 📚 **Hilfe & Dokumentation**

```powershell
# NPM Scripts anzeigen
npm run

# Docker Compose Hilfe
docker-compose --help

# Prisma Hilfe
npx prisma --help

# ngrok Hilfe
ngrok help
```

---

**Tipp**: Alle PowerShell-Scripts können mit `Get-Help` angezeigt werden:
```powershell
Get-Help .\start-all.ps1
Get-Help .\check-env.ps1
```

