# Test-Skript für WhatsApp AI Secretary mit ngrok
Write-Host "=== WhatsApp AI Secretary Test ===" -ForegroundColor Green

# 1. Starte ngrok (falls nicht bereits läuft)
Write-Host "1. Starte ngrok..." -ForegroundColor Yellow
$ngrokProcess = Get-Process -Name "ngrok" -ErrorAction SilentlyContinue
if (-not $ngrokProcess) {
    Start-Process -FilePath "C:\Users\purch\ngrok.exe" -ArgumentList "http", "3000" -WindowStyle Minimized
    Start-Sleep -Seconds 3
    Write-Host "ngrok gestartet" -ForegroundColor Green
} else {
    Write-Host "ngrok läuft bereits" -ForegroundColor Green
}

# 2. Hole ngrok URL
Write-Host "2. Hole ngrok URL..." -ForegroundColor Yellow
try {
    $ngrokResponse = Invoke-RestMethod -Uri "http://localhost:4040/api/tunnels" -Method GET
    $ngrokUrl = $ngrokResponse.tunnels[0].public_url
    Write-Host "ngrok URL: $ngrokUrl" -ForegroundColor Green
} catch {
    Write-Host "Fehler beim Abrufen der ngrok URL: $_" -ForegroundColor Red
    exit 1
}

# 3. Teste Health Endpoint
Write-Host "3. Teste Health Endpoint..." -ForegroundColor Yellow
try {
    $healthResponse = Invoke-WebRequest -Uri "$ngrokUrl/health" -Method GET
    Write-Host "Health Status: $($healthResponse.StatusCode)" -ForegroundColor Green
    Write-Host "Response: $($healthResponse.Content)" -ForegroundColor Cyan
} catch {
    Write-Host "Fehler beim Health Check: $_" -ForegroundColor Red
}

# 4. Teste WhatsApp Webhook
Write-Host "4. Teste WhatsApp Webhook..." -ForegroundColor Yellow
try {
    $webhookBody = @{
        Body = "Привет! Озвучи меня"
        From = "whatsapp:+491779640741"
        To = "whatsapp:+14155238886"
    }
    
    $webhookResponse = Invoke-WebRequest -Uri "$ngrokUrl/webhook/whatsapp" -Method POST -ContentType "application/x-www-form-urlencoded" -Body $webhookBody
    Write-Host "Webhook Status: $($webhookResponse.StatusCode)" -ForegroundColor Green
    Write-Host "Response: $($webhookResponse.Content)" -ForegroundColor Cyan
} catch {
    Write-Host "Fehler beim Webhook Test: $_" -ForegroundColor Red
}

# 5. Anweisungen für Twilio
Write-Host "`n=== Twilio Konfiguration ===" -ForegroundColor Green
Write-Host "1. Gehe zu Twilio Console -> Messaging -> Settings -> WhatsApp Sandbox" -ForegroundColor Yellow
Write-Host "2. Setze Webhook URL auf: $ngrokUrl/webhook/whatsapp" -ForegroundColor Yellow
Write-Host "3. Aktualisiere .env mit: PUBLIC_BASE_URL=$ngrokUrl" -ForegroundColor Yellow
Write-Host "4. Sende eine WhatsApp Nachricht an die Sandbox Nummer" -ForegroundColor Yellow

Write-Host "`n=== Test abgeschlossen ===" -ForegroundColor Green
