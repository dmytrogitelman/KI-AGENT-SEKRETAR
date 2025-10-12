# KI AGENT SEKRETAR - Automatischer Start
# Dieses Script startet alle benötigten Services

Write-Host "🚀 KI AGENT SEKRETAR - Automatischer Start" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Funktion zum Prüfen ob ein Befehl existiert
function Test-Command {
    param($Command)
    $null -ne (Get-Command $Command -ErrorAction SilentlyContinue)
}

# 1. Docker prüfen
Write-Host "📦 Schritt 1: Docker prüfen..." -ForegroundColor Yellow
if (-not (Test-Command docker)) {
    Write-Host "❌ Docker ist nicht installiert!" -ForegroundColor Red
    Write-Host "   Bitte Docker Desktop installieren: https://www.docker.com/products/docker-desktop" -ForegroundColor Red
    exit 1
}

# Docker Status prüfen
try {
    docker ps | Out-Null
    Write-Host "✅ Docker läuft" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Docker Desktop ist nicht gestartet!" -ForegroundColor Yellow
    Write-Host "   Bitte Docker Desktop starten und dann dieses Script erneut ausführen." -ForegroundColor Yellow
    Write-Host "   Drücke Enter wenn Docker gestartet ist..." -ForegroundColor Yellow
    Read-Host
}

# 2. .env Datei prüfen
Write-Host ""
Write-Host "🔑 Schritt 2: Umgebungsvariablen prüfen..." -ForegroundColor Yellow
if (-not (Test-Path ".env")) {
    Write-Host "⚠️  .env Datei nicht gefunden!" -ForegroundColor Yellow
    Write-Host "   Erstelle .env aus env.example..." -ForegroundColor Yellow
    Copy-Item "env.example" ".env"
    Write-Host "✅ .env Datei erstellt" -ForegroundColor Green
    Write-Host ""
    Write-Host "⚠️  WICHTIG: Bitte API-Keys in .env eintragen!" -ForegroundColor Red
    Write-Host "   Mindestens erforderlich:" -ForegroundColor Red
    Write-Host "   - OPENAI_API_KEY" -ForegroundColor Red
    Write-Host "   - TWILIO_ACCOUNT_SID" -ForegroundColor Red
    Write-Host "   - TWILIO_AUTH_TOKEN" -ForegroundColor Red
    Write-Host "   - TWILIO_WHATSAPP_NUMBER" -ForegroundColor Red
    Write-Host ""
    Write-Host "   .env Datei jetzt bearbeiten? (J/N)" -ForegroundColor Yellow
    $answer = Read-Host
    if ($answer -eq "J" -or $answer -eq "j") {
        notepad .env
        Write-Host "   Drücke Enter wenn fertig..." -ForegroundColor Yellow
        Read-Host
    }
} else {
    Write-Host "✅ .env Datei gefunden" -ForegroundColor Green
}

# 3. Docker Services starten
Write-Host ""
Write-Host "🐳 Schritt 3: Docker Services starten..." -ForegroundColor Yellow
Write-Host "   Starte PostgreSQL und Redis..." -ForegroundColor Gray
docker-compose up -d

# Warte auf Container
Write-Host "   Warte auf Container..." -ForegroundColor Gray
Start-Sleep -Seconds 5

# Prüfe Container Status
$containers = docker ps --format "{{.Names}}" | Select-String -Pattern "(postgres|redis)"
if ($containers) {
    Write-Host "✅ Docker Services laufen" -ForegroundColor Green
} else {
    Write-Host "⚠️  Docker Services starten fehlgeschlagen" -ForegroundColor Yellow
    Write-Host "   Logs anzeigen: docker-compose logs" -ForegroundColor Yellow
}

# 4. Datenbank initialisieren
Write-Host ""
Write-Host "💾 Schritt 4: Datenbank initialisieren..." -ForegroundColor Yellow

# Prüfe ob Prisma Client existiert
if (-not (Test-Path "node_modules\.prisma")) {
    Write-Host "   Generiere Prisma Client..." -ForegroundColor Gray
    npm run db:generate
}

# Prüfe ob Migrationen existieren
$migrationCount = (Get-ChildItem "prisma\migrations" -Directory -ErrorAction SilentlyContinue).Count
if ($migrationCount -eq 0) {
    Write-Host "   Führe Datenbank-Migrationen aus..." -ForegroundColor Gray
    npm run db:migrate
} else {
    Write-Host "   Migrationen bereits vorhanden" -ForegroundColor Gray
}

Write-Host "✅ Datenbank bereit" -ForegroundColor Green

# 5. Build prüfen
Write-Host ""
Write-Host "🔨 Schritt 5: Build prüfen..." -ForegroundColor Yellow
if (-not (Test-Path "dist")) {
    Write-Host "   Erstelle Build..." -ForegroundColor Gray
    npm run build
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Build erfolgreich" -ForegroundColor Green
    } else {
        Write-Host "❌ Build fehlgeschlagen!" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✅ Build vorhanden" -ForegroundColor Green
}

# 6. Server starten
Write-Host ""
Write-Host "🚀 Schritt 6: Server starten..." -ForegroundColor Yellow
Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "✅ ALLE SERVICES BEREIT!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Nächste Schritte:" -ForegroundColor Yellow
Write-Host "   1. Server läuft auf: http://localhost:3000" -ForegroundColor White
Write-Host "   2. Health Check: http://localhost:3000/health" -ForegroundColor White
Write-Host "   3. Starte ngrok in NEUEM Terminal: ngrok http 3000" -ForegroundColor White
Write-Host "   4. Konfiguriere Twilio Webhook mit ngrok URL" -ForegroundColor White
Write-Host ""
Write-Host "📖 Dokumentation:" -ForegroundColor Yellow
Write-Host "   - Schnellstart: SCHNELLSTART.md" -ForegroundColor White
Write-Host "   - Vollständige Anleitung: PROJEKT_SETUP_TODO.md" -ForegroundColor White
Write-Host ""
Write-Host "🛑 Server stoppen: Strg+C" -ForegroundColor Yellow
Write-Host ""
Write-Host "Starte Server..." -ForegroundColor Cyan
Write-Host ""

# Server starten
npm run dev

